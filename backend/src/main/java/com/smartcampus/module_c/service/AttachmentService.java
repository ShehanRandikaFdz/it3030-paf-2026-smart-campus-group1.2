package com.smartcampus.module_c.service;

import com.smartcampus.module_c.dto.AttachmentResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface AttachmentService {

    List<AttachmentResponseDTO> uploadAttachments(Long incidentId, List<MultipartFile> files, UUID userId);

    void deleteAttachment(Long incidentId, Long attachmentId, UUID userId, String userRole);

    List<AttachmentResponseDTO> getAttachmentsByIncidentId(Long incidentId);
}
