# AI-Driven Healthcare Assistance Platform for Rural Communities

A multilingual healthcare communication and document-management platform for
rural communities. The platform provides distinct React experiences for
patients, healthcare workers and administrators, backed by a FastAPI service
with secure accounts, personal medical document storage, patient medical
history, care coordination, administrative oversight and a curated
health-education repository. It is a **Module 1 prototype** for Springboard
Internship 7.0.

> **Clinical safety notice:** This is a software prototype. It does not
> diagnose, prescribe, or make autonomous clinical decisions. Health content
> is general education and must not be treated as verified medical advice.
> Always consult a qualified healthcare professional.

## 1. Project Overview

The backend exposes a versioned REST API built with FastAPI. The frontend is a
responsive React single-page application with an English/Telugu patient
experience, a task-focused worker workspace and a structured administration
workspace.

- **Patients** register, authenticate, manage their profile, upload medical
  documents, review their own document history, and read published
  multilingual health education.
- **Healthcare workers** register, but their accounts remain inactive until an
  administrator approves them. Approved workers can publish general
  health-education content and access only the patients explicitly assigned to
  them. They can review assigned-patient documents and maintain non-clinical
  follow-up coordination records.
- **Administrators** are provisioned through a controlled server-side CLI. They
  manage non-administrator account status, approve or revoke workers, create
  patient-worker assignments, moderate health content, review platform
  analytics and monitor API/database health.

Documents are stored on the local filesystem with server-generated UUID
filenames. Metadata is stored in PostgreSQL. Patient document endpoints are
owner-only; approved workers can download documents only for patients assigned
to them. Administrator actions are recorded in an audit log.

## 2. Problem Statement

Rural communities often face:

- Limited access to healthcare information in local languages.
- Fragmented or paper-based medical records.
- Difficulty sharing prescriptions, discharge summaries, and reports.
- A need for trusted, role-controlled health-education content.

This backend provides the secure data and API foundation for addressing those
needs while avoiding unsafe automated clinical decision-making.

## 3. Project Objectives

- Provide secure patient, healthcare-worker and administrator access.
- Enforce role-based access, worker approval and patient-worker assignment
  boundaries.
- Store medical documents safely with ownership and assignment checks.
- Provide a patient-accessible document history.
- Provide a multilingual, curated health-education repository.
- Provide administrator oversight for users, workforce, content and platform
  health.
- Validate all input and reject unsafe or unsupported file uploads.
- Preserve an auditable, migration-controlled PostgreSQL schema.
- Provide automated tests for all core Module 1 workflows.

## 4. Technologies Used

| Layer | Technology |
| --- | --- |
| Language | Python 3.13 |
| API framework | FastAPI |
| Database | PostgreSQL 17 (Docker) |
| ORM | SQLAlchemy 2.x |
| Driver | Psycopg 3 |
| Migrations | Alembic |
| Authentication | JWT (PyJWT) |
| Password hashing | Argon2 via `pwdlib` |
| Validation | Pydantic v2 / pydantic-settings |
| File uploads | `python-multipart`, local filesystem |
| Testing | pytest, httpx, FastAPI TestClient |
| Frontend | React 18, TypeScript 5.7, Vite 6 |
| Frontend routing | React Router 6 |
| Frontend icons | Lucide React |
| Styling | Hand-written responsive CSS design system |
| Containerization | Docker Desktop / Docker Compose |

## 5. Architecture Overview

```text
Client
  |
  | HTTPS / JSON / multipart
  v
FastAPI application (app/main.py)
  |
  +-- Routes
  |     +-- /api/auth           registration and login
  |     +-- /api/users          profile and patient medical history
  |     +-- /api/documents      patient-only document management
  |     +-- /api/health-content published education repository
  |     +-- /api/worker         assigned patients, document access, follow-ups
  |     +-- /api/admin          users, workers, assignments, content, analytics
  |
  +-- Security layer
  |     +-- Argon2 password hashing
  |     +-- JWT issuance and validation
  |     +-- Patient, healthcare-worker and administrator dependencies
  |
  +-- Services
  |     +-- Document validation and UUID file storage
  |     +-- Administrator provisioning and audit logging
  |
  +-- SQLAlchemy models and sessions
  |
  +-- PostgreSQL 17 (Docker container: springboard-postgres)
        +-- users
        +-- medical_documents
        +-- health_contents
        +-- worker_patient_assignments
        +-- follow_ups
        +-- admin_audit_logs
        +-- alembic_version

Local filesystem
  uploads/<uuid>.<ext>   (not publicly served)
```

Key design decisions:

- Uploaded files are never served statically.
- Original filenames are sanitized and are never used as storage paths.
- Stored filenames are UUID-based and are never returned by the API.
- Patient document access is always filtered by `owner_id`.
- Worker document access requires an explicit administrator-created assignment.
- Administrator accounts are provisioned only through a controlled CLI command,
  never through public registration or promotion of existing accounts.
- Frontend role hiding is backed by server-side role and resource checks.

## 6. Project Folder Structure

```text
Healthcare-Assistant/
├── app/
│   ├── config.py                 Settings and environment loading
│   ├── database.py               Engine, session factory, Base, get_db
│   ├── main.py                   FastAPI app, routers and health checks
│   ├── models/
│   │   ├── user.py               User, roles and approval flags
│   │   ├── medical_document.py   Document metadata and categories
│   │   ├── health_content.py     Health education content
│   │   ├── assignment.py         Worker-patient care assignments
│   │   ├── follow_up.py          Non-clinical follow-up coordination
│   │   └── audit_log.py          Administrator audit trail
│   ├── routes/
│   │   ├── auth.py               Registration and login
│   │   ├── users.py              Profile and patient medical history
│   │   ├── documents.py          Patient-only document management
│   │   ├── health_content.py     Health education repository
│   │   ├── worker.py             Assigned patients, document access, follow-ups
│   │   └── admin.py              Administration and monitoring
│   ├── schemas/
│   │   ├── auth.py               Auth request/response schemas
│   │   ├── user.py               Profile schemas
│   │   ├── document.py           Document and history schemas
│   │   ├── health_content.py     Content schemas and validation
│   │   ├── worker.py             Worker patient and follow-up schemas
│   │   └── admin.py              Administration schemas
│   ├── security/
│   │   ├── auth.py               Argon2 hashing and JWT creation
│   │   └── dependencies.py       Patient/worker/administrator dependencies
│   ├── services/
│   │   ├── document_storage.py   File validation and safe storage
│   │   ├── worker_approval.py    Legacy operator worker approval logic
│   │   ├── admin_provisioning.py Controlled administrator creation
│   │   └── admin_audit.py        Transactional administrator audit entries
│   └── utils/
│       └── language.py           Language code normalization
├── migrations/
│   ├── env.py
│   └── versions/
│       ├── 7a24941a8cfd_create_users_and_medical_documents.py
│       ├── b1f2c3d4e5a6_add_health_content_and_document_categories.py
│       └── c4d5e6f7a8b9_add_administrator_assignments_followups.py
├── scripts/
│   ├── approve_healthcare_worker.py
│   └── provision_administrator.py
├── frontend/                     React + TypeScript + Vite client
│   ├── src/
│   │   ├── api/                  Typed API client and endpoints
│   │   ├── components/           UI, layout, brand and library components
│   │   ├── context/              Authentication and locale providers
│   │   ├── i18n/                 English/Telugu interface dictionary
│   │   ├── pages/                Public, auth, patient, worker and admin screens
│   │   ├── styles/global.css     SAHAAYA design system
│   │   ├── App.tsx               Role-aware application routes
│   │   └── main.tsx              React entry point
│   ├── .env.example              Safe frontend environment template
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   ├── conftest.py               Isolated SQLite DB and user fixtures
│   ├── test_main.py              Service and database health checks
│   ├── test_auth.py              Authentication and patient profiles
│   ├── test_healthcare_workers.py Worker registration and authorization
│   ├── test_documents.py         Upload, validation, ownership, deletion
│   ├── test_history.py           Patient document history
│   ├── test_health_content.py    Content repository and visibility
│   ├── test_admin.py             Admin authorization, approval, analytics
│   └── test_worker_management.py Assignment isolation and follow-ups
├── uploads/                      Local document storage (gitignored)
├── alembic.ini
├── compose.yaml
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## 7. Environment Setup

Prerequisites:

- Windows with PowerShell (instructions below are PowerShell-compatible).
- Python 3.13.
- Docker Desktop running.
- Git.

Create and activate the virtual environment if it does not already exist:

```powershell
cd D:\Springboard\Healthcare-Assistant
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Copy the safe example environment file and replace all placeholder values:

```powershell
Copy-Item .env.example .env
```

Generate a strong JWT secret (do not reuse the placeholder):

```powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(64))"
```

Set `JWT_SECRET_KEY` and `POSTGRES_PASSWORD` in `.env`. The `.env` file is
gitignored and must never be committed or shared.

## 8. PostgreSQL and Docker Configuration

The database runs in the dedicated container `springboard-postgres`.

```yaml
Database: healthcare_db
User: healthcare_user
Host: 127.0.0.1
Port: 5433
Container: springboard-postgres
Image: postgres:17-alpine
Volume: springboard_pgdata
```

Start the database:

```powershell
docker compose up -d
```

Check status:

```powershell
docker ps --filter "name=springboard-postgres"
```

The compose file binds PostgreSQL to `127.0.0.1:5433` only. Do not stop,
delete, or recreate unrelated Docker containers or volumes.

## 9. Installation Instructions

```powershell
cd D:\Springboard\Healthcare-Assistant
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip check
docker compose up -d
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Open:

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Health: `http://127.0.0.1:8000/health`
- Database health: `http://127.0.0.1:8000/health/database`

## 10. Database Migration Instructions

Inspect the current revision:

```powershell
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic history
```

Apply migrations:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Check for schema drift without writing changes:

```powershell
.\.venv\Scripts\python.exe -m alembic check
```

Create a future migration after model changes:

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "describe change"
```

Migration policy for this project:

- Additive changes only.
- Existing tables, records, Docker volumes, and migrations are preserved.
- Destructive resets are not permitted.

Current migration head: `c4d5e6f7a8b9`.

## 11. Backend Startup Instructions

Development server:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Production-style local run:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## 11.1 Frontend Setup and Startup

Prerequisites: Node.js 20+ and npm 10+.

```powershell
cd D:\Springboard\Healthcare-Assistant\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The development server runs at `http://127.0.0.1:5173` by default. The backend
must be running at `http://127.0.0.1:8000`, or `VITE_API_BASE_URL` must point
to the correct API origin.

Frontend validation commands:

```powershell
npm run typecheck
npm run build
npm run preview
```

The SAHAAYA client includes:

- Public home, about, roadmap, and multilingual health-resource pages.
- Patient registration, healthcare-worker registration, and shared sign-in.
- Role-aware routing that redirects each account to its own workspace.
- Patient dashboard, profile editor, document upload and record shelf.
- Medical-history timeline with secure document downloads.
- Authenticated and public health-library browsing.
- Healthcare-worker dashboard, assigned-patient list and patient record review.
- Worker follow-up monitoring with scheduled/completed/cancelled records.
- Worker content desk with draft/published article management.
- Worker translation-support roadmap without non-functional controls.
- Administrator overview, user management, worker approval, assignments,
  content moderation, analytics and system monitoring.
- English and Telugu patient interface switching, responsive navigation,
  accessible focus states, empty states, loading states, and error recovery.
- Session storage for authentication; tokens are not persisted in local
  storage.

Frontend environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | No | API origin; defaults to `http://127.0.0.1:8000` |

The frontend `.env` file is gitignored. Only `.env.example` is committed.

## 12. API Endpoint Documentation

### Service health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | Service information |
| GET | `/health` | Public | Liveness check |
| GET | `/health/database` | Public | PostgreSQL connectivity check |

### Authentication

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a patient |
| POST | `/api/auth/register/healthcare-worker` | Public | Register a worker awaiting approval |
| POST | `/api/auth/login` | Public | Obtain a JWT access token |

Patient registration example:

```json
{
  "full_name": "Synthetic Patient",
  "email": "patient@example.org",
  "phone": "9999999999",
  "password": "StrongPass123!",
  "preferred_language": "te"
}
```

Accepted language codes: `en`, `te`, `hi`, `ta`, `kn`, `ml`, `mr`, `gu`,
`bn`. Common language names such as `Telugu`, `Hindi`, or `Tamil` are also
accepted and stored as standardized codes.

Healthcare workers are created with `is_active = false` and
`is_approved = false`. They cannot log in until approved.

### Patient profiles and history

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users/me` | Any active user | Retrieve own profile |
| PATCH | `/api/users/me` | Any active user | Update name, phone, preferred language |
| GET | `/api/users/me/history` | Patient | Own document history in chronological order |

History items contain only metadata:

```json
{
  "document_id": 12,
  "original_filename": "report.pdf",
  "category": "medical_report",
  "upload_date": "2026-11-12T10:15:00Z",
  "file_type": "application/pdf"
}
```

No diagnoses, treatments, prescriptions, or clinical interpretations are
generated.

### Medical documents

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/documents/upload` | Patient | Upload a PDF, JPEG, or PNG (max 10 MB) |
| GET | `/api/documents` | Patient | List own documents |
| GET | `/api/documents/{document_id}` | Patient owner | Retrieve own document metadata |
| GET | `/api/documents/{document_id}/download` | Patient owner | Download own document |
| DELETE | `/api/documents/{document_id}` | Patient owner | Delete own document and file |

Categories: `prescription`, `discharge_summary`, `medical_report`.

Upload uses `multipart/form-data` with fields:

- `file`: PDF, JPEG, or PNG.
- `category`: one of the three categories above.

Security behavior:

- Extension and file signature must both match.
- Empty files are rejected with `400`.
- Unsupported files are rejected with `400`.
- Files over 10 MB are rejected with `413`.
- Invalid categories are rejected with `422`.
- Unauthenticated access is rejected with `401`.
- Access to another patient's document returns `404`.
- Physical paths and stored UUID filenames are never returned.
- Files are deleted if database persistence fails.

### Healthcare information repository

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health-content` | Public | List published content |
| GET | `/api/health-content?language=te` | Public | Filter by language |
| GET | `/api/health-content?category=nutrition` | Public | Filter by category |
| GET | `/api/health-content/{content_id}` | Public | Retrieve published content |
| GET | `/api/health-content/mine` | Approved worker | List own content, including drafts |
| POST | `/api/health-content` | Approved worker | Create content |
| PATCH | `/api/health-content/{content_id}` | Content owner | Update own content |
| DELETE | `/api/health-content/{content_id}` | Content owner | Delete own content |

Content statuses are `draft` and `published`. Drafts are never returned by
public list or detail endpoints. Only active, approved healthcare workers may
manage content, and they may manage only their own records. Administrators can
change publication status and classification metadata from the admin API.

Example content:

```json
{
  "title": "Safe drinking water",
  "content": "General health education text of at least twenty characters.",
  "category": "prevention",
  "language": "en",
  "status": "published"
}
```

### Healthcare-worker workspace

All endpoints require an active, approved healthcare worker.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/worker/overview` | Assigned-patient, follow-up and content totals |
| GET | `/api/worker/patients` | List only patients assigned to the worker |
| GET | `/api/worker/patients/{patient_id}` | Assigned-patient summary and documents |
| GET | `/api/worker/patients/{patient_id}/documents/{document_id}/download` | Download an assigned patient's document |
| GET | `/api/worker/follow-ups` | List own follow-up records, optional `status` filter |
| POST | `/api/worker/follow-ups` | Create a follow-up for an assigned patient |
| PATCH | `/api/worker/follow-ups/{id}` | Update own follow-up date, status or note |
| DELETE | `/api/worker/follow-ups/{id}` | Delete own follow-up record |

Workers receive `404` for unassigned patients and documents that do not belong
to an assigned patient. Follow-up records contain coordination information only;
they are not diagnoses, prescriptions or clinical outcomes.

### Administration

All endpoints require an active administrator account.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/admin/overview` | Platform totals and health summary |
| GET | `/api/admin/users` | List/filter users by role, status or search |
| GET | `/api/admin/users/{id}` | Retrieve one account |
| PATCH | `/api/admin/users/{id}/status` | Activate/deactivate a non-administrator |
| GET | `/api/admin/workers` | List workers, filter by approval |
| POST | `/api/admin/workers/{id}/approve` | Approve worker access |
| POST | `/api/admin/workers/{id}/revoke` | Revoke worker access |
| GET | `/api/admin/content` | List all content, including drafts |
| PATCH | `/api/admin/content/{id}` | Update status, category or language |
| GET | `/api/admin/analytics` | Real platform counts and distributions |
| GET | `/api/admin/monitoring` | API/database health and application version |
| GET | `/api/admin/assignments` | List patient-worker assignments |
| POST | `/api/admin/assignments` | Assign a patient to an approved worker |
| DELETE | `/api/admin/assignments/{id}` | Remove a care assignment |

Administrator actions in these workflows are recorded in `admin_audit_logs`.
Administrator accounts cannot be deactivated or modified through this API.

## 13. Authentication Instructions

1. Register a patient through `/api/auth/register`.
2. Log in through `/api/auth/login`.
3. Send the returned token as a bearer token:

```http
Authorization: Bearer <access_token>
```

Tokens expire after 30 minutes by default (`ACCESS_TOKEN_EXPIRE_MINUTES`).
Invalid, expired, or unapproved account tokens are rejected with `401`.
Inactive accounts receive `403` at login.

Healthcare worker approval is deliberately not exposed as a public endpoint.
An operator with server access runs:

```powershell
.\.venv\Scripts\python.exe scripts\approve_healthcare_worker.py --email worker@example.org
```

To revoke access:

```powershell
.\.venv\Scripts\python.exe scripts\approve_healthcare_worker.py --email worker@example.org --revoke
```

## 14. Document Upload Instructions

Swagger:

1. Register and log in as a patient.
2. Authorize Swagger with the bearer token.
3. Open `POST /api/documents/upload`.
4. Choose `category`.
5. Choose a PDF, JPEG, or PNG file up to 10 MB.
6. Submit.

PowerShell example:

```powershell
$token = "<access_token>"
$form = @{
  category = "medical_report"
  file = Get-Item "C:\path\to\synthetic-report.pdf"
}
Invoke-RestMethod `
  -Uri "http://127.0.0.1:8000/api/documents/upload" `
  -Method Post `
  -Headers @{ Authorization = "Bearer $token" } `
  -Form $form
```

Use only synthetic or fictional documents. Never upload real patient data for
testing.

## 15. Testing Instructions

Run the full suite:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Run verbose:

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

Test isolation:

- Feature tests use an in-memory temporary SQLite database.
- Upload tests use a temporary upload directory.
- Development PostgreSQL records are not modified or deleted by feature tests.
- `test_main.py` includes a PostgreSQL connectivity check, so the
  `springboard-postgres` container must be running for that test.

Latest verified result: **39 passed**.

Frontend validation:

```powershell
cd frontend
npm run typecheck
npm run build
```

The frontend is also checked in a desktop and mobile viewport against the live
FastAPI service during integration verification.

Covered areas:

- Registration, duplicate email handling, login, invalid password.
- Invalid JWT and unauthenticated access.
- Profile retrieval and update.
- Language normalization.
- Worker registration, inactive status, approval gating, role enforcement.
- PDF/image upload, unsupported/spoofed/empty/oversized rejection.
- Document ownership, listing, download, deletion, path traversal.
- Patient history and cross-patient isolation.
- Published/draft content visibility, language and category filters.
- Unauthorized content creation and cross-worker ownership protection.

## 16. Security Considerations

Implemented:

- Argon2 password hashing.
- JWT signature validation and expiration.
- Generic credential errors.
- Role-based authorization for healthcare content.
- Account activation and approval checks on every authenticated request.
- `owner_id` filtering for every document query.
- Server-generated UUID storage filenames.
- Original filename sanitization and path traversal protection.
- File extension plus magic-signature validation.
- Configurable 10 MB upload limit.
- No static serving of the uploads directory.
- No password hashes or tokens in API responses.
- No physical paths or internal stored names in API responses.
- Transaction rollback and file cleanup on persistence failure.
- Environment-based secrets and `.env` exclusion from Git.

Known limitations:

- Files are stored on the local filesystem; multi-instance deployments need
  shared object storage.
- No antivirus or malware scanning is performed.
- No rate limiting or account lockout is implemented.
- No refresh-token rotation or token revocation list is implemented.
- Approval is a server-side CLI operation; there is no administrator web UI.
- There is no audit log for administrative approvals.
- Health content is manually curated education, not clinically verified advice.

## 17. Current Implementation Status

| Area | Status |
| --- | --- |
| FastAPI project and Swagger | Implemented and tested |
| PostgreSQL Docker setup | Existing, verified |
| Alembic migrations | Implemented, applied, and checked |
| Patient registration and login | Implemented and tested |
| Patient profile and language preference | Implemented and tested |
| Healthcare-worker registration | Implemented and tested |
| Worker approval workflow (CLI) | Implemented; approval service tested, CLI help verified |
| Role-based worker authorization | Implemented and tested |
| Medical document upload | Implemented and tested |
| File validation and size limits | Implemented and tested |
| Document ownership and deletion | Implemented and tested |
| Patient medical history | Implemented and tested |
| Health content repository | Implemented and tested |
| Backend automated test suite | 39 passing |
| React frontend and routing | Implemented; typecheck and production build passing |
| Responsive SAHAAYA design system | Implemented |
| English/Telugu interface | Implemented for navigation, forms, and primary workflows |
| Patient document and history screens | Implemented |
| Public and authenticated health library | Implemented |
| Healthcare-worker content desk | Implemented |
| Frontend environment template | Completed |
| README and environment template | Completed |
| Git repository preparation | Local repository initialized; no remote push |

## 18. Future Development Roadmap

- Multilingual translation and speech interfaces.
- OCR for scanned prescriptions and reports.
- Patient consent and document-sharing workflows.
- Healthcare-worker/admin approval portal with audit logging.
- Refresh tokens, token revocation, and rate limiting.
- Object storage (S3-compatible) and malware scanning.
- Content review and clinical-verification workflow.
- Pagination, search, and richer document metadata.
- Offline-first and installable PWA support for low-bandwidth environments.
- Observability, structured audit logs, and deployment automation.

## Disclaimer

This repository is an educational internship prototype. It must not be used
for real clinical care without security review, clinical governance, regulatory
compliance, and independent validation.
