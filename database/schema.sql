-- =============================================
-- Smart Campus Operations Hub — Complete Database Schema
-- All modules: A (Resources), B (Bookings), C (Incidents), D+E (Notifications + Auth)
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- MODULE A — Facilities & Assets (Ranushi)
-- =============================================
CREATE TABLE IF NOT EXISTS resources (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    type                VARCHAR(50) NOT NULL,          -- LECTURE_HALL, LAB, MEETING_ROOM, EQUIPMENT
    capacity            INT,                            -- NULL for equipment
    location            VARCHAR(150) NOT NULL,
    description         TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE
    availability_start  TIME,                           -- e.g. 08:00
    availability_end    TIME,                           -- e.g. 18:00
    available_days      VARCHAR(50),                    -- e.g. "MON,TUE,WED,THU,FRI"
    image_url           TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MODULE B — Booking Management (Shashindi)
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
    id              BIGSERIAL PRIMARY KEY,
    resource_id     BIGINT NOT NULL REFERENCES resources(id),
    user_id         UUID NOT NULL,
    user_email      VARCHAR(150) NOT NULL,
    title           VARCHAR(150) NOT NULL,
    purpose         TEXT NOT NULL,
    booking_date    DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    attendees       INT DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED, CANCELLED
    admin_note      TEXT,
    reviewed_by     UUID,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_resource_date
    ON bookings(resource_id, booking_date, status);

-- =============================================
-- MODULE C — Incident Tickets (Shehan)
-- =============================================
CREATE TABLE IF NOT EXISTS incidents (
    id              BIGSERIAL PRIMARY KEY,
    resource_id     BIGINT,
    location        VARCHAR(150) NOT NULL,
    reported_by     UUID NOT NULL,
    reporter_email  VARCHAR(150) NOT NULL,
    title           VARCHAR(150) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(50) NOT NULL,              -- ELECTRICAL, PLUMBING, EQUIPMENT_FAULT, NETWORK, CLEANING, SAFETY, OTHER
    priority        VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',  -- LOW, MEDIUM, HIGH, CRITICAL
    status          VARCHAR(20) NOT NULL DEFAULT 'OPEN',    -- OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    assigned_to     UUID,
    assignee_email  VARCHAR(150),
    rejection_reason TEXT,
    contact_phone   VARCHAR(20),
    resolution_notes TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_attachments (
    id          BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_url    TEXT NOT NULL,
    file_size   BIGINT,
    mime_type   VARCHAR(100),
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_comments (
    id          BIGSERIAL PRIMARY KEY,
    incident_id BIGINT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL,
    author_email VARCHAR(150) NOT NULL,
    author_role  VARCHAR(20) NOT NULL,          -- USER, ADMIN, TECHNICIAN
    content     TEXT NOT NULL,
    is_edited   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Module C Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incident_attachments_incident_id ON incident_attachments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON incident_comments(incident_id);

-- =============================================
-- MODULE D+E — Notifications + User Profiles (Thisangi)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id          UUID PRIMARY KEY,
    email       VARCHAR(150) NOT NULL,
    full_name   VARCHAR(100),
    role        VARCHAR(20) NOT NULL DEFAULT 'USER',  -- USER, ADMIN, TECHNICIAN
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL,
    title       VARCHAR(150) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50) NOT NULL,                  -- BOOKING_APPROVED, BOOKING_REJECTED, TICKET_STATUS_CHANGED, etc.
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    related_id  BIGINT,
    related_type VARCHAR(50),                          -- 'BOOKING' or 'INCIDENT'
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
    ON notifications(user_id, is_read);


-- =============================================
-- SEED DATA
-- =============================================

-- Demo users (fixed UUIDs)
-- Reporter/User:  11111111-1111-1111-1111-111111111111
-- Technician:     22222222-2222-2222-2222-222222222222
-- Admin:          33333333-3333-3333-3333-333333333333

INSERT INTO user_profiles (id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Shehan Randika', 'USER'),
('22222222-2222-2222-2222-222222222222', 'tech1@campus.lk', 'Tech User', 'TECHNICIAN'),
('33333333-3333-3333-3333-333333333333', 'admin@campus.lk', 'Admin User', 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- MODULE A: Seed Resources (10 records)
INSERT INTO resources (name, type, capacity, location, description, status, availability_start, availability_end, available_days) VALUES
('Lab A101', 'LAB', 30, 'Block A, Floor 1', 'Computer lab with 30 workstations, projector, and whiteboard', 'ACTIVE', '08:00', '18:00', 'MON,TUE,WED,THU,FRI'),
('Lab B202', 'LAB', 25, 'Block B, Floor 2', 'Electronics lab with oscilloscopes and soldering stations', 'ACTIVE', '08:00', '17:00', 'MON,TUE,WED,THU,FRI'),
('Lecture Hall C101', 'LECTURE_HALL', 150, 'Block C, Floor 1', 'Large lecture hall with tiered seating and dual projectors', 'ACTIVE', '07:00', '21:00', 'MON,TUE,WED,THU,FRI,SAT'),
('Lecture Hall D201', 'LECTURE_HALL', 80, 'Block D, Floor 2', 'Medium lecture hall with smart board', 'ACTIVE', '08:00', '18:00', 'MON,TUE,WED,THU,FRI'),
('Meeting Room E101', 'MEETING_ROOM', 10, 'Block E, Floor 1', 'Small meeting room with video conferencing setup', 'ACTIVE', '08:00', '20:00', 'MON,TUE,WED,THU,FRI,SAT'),
('Meeting Room E102', 'MEETING_ROOM', 20, 'Block E, Floor 1', 'Large meeting room with whiteboard and projector', 'ACTIVE', '08:00', '20:00', 'MON,TUE,WED,THU,FRI'),
('Portable Projector #1', 'EQUIPMENT', NULL, 'IT Department', 'Epson EB-X51 portable projector', 'ACTIVE', NULL, NULL, NULL),
('Portable Projector #2', 'EQUIPMENT', NULL, 'IT Department', 'Epson EB-X51 portable projector', 'OUT_OF_SERVICE', NULL, NULL, NULL),
('Conference Hall F001', 'LECTURE_HALL', 300, 'Block F, Ground Floor', 'Main auditorium with stage, sound system, and lighting', 'ACTIVE', '07:00', '22:00', 'MON,TUE,WED,THU,FRI,SAT,SUN'),
('Lab A102', 'LAB', 35, 'Block A, Floor 1', 'Network lab with Cisco equipment and server racks', 'UNDER_MAINTENANCE', '08:00', '18:00', 'MON,TUE,WED,THU,FRI');

-- MODULE B: Seed Bookings
INSERT INTO bookings (resource_id, user_id, user_email, title, purpose, booking_date, start_time, end_time, attendees, status, admin_note, created_at) VALUES
(1, '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'PAF Group Meeting', 'Weekly sprint planning for PAF assignment', '2026-04-15', '10:00', '12:00', 4, 'APPROVED', 'Approved. Please lock the lab after use.', NOW() - INTERVAL '3 days'),
(3, '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Guest Lecture Setup', 'Setting up for industry guest lecture', '2026-04-20', '14:00', '17:00', 100, 'PENDING', NULL, NOW() - INTERVAL '1 day'),
(5, '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Thesis Discussion', 'Meeting with supervisor for thesis review', '2026-04-10', '09:00', '10:00', 3, 'REJECTED', 'Room reserved for faculty meeting that day.', NOW() - INTERVAL '5 days'),
(2, '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Circuit Lab Practice', 'Extra practice session for electronics module', '2026-04-12', '13:00', '15:00', 8, 'CANCELLED', NULL, NOW() - INTERVAL '4 days');

-- MODULE C: Seed Incidents
INSERT INTO incidents (resource_id, location, reported_by, reporter_email, title, description, category, priority, status, assigned_to, assignee_email, contact_phone, resolution_notes, created_at, updated_at) VALUES
(1, 'Lab B202', '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Projector not displaying output', 'The ceiling projector in Lab B202 turns on but shows no image. Tried multiple laptops and different HDMI cables.', 'EQUIPMENT_FAULT', 'HIGH', 'OPEN', NULL, NULL, '+94771234567', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(NULL, 'Building A - 3rd Floor Corridor', '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Water leak from ceiling', 'There is a persistent water leak from the ceiling near Room A305. The floor is getting slippery and poses safety risk.', 'PLUMBING', 'CRITICAL', 'IN_PROGRESS', '22222222-2222-2222-2222-222222222222', 'tech1@campus.lk', '+94777654321', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(2, 'Lecture Hall C101', '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Air conditioning not working', 'The AC units in Lecture Hall C101 are not cooling properly. Temperature is very uncomfortable during afternoon lectures.', 'ELECTRICAL', 'MEDIUM', 'RESOLVED', '22222222-2222-2222-2222-222222222222', 'tech1@campus.lk', NULL, 'Replaced the compressor unit and refilled refrigerant. AC now cooling to set temperature.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
(NULL, 'Library - 2nd Floor', '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'WiFi connectivity issues', 'WiFi keeps disconnecting every few minutes on the 2nd floor of the library. Multiple students affected.', 'NETWORK', 'HIGH', 'OPEN', NULL, NULL, '+94771112233', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(NULL, 'Cafeteria Entrance', '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'Broken floor tiles causing trip hazard', 'Several floor tiles near the cafeteria entrance are cracked and raised. Multiple students have tripped. Needs urgent repair.', 'SAFETY', 'CRITICAL', 'REJECTED', NULL, NULL, '+94779998877', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');

UPDATE incidents SET rejection_reason = 'This area is scheduled for complete renovation next week. Temporary signage has been placed.' WHERE title = 'Broken floor tiles causing trip hazard';

-- Module C: Seed Attachments
INSERT INTO incident_attachments (incident_id, file_name, file_url, file_size, mime_type, uploaded_by, uploaded_at) VALUES
(1, 'projector_screen.jpg', 'https://lcwywqhzfwsjqnusvbhw.supabase.co/storage/v1/object/public/incident-attachments/1/projector_screen.jpg', 245000, 'image/jpeg', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
(1, 'hdmi_port_damage.jpg', 'https://lcwywqhzfwsjqnusvbhw.supabase.co/storage/v1/object/public/incident-attachments/1/hdmi_port_damage.jpg', 189000, 'image/jpeg', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days'),
(2, 'ceiling_leak.jpg', 'https://lcwywqhzfwsjqnusvbhw.supabase.co/storage/v1/object/public/incident-attachments/2/ceiling_leak.jpg', 312000, 'image/jpeg', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '3 days');

-- Module C: Seed Comments
INSERT INTO incident_comments (incident_id, author_id, author_email, author_role, content, created_at) VALUES
(1, '11111111-1111-1111-1111-111111111111', 'student1@campus.lk', 'USER', 'I tried using a different laptop and the projector still does not show any output. The power light is green.', NOW() - INTERVAL '2 days'),
(2, '22222222-2222-2222-2222-222222222222', 'tech1@campus.lk', 'TECHNICIAN', 'Inspected the area. The leak appears to be from a damaged pipe above the false ceiling. Will need to cut open the ceiling panel for repair.', NOW() - INTERVAL '1 day'),
(2, '33333333-3333-3333-3333-333333333333', 'admin@campus.lk', 'ADMIN', 'Please prioritize this repair as it is a safety hazard. Budget approved for emergency plumbing work.', NOW() - INTERVAL '12 hours'),
(3, '22222222-2222-2222-2222-222222222222', 'tech1@campus.lk', 'TECHNICIAN', 'Replaced the compressor unit and topped up the refrigerant. Testing shows the AC is now cooling to the set temperature. Marking as resolved.', NOW() - INTERVAL '1 day');

-- MODULE D: Seed Notifications
INSERT INTO notifications (user_id, title, message, type, is_read, related_id, related_type, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Booking Approved', 'Your booking for Lab A101 on 2026-04-15 has been approved.', 'BOOKING_APPROVED', TRUE, 1, 'BOOKING', NOW() - INTERVAL '3 days'),
('11111111-1111-1111-1111-111111111111', 'Ticket Status Updated', 'Your incident "Water leak from ceiling" is now IN_PROGRESS.', 'TICKET_STATUS_CHANGED', FALSE, 2, 'INCIDENT', NOW() - INTERVAL '1 day'),
('11111111-1111-1111-1111-111111111111', 'New Comment on Your Ticket', 'tech1@campus.lk commented on: Water leak from ceiling', 'NEW_COMMENT', FALSE, 2, 'INCIDENT', NOW() - INTERVAL '1 day'),
('11111111-1111-1111-1111-111111111111', 'Booking Rejected', 'Your booking for Meeting Room E101 on 2026-04-10 has been rejected. Reason: Room reserved for faculty meeting.', 'BOOKING_REJECTED', TRUE, 3, 'BOOKING', NOW() - INTERVAL '5 days');
