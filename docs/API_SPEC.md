# CareerPilot AI – API Specification (Phase 1)

Base Gateway URL: `http://localhost:5000/api`
All protected endpoints require `Authorization: Bearer <accessToken>` and return uniform JSON envelopes:
- Success: `{ "success": true, "data": ... }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": ... } }`

## 1. Health & Service Telemetry
- `GET /api/health` — Checks PostgreSQL connection (`SELECT 1`) and pings FastAPI internal health endpoint (`GET /internal/ai/health` using `X-Internal-Service-Key`).

## 2. Authentication (`/api/auth`)
- `POST /api/auth/register` — Creates `User`, hashes password with `bcryptjs` (cost 12), issues Access JWT (`15m`) + `HttpOnly` rotated Refresh cookie (`cp_refresh_token`, SHA-256 stored in `RefreshToken`).
- `POST /api/auth/login` — Authenticates credentials and creates a new refresh token family.
- `POST /api/auth/refresh` — Validates & rotates `cp_refresh_token`. Detects replay attacks on revoked tokens and revokes the entire `familyId`.
- `POST /api/auth/logout` — Revokes refresh token family and clears cookie.
- `GET /api/auth/me` *(Protected)* — Returns authenticated user profile with normalized relations (`educations`, `workExperiences`, `projects`, `skills`).
- `POST /api/auth/forgot-password` — Generates a 15-minute SHA-256 expiring `PasswordResetToken`. Logs reset URL on dev console without leaking token existence over HTTP.
- `POST /api/auth/reset-password` — Validates reset token, updates password hash, marks token used, and revokes active `RefreshToken` sessions.

## 3. Candidate Profile (`/api/profile`)
- `GET /api/profile` *(Protected)* — Returns user record + normalized education, work experience, project, and skill records.
- `PUT /api/profile` / `PATCH /api/profile` *(Protected)* — Updates profile fields, `careerPreferences`, `educations`, `workExperiences`, `projects`, and normalized `skills` (`Skill` + `UserSkill` tables) atomically inside a Prisma transaction.

## 4. Dashboard Analytics (`/api/analytics`)
- `GET /api/analytics/dashboard` *(Protected)* — Computes live PostgreSQL metrics (`readinessScore`, `latestResumeScore`, `latestJobMatchScore`, `totalMockInterviews`, `averageInterviewScore`, `skillsCount`, `roadmapProgressPct`, `applicationStats`, `profileCompletenessPct`, `recentActivities`, `upcomingInterviews`, and deterministic `recommendations`).
