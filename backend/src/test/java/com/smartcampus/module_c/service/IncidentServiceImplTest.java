package com.smartcampus.module_c.service;

import com.smartcampus.module_c.dto.*;
import com.smartcampus.module_c.entity.Incident;
import com.smartcampus.module_c.enums.IncidentCategory;
import com.smartcampus.module_c.enums.IncidentPriority;
import com.smartcampus.module_c.enums.IncidentStatus;
import com.smartcampus.module_c.exception.InvalidStatusTransitionException;
import com.smartcampus.module_c.repository.IncidentRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceImplTest {

    @Mock
    private IncidentRepository incidentRepository;

    @InjectMocks
    private IncidentServiceImpl incidentService;

    private UUID testUserId;
    private Incident sampleIncident;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        sampleIncident = Incident.builder()
                .id(1L)
                .title("Broken AC in Lab A")
                .description("AC unit not working in Lab A101")
                .category(IncidentCategory.ELECTRICAL)
                .priority(IncidentPriority.HIGH)
                .status(IncidentStatus.OPEN)
                .reportedBy(testUserId)
                .reporterEmail("student@sliit.lk")
                .location("Lab A101, Block A")
                .build();
    }

    @Test
    @DisplayName("Should create incident ticket successfully")
    void createIncident_Success() {
        IncidentRequestDTO request = new IncidentRequestDTO();
        request.setTitle("Broken AC in Lab A");
        request.setDescription("AC unit not working");
        request.setCategory(IncidentCategory.ELECTRICAL);
        request.setPriority(IncidentPriority.HIGH);
        request.setLocation("Lab A101");

        when(incidentRepository.save(any(Incident.class))).thenReturn(sampleIncident);

        IncidentResponseDTO result = incidentService.createIncident(request, testUserId, "student@sliit.lk");

        assertNotNull(result);
        assertEquals("Broken AC in Lab A", result.getTitle());
        assertEquals(IncidentStatus.OPEN, result.getStatus());
        verify(incidentRepository, times(1)).save(any(Incident.class));
    }

    @Test
    @DisplayName("Should get incident by ID successfully")
    void getIncidentById_Success() {
        when(incidentRepository.findById(1L)).thenReturn(Optional.of(sampleIncident));

        IncidentResponseDTO result = incidentService.getIncidentById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Broken AC in Lab A", result.getTitle());
    }

    @Test
    @DisplayName("Should throw EntityNotFoundException when incident not found")
    void getIncidentById_NotFound() {
        when(incidentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> {
            incidentService.getIncidentById(999L);
        });
    }

    @Test
    @DisplayName("Should update status from OPEN to IN_PROGRESS")
    void updateStatus_OpenToInProgress() {
        IncidentUpdateStatusDTO request = new IncidentUpdateStatusDTO();
        request.setStatus(IncidentStatus.IN_PROGRESS);

        when(incidentRepository.findById(1L)).thenReturn(Optional.of(sampleIncident));
        when(incidentRepository.save(any(Incident.class))).thenReturn(sampleIncident);

        IncidentResponseDTO result = incidentService.updateIncidentStatus(1L, request);

        assertNotNull(result);
        verify(incidentRepository, times(1)).save(any(Incident.class));
    }

    @Test
    @DisplayName("Should reject invalid status transition OPEN -> RESOLVED")
    void updateStatus_InvalidTransition() {
        IncidentUpdateStatusDTO request = new IncidentUpdateStatusDTO();
        request.setStatus(IncidentStatus.RESOLVED);
        request.setResolutionNotes("Fixed");

        when(incidentRepository.findById(1L)).thenReturn(Optional.of(sampleIncident));

        assertThrows(InvalidStatusTransitionException.class, () -> {
            incidentService.updateIncidentStatus(1L, request);
        });
    }

    @Test
    @DisplayName("Should assign technician and auto-transition to IN_PROGRESS")
    void assignTechnician_Success() {
        UUID techId = UUID.randomUUID();
        AssignTechnicianDTO request = new AssignTechnicianDTO();
        request.setTechnicianId(techId);
        request.setTechnicianEmail("tech@sliit.lk");

        when(incidentRepository.findById(1L)).thenReturn(Optional.of(sampleIncident));
        when(incidentRepository.save(any(Incident.class))).thenReturn(sampleIncident);

        IncidentResponseDTO result = incidentService.assignTechnician(1L, request);

        assertNotNull(result);
        assertEquals(IncidentStatus.IN_PROGRESS, sampleIncident.getStatus());
        assertEquals(techId, sampleIncident.getAssignedTo());
    }

    @Test
    @DisplayName("Should delete incident successfully")
    void deleteIncident_Success() {
        when(incidentRepository.findById(1L)).thenReturn(Optional.of(sampleIncident));
        doNothing().when(incidentRepository).delete(sampleIncident);

        assertDoesNotThrow(() -> incidentService.deleteIncident(1L));
        verify(incidentRepository, times(1)).delete(sampleIncident);
    }

    @Test
    @DisplayName("Should throw when deleting non-existent incident")
    void deleteIncident_NotFound() {
        when(incidentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> {
            incidentService.deleteIncident(999L);
        });
    }
}
