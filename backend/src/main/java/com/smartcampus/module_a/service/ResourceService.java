package com.smartcampus.module_a.service;

import com.smartcampus.module_a.dto.ResourceRequestDTO;
import com.smartcampus.module_a.dto.ResourceResponseDTO;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ResourceService {
    Page<ResourceResponseDTO> getAllResources(Pageable pageable);
    ResourceResponseDTO getResourceById(Long resourceId);
    Page<ResourceResponseDTO> searchResources(ResourceType type, Integer capacity, String location, ResourceStatus status, Pageable pageable);
    ResourceResponseDTO createResource(ResourceRequestDTO requestDTO);
    ResourceResponseDTO updateResource(Long resourceId, ResourceRequestDTO requestDTO);
    ResourceResponseDTO updateResourceStatus(Long resourceId, ResourceStatus status);
    void deleteResource(Long resourceId);
    boolean isResourceActive(Long resourceId);
}
