package com.smartcampus.module_a.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.module_a.dto.ResourceRequestDTO;
import com.smartcampus.module_a.dto.ResourceResponseDTO;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import com.smartcampus.module_a.service.ResourceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ResourceController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simple unit test, or use @WithMockUser
public class ResourceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ResourceService resourceService;

    @Autowired
    private ObjectMapper objectMapper;

    private ResourceResponseDTO mockResponseDTO;
    private ResourceRequestDTO mockRequestDTO;

    @BeforeEach
    void setUp() {
        mockResponseDTO = new ResourceResponseDTO();
        mockResponseDTO.setId(1L);
        mockResponseDTO.setName("Test Resource");
        mockResponseDTO.setType(ResourceType.LECTURE_HALL);
        mockResponseDTO.setLocation("Block A");
        mockResponseDTO.setStatus(ResourceStatus.ACTIVE);

        mockRequestDTO = new ResourceRequestDTO();
        mockRequestDTO.setName("Test Resource");
        mockRequestDTO.setType(ResourceType.LECTURE_HALL);
        mockRequestDTO.setLocation("Block A");
    }

    @Test
    void testGetAllResources() throws Exception {
        Mockito.when(resourceService.getAllResources(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(mockResponseDTO), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/v1/resources")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].name").value("Test Resource"));
    }

    @Test
    void testGetResourceById() throws Exception {
        Mockito.when(resourceService.getResourceById(1L)).thenReturn(mockResponseDTO);

        mockMvc.perform(get("/api/v1/resources/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Resource"));
    }

    @Test
    void testCreateResource() throws Exception {
        Mockito.when(resourceService.createResource(any(ResourceRequestDTO.class)))
                .thenReturn(mockResponseDTO);

        mockMvc.perform(post("/api/v1/resources")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockRequestDTO)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Resource"));
    }

    @Test
    void testUpdateResource() throws Exception {
        Mockito.when(resourceService.updateResource(eq(1L), any(ResourceRequestDTO.class)))
                .thenReturn(mockResponseDTO);

        mockMvc.perform(put("/api/v1/resources/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(mockRequestDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Test Resource"));
    }

    @Test
    void testDeleteResource() throws Exception {
        Mockito.doNothing().when(resourceService).deleteResource(1L);

        mockMvc.perform(delete("/api/v1/resources/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
