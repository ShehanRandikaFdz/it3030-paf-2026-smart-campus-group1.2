package com.smartcampus.module_a.repository;

import com.smartcampus.module_a.entity.Resource;
import com.smartcampus.module_a.enums.ResourceStatus;
import com.smartcampus.module_a.enums.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    boolean existsByName(String name);

    @Query("SELECT r FROM Resource r WHERE " +
           "(:type IS NULL OR r.type = :type) AND " +
           "(:capacity IS NULL OR r.capacity >= :capacity) AND " +
           "(:location IS NULL OR LOWER(r.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:status IS NULL OR r.status = :status)")
    Page<Resource> searchResources(@Param("type") ResourceType type,
                                   @Param("capacity") Integer capacity,
                                   @Param("location") String location,
                                   @Param("status") ResourceStatus status,
                                   Pageable pageable);
}
