package com.smartcampus.common;

import java.util.Map;

public class DashboardStatsDTO {

    private long totalBookings;
    private long totalResources;
    private long activeResources;
    private long openTickets;
    private long totalTickets;
    private long activeUsers;

    // Category breakdown for donut chart
    private Map<String, Long> ticketsByCategory;

    // Status breakdown
    private Map<String, Long> ticketsByStatus;
    private Map<String, Long> bookingsByStatus;

    // Booking counts by hour for bar chart
    private Map<String, Long> bookingsByHour;

    public DashboardStatsDTO() {}

    // ----- Getters & Setters -----

    public long getTotalBookings() { return totalBookings; }
    public void setTotalBookings(long totalBookings) { this.totalBookings = totalBookings; }

    public long getTotalResources() { return totalResources; }
    public void setTotalResources(long totalResources) { this.totalResources = totalResources; }

    public long getActiveResources() { return activeResources; }
    public void setActiveResources(long activeResources) { this.activeResources = activeResources; }

    public long getOpenTickets() { return openTickets; }
    public void setOpenTickets(long openTickets) { this.openTickets = openTickets; }

    public long getTotalTickets() { return totalTickets; }
    public void setTotalTickets(long totalTickets) { this.totalTickets = totalTickets; }

    public long getActiveUsers() { return activeUsers; }
    public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

    public Map<String, Long> getTicketsByCategory() { return ticketsByCategory; }
    public void setTicketsByCategory(Map<String, Long> ticketsByCategory) { this.ticketsByCategory = ticketsByCategory; }

    public Map<String, Long> getTicketsByStatus() { return ticketsByStatus; }
    public void setTicketsByStatus(Map<String, Long> ticketsByStatus) { this.ticketsByStatus = ticketsByStatus; }

    public Map<String, Long> getBookingsByStatus() { return bookingsByStatus; }
    public void setBookingsByStatus(Map<String, Long> bookingsByStatus) { this.bookingsByStatus = bookingsByStatus; }

    public Map<String, Long> getBookingsByHour() { return bookingsByHour; }
    public void setBookingsByHour(Map<String, Long> bookingsByHour) { this.bookingsByHour = bookingsByHour; }
}
