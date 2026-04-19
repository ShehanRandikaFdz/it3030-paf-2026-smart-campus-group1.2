package com.smartcampus.common;

import com.smartcampus.module_a.repository.ResourceRepository;
import com.smartcampus.module_b.entity.Booking;
import com.smartcampus.module_b.repository.BookingRepository;
import com.smartcampus.module_c.entity.Incident;
import com.smartcampus.module_c.repository.IncidentRepository;
import com.smartcampus.module_d.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ResourceRepository resourceRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    public DashboardStatsDTO getStats() {
        DashboardStatsDTO dto = new DashboardStatsDTO();

        // ── Bookings ──
        List<Booking> allBookings = bookingRepository.findAll();
        dto.setTotalBookings(allBookings.size());

        Map<String, Long> bookingsByStatus = allBookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getStatus().name(),
                        Collectors.counting()));
        dto.setBookingsByStatus(bookingsByStatus);

        // Peak booking times (group by hour of startTime)
        Map<String, Long> bookingsByHour = new LinkedHashMap<>();
        String[] labels = {"8AM","9AM","10AM","11AM","12PM","1PM","2PM","3PM","4PM","5PM","6PM"};
        int[] hours = {8,9,10,11,12,13,14,15,16,17,18};
        for (int i = 0; i < hours.length; i++) {
            final int hour = hours[i];
            long count = allBookings.stream()
                    .filter(b -> b.getStartTime() != null && b.getStartTime().getHour() == hour)
                    .count();
            bookingsByHour.put(labels[i], count);
        }
        dto.setBookingsByHour(bookingsByHour);

        // ── Resources ──
        long totalResources = resourceRepository.count();
        dto.setTotalResources(totalResources);
        // Active resources = those with ACTIVE status
        long activeResources = resourceRepository.findAll().stream()
                .filter(r -> r.getStatus() != null && r.getStatus().name().equals("ACTIVE"))
                .count();
        dto.setActiveResources(activeResources);

        // ── Incidents ──
        List<Incident> allIncidents = incidentRepository.findAll();
        dto.setTotalTickets(allIncidents.size());

        long openTickets = allIncidents.stream()
                .filter(i -> i.getStatus().name().equals("OPEN") || i.getStatus().name().equals("IN_PROGRESS"))
                .count();
        dto.setOpenTickets(openTickets);

        Map<String, Long> ticketsByCategory = allIncidents.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getCategory().name(),
                        Collectors.counting()));
        dto.setTicketsByCategory(ticketsByCategory);

        Map<String, Long> ticketsByStatus = allIncidents.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getStatus().name(),
                        Collectors.counting()));
        dto.setTicketsByStatus(ticketsByStatus);

        // ── Users ──
        dto.setActiveUsers(userProfileRepository.count());

        return dto;
    }
}
