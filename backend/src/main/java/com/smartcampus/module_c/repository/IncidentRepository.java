package com.smartcampus.module_c.repository;

import com.smartcampus.module_c.entity.Incident;
import com.smartcampus.module_c.enums.IncidentCategory;
import com.smartcampus.module_c.enums.IncidentPriority;
import com.smartcampus.module_c.enums.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByReportedByOrderByCreatedAtDesc(UUID reportedBy);

    List<Incident> findByStatusOrderByCreatedAtDesc(IncidentStatus status);

    List<Incident> findByCategoryOrderByCreatedAtDesc(IncidentCategory category);

    List<Incident> findByPriorityOrderByCreatedAtDesc(IncidentPriority priority);

    List<Incident> findByAssignedToOrderByCreatedAtDesc(UUID assignedTo);

    List<Incident> findAllByOrderByCreatedAtDesc();

    @Query("SELECT i FROM Incident i WHERE " +
           "(:status IS NULL OR i.status = :status) AND " +
           "(:category IS NULL OR i.category = :category) AND " +
           "(:priority IS NULL OR i.priority = :priority) " +
           "ORDER BY i.createdAt DESC")
    List<Incident> findWithFilters(
            @Param("status") IncidentStatus status,
            @Param("category") IncidentCategory category,
            @Param("priority") IncidentPriority priority);

    @Query("SELECT i FROM Incident i WHERE i.reportedBy = :reportedBy AND " +
           "(:status IS NULL OR i.status = :status) " +
           "ORDER BY i.createdAt DESC")
    List<Incident> findByReportedByWithStatusFilter(
            @Param("reportedBy") UUID reportedBy,
            @Param("status") IncidentStatus status);
}
