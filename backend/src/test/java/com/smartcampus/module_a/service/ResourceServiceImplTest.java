package com.smartcampus.module_a.service;

import com.smartcampus.module_a.dto.ResourceRequestDTO;
import com.smartcampus.module_a.dto.ResourceResponseDTO;
import com.smartcampus.module_a.entity.Resource;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import com.smartcampus.module_a.exception.ResourceNotFoundException;
import com.smartcampus.module_a.exception.DuplicateResourceException;
import com.smartcampus.module_a.repository.ResourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ResourceServiceImplTest {

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private ResourceServiceImpl resourceService;

    private Resource resource;
    private ResourceRequestDTO requestDTO;

    @BeforeEach
    void setUp() {
        resource = new Resource();
        resource.setId(1L);
        resource.setName("Lab 1");
        resource.setType(ResourceType.LAB);
        resource.setCapacity(30);
        resource.setLocation("Block A");
        resource.setStatus(ResourceStatus.ACTIVE);

        requestDTO = new ResourceRequestDTO();
        requestDTO.setName("Lab 1");
        requestDTO.setType(ResourceType.LAB);
        requestDTO.setCapacity(30);
        requestDTO.setLocation("Block A");
        requestDTO.setStatus(ResourceStatus.ACTIVE);
    }

    @Test
    void testCreateResource_success() {
        when(resourceRepository.save(any(Resource.class))).thenReturn(resource);

        ResourceResponseDTO result = resourceService.createResource(requestDTO);

        assertNotNull(result);
        assertEquals("Lab 1", result.getName());
        assertEquals(ResourceType.LAB, result.getType());
        verify(resourceRepository, times(1)).save(any(Resource.class));
    }

    @Test
    void testCreateResource_duplicateName_throwsException() {
        when(resourceRepository.existsByName(requestDTO.getName())).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> {
            resourceService.createResource(requestDTO);
        });
    }

    @Test
    void testGetResourceById_notFound_throws404() {
        when(resourceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            resourceService.getResourceById(99L);
        });
    }

    @Test
    void testSearchResources_byType() {
        Page<Resource> page = new PageImpl<>(Collections.singletonList(resource));
        when(resourceRepository.searchResources(eq(ResourceType.LAB), any(), any(), any(), any()))
                .thenReturn(page);

        Page<ResourceResponseDTO> result = resourceService.searchResources(ResourceType.LAB, null, null, null, PageRequest.of(0, 10));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(ResourceType.LAB, result.getContent().get(0).getType());
    }

    @Test
    void testUpdateResourceStatus_toOutOfService() {
        when(resourceRepository.findById(1L)).thenReturn(Optional.of(resource));
        when(resourceRepository.save(any(Resource.class))).thenReturn(resource);

        ResourceResponseDTO result = resourceService.updateResourceStatus(1L, ResourceStatus.OUT_OF_SERVICE);

        assertNotNull(result);
        verify(resourceRepository, times(1)).save(resource);
        assertEquals(ResourceStatus.OUT_OF_SERVICE, resource.getStatus());
    }
}
