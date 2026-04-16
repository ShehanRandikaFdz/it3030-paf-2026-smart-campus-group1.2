package com.smartcampus.module_a.service;

import com.smartcampus.module_a.dto.ResourceRequestDTO;
import com.smartcampus.module_a.dto.ResourceResponseDTO;
import com.smartcampus.module_a.entity.Resource;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import com.smartcampus.module_a.exception.ResourceNotFoundException;
import com.smartcampus.module_a.exception.DuplicateResourceException;
import com.smartcampus.module_a.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;

    @Override
    public Page<ResourceResponseDTO> getAllResources(Pageable pageable) {
        return resourceRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    public ResourceResponseDTO getResourceById(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));
        return mapToResponse(resource);
    }

    @Override
    public Page<ResourceResponseDTO> searchResources(ResourceType type, Integer capacity, String location, ResourceStatus status, Pageable pageable) {
        return resourceRepository.searchResources(type, capacity, location, status, pageable).map(this::mapToResponse);
    }

    @Override
    public ResourceResponseDTO createResource(ResourceRequestDTO requestDTO) {
        if (resourceRepository.existsByName(requestDTO.getName())) {
            throw new DuplicateResourceException("Resource already exists with name: " + requestDTO.getName());
        }
        Resource resource = new Resource();
        mapToEntity(requestDTO, resource);
        Resource saved = resourceRepository.save(resource);
        return mapToResponse(saved);
    }

    @Override
    public ResourceResponseDTO updateResource(Long resourceId, ResourceRequestDTO requestDTO) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));
        mapToEntity(requestDTO, resource);
        Resource saved = resourceRepository.save(resource);
        return mapToResponse(saved);
    }

    @Override
    public ResourceResponseDTO updateResourceStatus(Long resourceId, ResourceStatus status) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));
        resource.setStatus(status);
        Resource saved = resourceRepository.save(resource);
        return mapToResponse(saved);
    }

    @Override
    public void deleteResource(Long resourceId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with ID: " + resourceId));
        resourceRepository.delete(resource);
    }

    @Override
    public boolean isResourceActive(Long resourceId) {
        return resourceRepository.findById(resourceId)
                .map(r -> r.getStatus() == ResourceStatus.ACTIVE)
                .orElse(false);
    }

    private void mapToEntity(ResourceRequestDTO dto, Resource entity) {
        entity.setName(dto.getName());
        entity.setType(dto.getType());
        entity.setCapacity(dto.getCapacity());
        entity.setLocation(dto.getLocation());
        entity.setDescription(dto.getDescription());
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        } else if (entity.getStatus() == null) {
            entity.setStatus(ResourceStatus.ACTIVE);
        }
        entity.setAvailabilityStart(dto.getAvailabilityStart());
        entity.setAvailabilityEnd(dto.getAvailabilityEnd());
        entity.setAvailableDays(dto.getAvailableDays());
        entity.setImageUrl(dto.getImageUrl());
    }

    private ResourceResponseDTO mapToResponse(Resource entity) {
        ResourceResponseDTO dto = new ResourceResponseDTO();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setType(entity.getType());
        dto.setCapacity(entity.getCapacity());
        dto.setLocation(entity.getLocation());
        dto.setDescription(entity.getDescription());
        dto.setStatus(entity.getStatus());
        dto.setAvailabilityStart(entity.getAvailabilityStart());
        dto.setAvailabilityEnd(entity.getAvailabilityEnd());
        dto.setAvailableDays(entity.getAvailableDays());
        dto.setImageUrl(entity.getImageUrl());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }
}
