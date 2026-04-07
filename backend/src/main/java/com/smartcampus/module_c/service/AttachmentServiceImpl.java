package com.smartcampus.module_c.service;

import com.smartcampus.module_c.dto.AttachmentResponseDTO;
import com.smartcampus.module_c.entity.Incident;
import com.smartcampus.module_c.entity.IncidentAttachment;
import com.smartcampus.module_c.exception.AttachmentLimitException;
import com.smartcampus.module_c.exception.FileTooLargeException;
import com.smartcampus.module_c.exception.ForbiddenException;
import com.smartcampus.module_c.exception.InvalidFileTypeException;
import com.smartcampus.module_c.repository.AttachmentRepository;
import com.smartcampus.module_c.repository.IncidentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final IncidentRepository incidentRepository;
    private final RestTemplate restTemplate;

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.service-key}")
    private String supabaseServiceKey;

    private static final String BUCKET = "incident-attachments";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_ATTACHMENTS_PER_INCIDENT = 3;

    @Override
    public List<AttachmentResponseDTO> uploadAttachments(Long incidentId, List<MultipartFile> files, UUID userId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new EntityNotFoundException("Incident not found with id: " + incidentId));

        long existingCount = attachmentRepository.countByIncidentId(incidentId);

        if (existingCount + files.size() > MAX_ATTACHMENTS_PER_INCIDENT) {
            throw new AttachmentLimitException(
                    String.format("Maximum %d attachments allowed per incident. Currently %d, trying to add %d.",
                            MAX_ATTACHMENTS_PER_INCIDENT, existingCount, files.size()));
        }

        List<AttachmentResponseDTO> results = new ArrayList<>();

        for (MultipartFile file : files) {
            validateFile(file);

            try {
                String fileUrl = uploadToSupabaseStorage(file, incidentId);

                IncidentAttachment attachment = IncidentAttachment.builder()
                        .incident(incident)
                        .fileName(file.getOriginalFilename())
                        .fileUrl(fileUrl)
                        .fileSize(file.getSize())
                        .mimeType(file.getContentType())
                        .uploadedBy(userId)
                        .build();

                IncidentAttachment saved = attachmentRepository.save(attachment);

                results.add(AttachmentResponseDTO.builder()
                        .id(saved.getId())
                        .incidentId(incidentId)
                        .fileName(saved.getFileName())
                        .fileUrl(saved.getFileUrl())
                        .fileSize(saved.getFileSize())
                        .mimeType(saved.getMimeType())
                        .uploadedBy(saved.getUploadedBy())
                        .uploadedAt(saved.getUploadedAt())
                        .build());
            } catch (IOException e) {
                log.error("Failed to upload file: {}", file.getOriginalFilename(), e);
                throw new RuntimeException("Failed to upload file: " + file.getOriginalFilename(), e);
            }
        }

        return results;
    }

    @Override
    public void deleteAttachment(Long incidentId, Long attachmentId, UUID userId, String userRole) {
        IncidentAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found with id: " + attachmentId));

        if (!attachment.getIncident().getId().equals(incidentId)) {
            throw new EntityNotFoundException("Attachment does not belong to the specified incident");
        }

        boolean isOwner = attachment.getUploadedBy().equals(userId);
        boolean isAdmin = "ADMIN".equals(userRole);

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You can only delete your own attachments");
        }

        // Delete from Supabase Storage
        try {
            deleteFromSupabaseStorage(attachment.getFileUrl());
        } catch (Exception e) {
            log.warn("Failed to delete file from storage: {}", attachment.getFileUrl(), e);
        }

        attachmentRepository.delete(attachment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentResponseDTO> getAttachmentsByIncidentId(Long incidentId) {
        return attachmentRepository.findByIncidentIdOrderByUploadedAtDesc(incidentId).stream()
                .map(a -> AttachmentResponseDTO.builder()
                        .id(a.getId())
                        .incidentId(incidentId)
                        .fileName(a.getFileName())
                        .fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize())
                        .mimeType(a.getMimeType())
                        .uploadedBy(a.getUploadedBy())
                        .uploadedAt(a.getUploadedAt())
                        .build())
                .toList();
    }

    // ---- Private helpers ----

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidFileTypeException("File is empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new InvalidFileTypeException("Only image files are allowed. Got: " + contentType);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileTooLargeException("File size must not exceed 5MB. Got: " + (file.getSize() / 1024 / 1024) + "MB");
        }
    }

    private String uploadToSupabaseStorage(MultipartFile file, Long incidentId) throws IOException {
        String fileName = incidentId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        String uploadUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + fileName;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseServiceKey);
        headers.setContentType(MediaType.parseMediaType(file.getContentType()));

        HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);

        try {
            restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);
        } catch (Exception e) {
            log.error("Supabase Storage upload failed for file: {}", fileName, e);
            throw new IOException("Failed to upload to Supabase Storage", e);
        }

        return supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/" + fileName;
    }

    private void deleteFromSupabaseStorage(String fileUrl) {
        // Extract the path from the public URL
        String prefix = supabaseUrl + "/storage/v1/object/public/" + BUCKET + "/";
        if (!fileUrl.startsWith(prefix)) return;

        String filePath = fileUrl.substring(prefix.length());
        String deleteUrl = supabaseUrl + "/storage/v1/object/" + BUCKET + "/" + filePath;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + supabaseServiceKey);

        HttpEntity<Void> entity = new HttpEntity<>(headers);
        restTemplate.exchange(deleteUrl, HttpMethod.DELETE, entity, String.class);
    }
}
