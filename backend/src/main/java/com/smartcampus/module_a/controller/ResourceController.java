package com.smartcampus.module_a.controller;

import com.smartcampus.common.ApiResponse;
import com.smartcampus.module_a.dto.ResourceRequestDTO;
import com.smartcampus.module_a.dto.ResourceResponseDTO;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import com.smartcampus.module_a.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ResourceResponseDTO>>> getAllResources(Pageable pageable) {
        Page<ResourceResponseDTO> page = resourceService.getAllResources(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resources fetched successfully", page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponseDTO>> getResourceById(@PathVariable Long id) {
        ResourceResponseDTO dto = resourceService.getResourceById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resource fetched successfully", dto));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<ResourceResponseDTO>>> searchResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ResourceStatus status,
            Pageable pageable) {
        Page<ResourceResponseDTO> page = resourceService.searchResources(type, capacity, location, status, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resources filtered successfully", page));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ResourceResponseDTO>> createResource(@Valid @RequestBody ResourceRequestDTO requestDTO) {
        ResourceResponseDTO created = resourceService.createResource(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Resource created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ResourceResponseDTO>> updateResource(@PathVariable Long id, @Valid @RequestBody ResourceRequestDTO requestDTO) {
        ResourceResponseDTO updated = resourceService.updateResource(id, requestDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resource updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ResourceResponseDTO>> updateResourceStatus(@PathVariable Long id, @RequestBody Map<String, String> statusUpdate) {
        ResourceStatus status = ResourceStatus.valueOf(statusUpdate.get("status"));
        ResourceResponseDTO updated = resourceService.updateResourceStatus(id, status);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resource status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Resource deleted successfully", null));
    }
}
