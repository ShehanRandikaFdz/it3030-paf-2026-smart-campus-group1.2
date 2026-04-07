package com.smartcampus.module_c.service;

import com.smartcampus.module_c.dto.*;
import com.smartcampus.module_c.enums.IncidentCategory;
import com.smartcampus.module_c.enums.IncidentPriority;
import com.smartcampus.module_c.enums.IncidentStatus;

import java.util.List;
import java.util.UUID;

public interface IncidentService {

    IncidentResponseDTO createIncident(IncidentRequestDTO request, UUID userId, String userEmail);

    List<IncidentResponseDTO> getIncidentsByUser(UUID userId, IncidentStatus statusFilter);

    List<IncidentResponseDTO> getAllIncidents(IncidentStatus status, IncidentCategory category, IncidentPriority priority);

    IncidentResponseDTO getIncidentById(Long id);

    IncidentResponseDTO updateIncidentStatus(Long id, IncidentUpdateStatusDTO request);

    IncidentResponseDTO assignTechnician(Long id, AssignTechnicianDTO request);

    void deleteIncident(Long id);
}
