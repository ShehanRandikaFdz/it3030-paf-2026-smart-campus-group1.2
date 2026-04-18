# Smart Campus Operations Hub

A full-stack web application for managing campus operations including facilities, bookings, incident ticketing, and notifications — built with **Spring Boot**, **React (Vite)**, and **Supabase**.

> **IT3030 — Platform-based Application Frameworks | Assignment 2026**  
> **Group 1.2** — SLIIT Faculty of Computing

---

## 👥 Team Members

| Member | Student ID | Module | Focus Area |
|--------|-----------|--------|------------|
| **Ranushi** | — | Module A | Facilities & Assets Catalogue |
| **Shashindi** | IT23194908 | Module B | Booking Management & Conflict Checking |
| **Shehan** | IT23449282 | Module C | Incident Tickets + Attachments + Technician Updates |
| **Thisangi** | — | Module D+E | Notifications + Role Management + OAuth |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                React Frontend (Vite)              │
│            http://localhost:5173                   │
├──────────────────────────────────────────────────┤
│  LoginPage │ Facilities │ Bookings │ Incidents    │
│  Notifications │ UserProfile │ Admin Pages        │
└───────────────────┬──────────────────────────────┘
                    │ Axios + JWT Bearer Token
                    ▼
┌──────────────────────────────────────────────────┐
│            Spring Boot REST API                   │
│            http://localhost:8085                   │
├──────────────────────────────────────────────────┤
│  /api/v1/resources      (Module A - Ranushi)      │
│  /api/v1/bookings       (Module B - Shashindi)    │
│  /api/v1/incidents      (Module C - Shehan)       │
│  /api/v1/notifications  (Module D - Thisangi)     │
│  /api/v1/users          (Module E - Thisangi)     │
│  /api/v1/auth           (Module E - Thisangi)     │
└───────────────────┬──────────────────────────────┘
                    │ JDBC + Supabase Storage API
                    ▼
┌──────────────────────────────────────────────────┐
│         Supabase Cloud (Tokyo Region)             │
├──────────────────────────────────────────────────┤
│  PostgreSQL │ Auth (Google OAuth) │ Storage       │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Prerequisites

Before running the project, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| **Java JDK** | 17+ | [Eclipse Adoptium](https://adoptium.net/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

> **Note:** Maven is NOT required. The project includes the Maven Wrapper (`mvnw`/`mvnw.cmd`).

---

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/ShehanRandikaFdz/it3030-paf-2026-smart-campus-group1.2.git
cd it3030-paf-2026-smart-campus-group1.2
```

### 2. Start the Backend (Spring Boot)

```bash
cd backend

# Windows (PowerShell)
.\mvnw.cmd spring-boot:run

# macOS / Linux
./mvnw spring-boot:run
```

The backend will start on **http://localhost:8085**.

> The database is hosted on Supabase Cloud. No local database setup is required.

### 3. Start the Frontend (React)

Open a **new terminal** window:

```bash
cd frontend
npm install        # First time only — installs dependencies
npm run dev
```

The frontend will start on **http://localhost:5173**.

### 4. Open in Browser

Navigate to **http://localhost:5173** and sign in with your Google account.

---

## 🔑 Environment Configuration

### Backend (`backend/src/main/resources/application.properties`)

All secrets can be overridden via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Backend server port | `8085` |
| `SUPABASE_DB_URL` | PostgreSQL connection URL | Configured |
| `SUPABASE_DB_USERNAME` | Database username | Configured |
| `SUPABASE_DB_PASSWORD` | Database password | Configured |
| `SUPABASE_URL` | Supabase project URL | Configured |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Configured |
| `SUPABASE_JWT_SECRET` | JWT signing secret | Configured |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/public key |
| `VITE_API_BASE_URL` | Backend API URL (default: `http://localhost:8085`) |

---

## 📡 API Endpoints

### Module A — Facilities & Assets (Ranushi)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/resources` | Get all resources (paginated) |
| GET | `/api/v1/resources/{id}` | Get resource by ID |
| GET | `/api/v1/resources/search` | Search/filter resources |
| POST | `/api/v1/resources` | Create resource (Admin) |
| PUT | `/api/v1/resources/{id}` | Update resource (Admin) |
| PATCH | `/api/v1/resources/{id}/status` | Update status (Admin) |
| DELETE | `/api/v1/resources/{id}` | Delete resource (Admin) |

### Module B — Booking Management (Shashindi)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings` | Create booking request |
| GET | `/api/v1/bookings` | Get all bookings (Admin) |
| GET | `/api/v1/bookings/my` | Get my bookings |
| GET | `/api/v1/bookings/{id}` | Get booking by ID |
| PUT | `/api/v1/bookings/{id}/review` | Approve/reject (Admin) |
| PUT | `/api/v1/bookings/{id}/cancel` | Cancel own booking |
| GET | `/api/v1/bookings/availability` | Check time slot availability |

### Module C — Incident Ticketing (Shehan)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/incidents` | Create incident ticket |
| GET | `/api/v1/incidents` | Get incidents (user/admin) |
| GET | `/api/v1/incidents/{id}` | Get incident details |
| PUT | `/api/v1/incidents/{id}/status` | Update ticket status |
| PUT | `/api/v1/incidents/{id}/assign` | Assign technician |
| DELETE | `/api/v1/incidents/{id}` | Delete incident |
| POST | `/api/v1/incidents/{id}/comments` | Add comment |
| POST | `/api/v1/incidents/{id}/attachments` | Upload attachments |

### Module D+E — Notifications & Auth (Thisangi)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications` | Get user notifications |
| GET | `/api/v1/notifications/unread-count` | Get unread count |
| PUT | `/api/v1/notifications/{id}/read` | Mark as read |
| PUT | `/api/v1/notifications/read-all` | Mark all as read |
| DELETE | `/api/v1/notifications/{id}` | Delete notification |
| GET | `/api/v1/users/me` | Get current user profile |
| GET | `/api/v1/users` | Get all users (Admin) |
| PUT | `/api/v1/users/{id}/role` | Update user role (Admin) |

---

## 🧪 Running Tests

```bash
cd backend

# Windows
.\mvnw.cmd test

# macOS / Linux
./mvnw test
```

Tests are located in `backend/src/test/java/com/smartcampus/`.

---

## 🔐 Authentication Flow

1. User clicks **"Continue with Google"** on the login page
2. Supabase Auth redirects to Google OAuth consent screen
3. After successful login, callback redirects to `/auth/callback`
4. Frontend fetches user profile from `user_profiles` table
5. JWT token is attached to all subsequent API requests via `Authorization: Bearer <token>` header
6. Backend validates JWT using Supabase JWT secret

### Roles

| Role | Permissions |
|------|------------|
| `USER` | Create bookings, report incidents, view own data |
| `ADMIN` | All USER permissions + approve/reject bookings, manage incidents, manage users |
| `TECHNICIAN` | All USER permissions + update incident status, add resolution notes |

---

## 📁 Project Structure

```
smart-campus-group1.2/
├── .github/workflows/ci.yml     # GitHub Actions CI
├── backend/                      # Spring Boot application
│   ├── src/main/java/com/smartcampus/
│   │   ├── common/               # Shared: ApiResponse, GlobalExceptionHandler
│   │   ├── config/                # Security, CORS, JWT config
│   │   ├── module_a/              # Facilities (Ranushi)
│   │   ├── module_b/              # Bookings (Shashindi)
│   │   ├── module_c/              # Incidents (Shehan)
│   │   └── module_d/              # Notifications + Users (Thisangi)
│   └── src/test/                  # Unit tests
├── frontend/                      # React + Vite application
│   ├── src/
│   │   ├── api/                   # API client files (one per module)
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Route pages
│   │   └── utils/                 # Axios, Supabase client
│   └── .env                       # Environment variables
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router, Axios |
| **Backend** | Spring Boot 3.2.5, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (Google OAuth 2.0) |
| **Storage** | Supabase Storage (attachments) |
| **JWT** | Nimbus JOSE JWT |
| **CI/CD** | GitHub Actions |

---

## 📝 License

This project is developed as part of the IT3030 module at SLIIT and is for educational purposes only.
