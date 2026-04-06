# TASK_THISANGI.md — Module D + E: Notifications + Auth + Roles
**Member:** Thisangi  
**Module:** D — Notifications + E — Authentication, Authorization & Role Management  
**Branch:** `feature/module-d-thisangi`

---

## Your Responsibility Summary
You are the **backbone of the whole project.** Your work — OAuth login, JWT handling, role-based security, and the shared `NotificationService` — must be delivered **first** (or at least stubbed out) so everyone else can depend on it. You also own the notifications UI and the GitHub Actions CI pipeline.

---

## Priority Order
1. **Day 1–2:** Set up security config, Supabase Auth integration, JWT filter → unblock everyone
2. **Day 2–3:** Create `NotificationService` interface + stub implementation → Shashindi and Shehan need this
3. **Day 4–5:** Implement full notification system
4. **Day 6–7:** Frontend: auth context, ProtectedRoute, notification panel
5. **Day 8:** CI workflow, user management endpoints

---

## Supabase Database — Your Table

### Table: `notifications`
```sql
CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID NOT NULL,              -- recipient's Supabase Auth UUID
    title       VARCHAR(150) NOT NULL,
    message     TEXT NOT NULL,
    type        VARCHAR(50) NOT NULL,
    -- BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_CANCELLED,
    -- TICKET_STATUS_CHANGED, NEW_COMMENT, TECHNICIAN_ASSIGNED, GENERAL
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    related_id  BIGINT,                     -- booking ID or incident ID (optional)
    related_type VARCHAR(50),               -- 'BOOKING' or 'INCIDENT'
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read
    ON notifications(user_id, is_read);
```

> Note: The `users` table is managed by Supabase Auth automatically.
> Supabase Auth stores user metadata (email, provider). You just need the `auth.users` UUID.
> You may create a `user_profiles` table to store the `role` field.

### Table: `user_profiles` (Supabase doesn't store custom roles in auth.users)
```sql
CREATE TABLE user_profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       VARCHAR(150) NOT NULL,
    full_name   VARCHAR(100),
    role        VARCHAR(20) NOT NULL DEFAULT 'USER',  -- USER, ADMIN, TECHNICIAN
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- Trigger: auto-create profile row when a new user signs up via Supabase Auth
```

---

## Backend — Spring Boot

### Package: `com.smartcampus.module_d` (notifications) + `com.smartcampus.config` + `com.smartcampus.common`

```
config/
├── SecurityConfig.java           ← Spring Security + JWT filter setup
├── CorsConfig.java               ← Allow React frontend origin
└── SupabaseJwtFilter.java        ← Validate Supabase JWT on every request

common/
├── dto/
│   └── ApiResponse.java          ← { success, message, data } — shared by ALL modules
├── exception/
│   ├── GlobalExceptionHandler.java
│   ├── ResourceNotFoundException.java
│   ├── ForbiddenException.java
│   └── ValidationException.java
└── security/
    └── CurrentUser.java          ← @CurrentUser annotation helper

module_d/
├── controller/
│   ├── NotificationController.java
│   └── UserController.java
├── service/
│   ├── NotificationService.java      ← INTERFACE — Shashindi & Shehan depend on this
│   ├── NotificationServiceImpl.java
│   └── UserService.java
├── repository/
│   ├── NotificationRepository.java
│   └── UserProfileRepository.java
├── entity/
│   ├── Notification.java
│   └── UserProfile.java
├── dto/
│   ├── NotificationResponseDTO.java
│   └── UserProfileDTO.java
└── enums/
    └── NotificationType.java
```

### Your REST Endpoints (minimum 4, different HTTP methods)

| # | Method | Endpoint | Role | Description |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/notifications` | USER | Get current user's notifications (paginated) |
| 2 | `PUT` | `/api/v1/notifications/{id}/read` | USER | Mark a single notification as read |
| 3 | `PUT` | `/api/v1/notifications/read-all` | USER | Mark all notifications as read |
| 4 | `DELETE` | `/api/v1/notifications/{id}` | USER | Delete a notification |
| 5 | `GET` | `/api/v1/notifications/unread-count` | USER | Get count of unread notifications |
| 6 | `GET` | `/api/v1/users/me` | USER | Get current user's profile + role |
| 7 | `PUT` | `/api/v1/users/{id}/role` | ADMIN | Update a user's role |
| 8 | `GET` | `/api/v1/users` | ADMIN | List all users with roles |

### Supabase JWT Authentication Setup

Supabase Auth issues JWTs signed with a secret. Spring Boot validates this on every request:

```java
// SupabaseJwtFilter.java
@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    @Value("${supabase.jwt-secret}")
    private String jwtSecret;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseClaimsJws(token)
                .getBody();

            String userId = claims.getSubject();   // Supabase user UUID
            String email  = claims.get("email", String.class);

            // Load role from user_profiles table
            String role = userProfileRepository
                .findById(UUID.fromString(userId))
                .map(p -> p.getRole())
                .orElse("USER");

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    userId, null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

```java
// SecurityConfig.java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private SupabaseJwtFilter supabaseJwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/resources", "/api/v1/resources/**").permitAll()  // public read
                .requestMatchers(HttpMethod.POST, "/api/v1/resources").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/resources/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/resources/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/users/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(supabaseJwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

### NotificationService Interface — Create This FIRST

```java
// NotificationService.java — publish this interface early so others can depend on it
public interface NotificationService {

    /**
     * Creates and saves a notification for a user.
     * Called by BookingService and IncidentService.
     */
    void createNotification(UUID userId, String title, String message,
                            NotificationType type);

    /**
     * Overload with related entity reference.
     */
    void createNotification(UUID userId, String title, String message,
                            NotificationType type, Long relatedId, String relatedType);

    List<NotificationResponseDTO> getNotificationsForUser(UUID userId, Pageable pageable);

    long getUnreadCount(UUID userId);

    void markAsRead(Long notificationId, UUID userId);

    void markAllAsRead(UUID userId);

    void deleteNotification(Long notificationId, UUID userId);
}
```

### OAuth Frontend Flow (Supabase handles this)
The actual OAuth with Google is done **on the frontend** via Supabase JS SDK. The backend just validates the JWT:

```javascript
// In authApi.js (frontend)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Google OAuth sign-in
export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({ provider: 'google' });

// Get current session + JWT
export const getSession = () => supabase.auth.getSession();

// Sign out
export const signOut = () => supabase.auth.signOut();
```

After login, Supabase returns a JWT. The React app stores it and sends it as `Authorization: Bearer <token>` on every API call.

### Auto-create user_profile on first login
Use a Supabase Database Function + Trigger (set up in Supabase dashboard):
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'USER'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Frontend — React

### Shared Files You Create (Everyone Uses These)

```
src/utils/
├── axiosInstance.js        ← axios with auth header auto-injected — ALL modules import this
└── supabaseClient.js       ← Supabase JS client instance

src/context/
└── AuthContext.jsx         ← Current user, role, login/logout — wrap entire app

src/components/common/
└── ProtectedRoute.jsx      ← Guards routes by auth + role — ALL modules use this
```

#### `axiosInstance.js` — Critical shared file
```javascript
import axios from 'axios';
import { supabase } from './supabaseClient';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
});

// Auto-attach Supabase JWT on every request
axiosInstance.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export default axiosInstance;
```

#### `ProtectedRoute.jsx`
```jsx
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const { user, userRole, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && userRole !== role) return <Navigate to="/unauthorized" />;
  return children;
}
```

### Your Pages/Components
```
src/pages/
├── LoginPage.jsx                  — Google OAuth login button
├── UnauthorizedPage.jsx           — 403 page
└── notifications/
    └── NotificationsPage.jsx      — Full notification list

src/components/notifications/
├── NotificationBell.jsx           — Bell icon in navbar with unread badge count
├── NotificationPanel.jsx          — Dropdown panel with recent notifications
└── NotificationItem.jsx           — Single notification row

src/pages/admin/
└── UserManagePage.jsx             — Admin: list users, change roles

src/api/
├── authApi.js                     — Supabase auth calls
└── notificationsApi.js            — Notification endpoint calls
```

### API Files
```javascript
// notificationsApi.js
import axios from '../utils/axiosInstance';

export const getNotifications = (params) =>
  axios.get('/api/v1/notifications', { params });

export const getUnreadCount = () =>
  axios.get('/api/v1/notifications/unread-count');

export const markAsRead = (id) =>
  axios.put(`/api/v1/notifications/${id}/read`);

export const markAllAsRead = () =>
  axios.put('/api/v1/notifications/read-all');

export const deleteNotification = (id) =>
  axios.delete(`/api/v1/notifications/${id}`);

// authApi.js
export const getMyProfile = () =>
  axios.get('/api/v1/users/me');

export const updateUserRole = (userId, role) =>     // admin
  axios.put(`/api/v1/users/${userId}/role`, { role });

export const getAllUsers = () =>
  axios.get('/api/v1/users');
```

---

## GitHub Actions CI — Your Responsibility

File: `.github/workflows/ci.yml`
```yaml
name: CI — Build and Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'
      - name: Build and test with Maven
        run: mvn clean test
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          SUPABASE_JWT_SECRET: ${{ secrets.SUPABASE_JWT_SECRET }}

  build-frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## Testing Evidence Required

### Unit Tests
- `testGetNotifications_returnsOnlyCurrentUserNotifs()`
- `testMarkAsRead_notOwner_throws403()`
- `testMarkAllAsRead_updatesAllUnread()`
- `testGetUnreadCount_returnsCorrectNumber()`
- `testUpdateUserRole_asAdmin_success()`
- `testUpdateUserRole_asUser_throws403()`
- `testJwtFilter_invalidToken_returns401()`
- `testJwtFilter_noToken_returns401ForProtectedEndpoint()`

### Postman Collection
1. Access protected endpoint without token (401)
2. Access protected endpoint with invalid token (401)
3. Access admin endpoint as USER role (403)
4. Get notifications (200)
5. Get unread count (200)
6. Mark single notification as read (200)
7. Mark all as read (200)
8. Delete notification (200)
9. Admin: get all users (200)
10. Admin: update user role (200)

---

## application.properties — You Configure This For Everyone

```properties
# Supabase
supabase.url=${SUPABASE_URL}
supabase.anon-key=${SUPABASE_ANON_KEY}
supabase.service-key=${SUPABASE_SERVICE_KEY}
supabase.jwt-secret=${SUPABASE_JWT_SECRET}

# Spring Security
spring.security.enabled=true

# CORS — allow React dev server
cors.allowed-origins=http://localhost:5173,http://localhost:3000

# Database (Supabase PostgreSQL)
spring.datasource.url=jdbc:postgresql://db.XXXX.supabase.co:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=${SUPABASE_DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

> The `SUPABASE_JWT_SECRET` is found in your Supabase project → Settings → API → JWT Settings → JWT Secret.

---

## Timeline Suggestion

| Day | Task |
|---|---|
| Day 1 | Set up security: `SupabaseJwtFilter`, `SecurityConfig`, `axiosInstance.js`, `AuthContext.jsx` |
| Day 2 | Publish `NotificationService` interface (stub impl) + `ProtectedRoute.jsx` → share with team |
| Day 3 | Implement full `NotificationServiceImpl`, `NotificationController` |
| Day 4 | Set up Supabase Auth trigger for `user_profiles`, `UserController` |
| Day 5 | React: `LoginPage`, `NotificationBell`, `NotificationPanel` |
| Day 6 | React: `NotificationsPage`, `UserManagePage` (admin) |
| Day 7 | GitHub Actions CI workflow |
| Day 8 | Unit tests, Postman collection |
| Day 9 | End-to-end testing with all modules, bug fixes |
| Day 10 | Report section + merge PR |

---

## Notes & Reminders
- **Deliver Day 1–2 items to the team ASAP.** Everyone is blocked on `axiosInstance.js`, `ProtectedRoute.jsx`, and the `NotificationService` interface.
- The Google OAuth in Supabase needs to be configured in your Supabase project → Authentication → Providers → Google. You'll need a Google OAuth Client ID and Secret from Google Cloud Console.
- Push GitHub Secrets (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_ANON_KEY`, `SUPABASE_DB_PASSWORD`) to the repo's Settings → Secrets and variables → Actions.
- You are also responsible for the main `README.md` setup steps so evaluators can run the project.
