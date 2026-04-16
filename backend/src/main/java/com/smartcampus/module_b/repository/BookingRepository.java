package com.smartcampus.module_b.repository;

import com.smartcampus.module_b.entity.Booking;
import com.smartcampus.module_b.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Find all bookings for a specific user, ordered by booking date descending
     */
    List<Booking> findByUserIdOrderByBookingDateDesc(UUID userId);

    /**
     * Find all bookings for a specific user with status filter
     */
    @Query("""
        SELECT b FROM Booking b 
        WHERE b.userId = :userId 
        AND (:status IS NULL OR b.status = :status)
        ORDER BY b.bookingDate DESC
    """)
    List<Booking> findByUserIdWithStatusFilter(
            @Param("userId") UUID userId,
            @Param("status") BookingStatus status
    );

    /**
     * Find all bookings with optional filters (for admin)
     */
    @Query("""
        SELECT b FROM Booking b 
        WHERE (:status IS NULL OR b.status = :status)
        AND (:resourceId IS NULL OR b.resourceId = :resourceId)
        ORDER BY b.bookingDate DESC
    """)
    List<Booking> findAllWithFilters(
            @Param("status") BookingStatus status,
            @Param("resourceId") Long resourceId
    );

    /**
     * Check if a booking exists for same resource on same date with overlapping time
     * Used to detect conflicts before creating new booking
     * 
     * Conflict exists if:
     * - Same resource
     * - Same booking date
     * - Status is APPROVED
     * - Time ranges overlap: existing.startTime < newEndTime AND existing.endTime > newStartTime
     * - Not the same booking ID (excludeId)
     */
    @Query("""
        SELECT COUNT(b) > 0 FROM Booking b
        WHERE b.resourceId = :resourceId
        AND b.bookingDate = :date
        AND b.status = :status
        AND b.id != :excludeId
        AND b.startTime < :endTime
        AND b.endTime > :startTime
    """)
    boolean existsConflict(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId,
            @Param("status") BookingStatus status
    );

    /**
     * Find all bookings for a specific resource on a specific date with APPROVED status
     */
    List<Booking> findByResourceIdAndBookingDateAndStatus(
            Long resourceId,
            LocalDate bookingDate,
            BookingStatus status
    );
}
