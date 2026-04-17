# Thisangi – Module D + E: Notifications, Role Management & OAuth 2.0
## IT3030 PAF Assignment 2026

> **Your module:** Notifications + Authentication & Authorization
> **Branch naming:** `feature/thisangi/auth-setup` and `feature/thisangi/notifications`

---

## Your Responsibility Summary

You own the **most foundational part of the project** — without your work, no one else's code can be secured. You set up OAuth 2.0 login, role-based access control, the shared security config, and the notification system. Do `auth-setup` branch **first** so teammates can build on it.

---

## Priority Order

```
1. Supabase Auth + Google OAuth setup   ← WEEK 1 (everyone is blocked until this works)
2. Spring Security config               ← WEEK 1
3. User entity + role management        ← WEEK 1/2
4. Notification entity + service        ← WEEK 2/3
5. Notification UI (bell icon panel)    ← WEEK 3
6. GitHub Actions CI workflow           ← WEEK 1 (set up early)
```

---

## Part 1 — Authentication & OAuth 2.0

### Supabase Auth Setup

1. Go to **Supabase Dashboard → Authentication → Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials (from Google Cloud Console)
4. Set redirect URL: `http://localhost:3000/auth/callback`

```javascript
// src/lib/supabaseClient.js — shared by whole frontend team
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);
```

```javascript
// src/api/authApi.js — your file
import { supabase } from '../lib/supabaseClient';

// Trigger Google OAuth login
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  });
  if (error) throw error;
};

// Get current session
export const getSession = () => supabase.auth.getSession();

// Sign out
export const signOut = () => supabase.auth.signOut();

// Listen to auth state changes
export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange(callback);
```

### Spring Boot Security Configuration

#### `SecurityConfig.java`
```java
// Location: src/main/java/com/smartcampus/config/SecurityConfig.java

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)   // enables @PreAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm ->
                sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/resources/**").permitAll()
                // Everything else needs authentication
                .anyRequest().authenticated()
            )
            // Add Supabase JWT validation filter
            .addFilterBefore(supabaseJwtFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public SupabaseJwtFilter supabaseJwtFilter() {
        return new SupabaseJwtFilter();
    }
}
```

#### `SupabaseJwtFilter.java`
```java
// Location: src/main/java/com/smartcampus/config/SupabaseJwtFilter.java
// This filter reads the Supabase JWT from the Authorization header
// and sets up Spring Security's authentication context

@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);
        try {
            // Verify JWT with Supabase JWT secret
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes()))
                .build()
                .parseClaimsJws(token)
                .getBody();

            String userId = claims.getSubject();
            String role = (String) claims.get("role");     // from Supabase user metadata

            // Set authentication in Spring Security context
            List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + (role != null ? role.toUpperCase() : "USER")));

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userId, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception e) {
            // Invalid token — just don't authenticate
        }

        chain.doFilter(request, response);
    }
}
```

### User Sync — `UserSyncService.java`
```java
// When a user logs in via OAuth, sync their Supabase Auth user into your users table

@Service
public class UserSyncService {
    public UserResponseDTO syncUserFromSupabase(String supabaseUserId, String email,
                                                String fullName, String avatarUrl) {
        return userRepository.findBySupabaseId(supabaseUserId)
            .map(existing -> {
                existing.setEmail(email);
                existing.setFullName(fullName);
                return toDTO(userRepository.save(existing));
            })
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setSupabaseId(supabaseUserId);
                newUser.setEmail(email);
                newUser.setFullName(fullName);
                newUser.setAvatarUrl(avatarUrl);
                newUser.setRole("USER");   // default role
                return toDTO(userRepository.save(newUser));
            });
    }
}
```

### Auth Controller: `AuthController.java`
```java
@RestController
@RequestMapping("/auth")
public class AuthController {

    // POST /auth/sync — called by frontend after OAuth login to sync user
    @PostMapping("/sync")
    public ResponseEntity<UserResponseDTO> syncUser(Authentication auth) {
        // auth.getPrincipal() is the Supabase user ID from JWT
        // Sync into local users table
    }
}
```

---

## Part 2 — Role Management

### Entity: `User.java`
```java
@Entity
@Table(name = "users")
public class User {
    private Long id;
    private String supabaseId;         // UUID from Supabase Auth
    private String email;
    private String fullName;
    private String avatarUrl;
    private String role;               // USER, ADMIN, TECHNICIAN
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### Controller: `UserController.java`
```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    // GET /api/users/me — get current user's profile
    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(Authentication auth) { ... }

    // GET /api/users — ADMIN only, list all users
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponseDTO>> getAllUsers(Pageable pageable) { ... }

    // PUT /api/users/{id}/role — ADMIN only, update role
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponseDTO> updateUserRole(
        @PathVariable Long id,
        @RequestBody RoleUpdateDTO dto) { ... }
}
```

---

## Part 3 — Notifications

### Entity: `Notification.java`
```java
@Entity
@Table(name = "notifications")
public class Notification {
    private Long id;
    private Long userId;
    private String type;              // BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_CANCELLED,
                                      // TICKET_STATUS_CHANGED, NEW_COMMENT, TICKET_ASSIGNED
    private String title;
    private String message;
    private boolean isRead;
    private Long referenceId;         // ID of the booking or ticket
    private String referenceType;     // BOOKING or TICKET
    private LocalDateTime createdAt;
}
```

### Service: `NotificationService.java`
```java
// THIS IS YOUR MOST IMPORTANT CLASS — teammates call this!
// Share this method signature with the team IMMEDIATELY.

@Service
public class NotificationService {

    // The single method all teammates call
    public void send(Long userId, String type, String title,
                     String message, Long referenceId, String referenceType) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(false);
        n.setReferenceId(referenceId);
        n.setReferenceType(referenceType);
        n.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    // Convenience methods for each event type
    // (teammates call these specifically — cleaner API)

    public void notifyBookingApproved(Long userId, Long bookingId, String resourceName) {
        send(userId, "BOOKING_APPROVED",
             "Booking Approved",
             "Your booking for " + resourceName + " has been approved.",
             bookingId, "BOOKING");
    }

    public void notifyBookingRejected(Long userId, Long bookingId, String resourceName, String reason) {
        send(userId, "BOOKING_REJECTED",
             "Booking Rejected",
             "Your booking for " + resourceName + " was rejected. Reason: " + reason,
             bookingId, "BOOKING");
    }

    public void notifyTicketStatusChanged(Long userId, Long ticketId, String newStatus) {
        send(userId, "TICKET_STATUS_CHANGED",
             "Ticket Updated",
             "Your ticket status changed to " + newStatus,
             ticketId, "TICKET");
    }

    public void notifyNewComment(Long ticketOwnerId, Long ticketId) {
        send(ticketOwnerId, "NEW_COMMENT",
             "New Comment",
             "Someone commented on your ticket.",
             ticketId, "TICKET");
    }

    public void notifyTechnicianAssigned(Long technicianId, Long ticketId) {
        send(technicianId, "TICKET_ASSIGNED",
             "Ticket Assigned to You",
             "A new incident ticket has been assigned to you.",
             ticketId, "TICKET");
    }
}
```

### Controller: `NotificationController.java`
```java
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    // GET /api/notifications?page=0&size=20
    @GetMapping
    public ResponseEntity<Page<NotificationResponseDTO>> getMyNotifications(
        Authentication auth, Pageable pageable) { ... }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) { ... }

    // PUT /api/notifications/{id}/read
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponseDTO> markAsRead(
        @PathVariable Long id, Authentication auth) { ... }

    // PUT /api/notifications/read-all
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication auth) { ... }
}
```

---

## Supabase Tables — Your Responsibility

```sql
-- users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    supabase_id UUID UNIQUE NOT NULL,    -- from auth.users
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'USER'
        CHECK (role IN ('USER', 'ADMIN', 'TECHNICIAN')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    reference_id BIGINT,
    reference_type VARCHAR(20),   -- BOOKING or TICKET
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_users_supabase_id ON users(supabase_id);
```

---

## Frontend — React Pages & Context

### Files You Own
```
src/
  ├── lib/
  │   └── supabaseClient.js          ← shared, you create this
  ├── context/
  │   └── AuthContext.jsx            ← auth state for entire app
  ├── api/
  │   ├── authApi.js                 ← OAuth functions
  │   └── notificationsApi.js        ← notification functions
  ├── pages/
  │   ├── auth/
  │   │   ├── LoginPage.jsx          ← Google sign-in button
  │   │   └── AuthCallbackPage.jsx   ← handles OAuth redirect
  │   └── admin/
  │       └── UserManagementPage.jsx ← ADMIN: list users, change roles
  └── components/
      ├── layout/
      │   ├── Navbar.jsx             ← shared across ALL pages — you build this
      │   └── ProtectedRoute.jsx     ← route guard component
      └── notifications/
          ├── NotificationBell.jsx   ← bell icon with unread count badge
          └── NotificationPanel.jsx  ← dropdown list of notifications
```

### AuthContext — Critical (All teammates depend on this)
```javascript
// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
      setLoading(false);
    });

    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchUserRole(session.user.id);
        else setRole(null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (supabaseId) => {
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('supabase_id', supabaseId)
      .single();
    setRole(data?.role ?? 'USER');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### ProtectedRoute — Everyone uses this
```javascript
// src/components/layout/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}
```

### Navbar — You build this (shared by all)
```javascript
// src/components/layout/Navbar.jsx
// Include: Logo, navigation links, user avatar, NotificationBell, sign out button
// Teammates will import and use this in their pages
```

### API File: `src/api/notificationsApi.js`
```javascript
import axios from 'axios';

const BASE = '/api/notifications';

export const getNotifications = (params) => axios.get(BASE, { params });
export const getUnreadCount = () => axios.get(`${BASE}/unread-count`);
export const markAsRead = (id) => axios.put(`${BASE}/${id}/read`);
export const markAllAsRead = () => axios.put(`${BASE}/read-all`);
```

---

## GitHub Actions CI — Your Responsibility

```yaml
# .github/workflows/ci.yml

name: CI Build and Test

on:
  push:
    branches: [ main, feature/** ]
  pull_request:
    branches: [ main ]

jobs:
  backend:
    name: Spring Boot Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Java 17
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Build and test with Maven
        run: mvn clean verify
        working-directory: ./backend
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_JWT_SECRET: ${{ secrets.SUPABASE_JWT_SECRET }}

  frontend:
    name: React Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install and build
        run: |
          npm install
          npm run build
        working-directory: ./frontend
```

---

## Environment Variables (You manage the `.env` files)

```bash
# backend/.env (Spring Boot — application.properties or .env)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...   # service_role key — NEVER commit this
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase-dashboard

# frontend/.env
REACT_APP_SUPABASE_URL=https://xxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
REACT_APP_API_BASE_URL=http://localhost:8080

# Share via secure channel (WhatsApp/Discord DM — NEVER commit to GitHub)
# Add to GitHub Secrets for CI Actions
```

---

## Your Minimum Endpoints (Assignment Requirement)

| # | Method | Endpoint | ✓ |
|---|---|---|---|
| 1 | `GET` | `/api/notifications` | ✓ |
| 2 | `PUT` | `/api/notifications/{id}/read` | ✓ |
| 3 | `PUT` | `/api/notifications/read-all` | ✓ |
| 4 | `GET` | `/api/users/me` | ✓ |
| 5 | `GET` | `/api/users` | ✓ |
| 6 | `PUT` | `/api/users/{id}/role` | ✓ |
| 7 | `POST` | `/auth/sync` | ✓ |
| 8 | `GET` | `/api/notifications/unread-count` | ✓ |

8 endpoints — well above minimum.

---

## Integration Points (What teammates need from you)

| Teammate | What they need from you |
|---|---|
| **All** | `AuthContext` + `ProtectedRoute` + `Navbar` — share these ASAP |
| **All** | `SupabaseJwtFilter` + `SecurityConfig` — must be merged to `main` before others add `@PreAuthorize` |
| **Shashindi** | `notificationService.notifyBookingApproved/Rejected/Cancelled()` — share method signatures |
| **Shehan** | `notificationService.notifyTicketStatusChanged()` and `notifyNewComment()` — share method signatures |
| **All** | `supabaseClient.js` file — share this first day |

---

## Testing (Your responsibility)

1. **Postman** — test Google OAuth flow end-to-end
2. **Test RBAC** — try accessing ADMIN endpoint with USER token → should get 403
3. **Notification tests** — call `notificationService.send()` directly in a test and verify row is saved
4. **GitHub Actions** — verify the CI workflow passes after each PR

---

## Git Commit Examples

```bash
git commit -m "feat: configure Supabase project and create all DB tables"
git commit -m "feat: add SupabaseJwtFilter for JWT validation"
git commit -m "feat: configure Spring Security with role-based access"
git commit -m "feat: add User entity and UserSyncService"
git commit -m "feat: add UserController with role management endpoints"
git commit -m "feat: add Notification entity and NotificationService"
git commit -m "feat: add NotificationController endpoints"
git commit -m "feat: add AuthContext and ProtectedRoute for React"
git commit -m "feat: add LoginPage with Google OAuth button"
git commit -m "feat: add NotificationBell with unread badge"
git commit -m "feat: add UserManagementPage for ADMIN"
git commit -m "ci: add GitHub Actions build and test workflow"
git commit -m "feat: add Navbar with notification panel"
```

---

## Report Contribution (Your Section)

- **Module D Requirements** — notification types and delivery mechanism
- **Module E Requirements** — authentication flow, roles and permissions
- **Security architecture** — how JWT from Supabase is validated in Spring Boot
- **OAuth flow diagram** — Google → Supabase → Spring Boot → React
- **Role permission table** — what USER / ADMIN / TECHNICIAN can do
- **GitHub Actions** — CI workflow explanation and screenshot of green build
- **Endpoint table** — your 8 endpoints
- **Screenshots** — LoginPage, NotificationPanel, UserManagementPage
