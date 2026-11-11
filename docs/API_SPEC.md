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

## 5. AI Resume Analyzer (`/api/resumes`) — Phase 2
- `POST /api/resumes/upload` *(Protected, Multipart `file`)* — Validates binary magic bytes (PDF `%PDF-` / DOCX `PK\x03\x04` + `word/`) up to 10 MB, saves via authenticated StorageProvider (`Cloudinary` or isolated disk), creates `Resume` record.
- `POST /api/resumes/:id/analyze` *(Protected)* — Sends stored file to FastAPI `/internal/ai/resumes/parse-and-evaluate` (PyMuPDF/python-docx, spaCy NER, Scikit-learn TF-IDF, ChromaDB vector indexing, and structured LLM critique); stores `extractedText`, `parsedData`, `skills`, `estimatedScore`, `sectionScores`, and `feedback`.
- `GET /api/resumes` & `GET /api/resumes/:id` *(Protected)* — Lists user's resumes and retrieves full report.
- `GET /api/resumes/:id/file` *(Protected)* — Streams original PDF/DOCX binary securely for authenticated owner preview.
- `PATCH /api/resumes/:id/primary` *(Protected)* — Marks resume as primary default.
- `POST /api/resumes/:id/sync-skills` *(Protected)* — Upserts extracted skills into normalized `Skill` & `UserSkill` tables.
- `DELETE /api/resumes/:id` *(Protected)* — Purges PostgreSQL record, stored file, and ChromaDB chunks (`/internal/ai/resumes/vectors/delete`).

## 6. AI Job Description Matcher (`/api/job-matches`) — Phase 3
- `POST /api/job-matches` *(Protected, JSON or Multipart `jdFile`)* — Compares selected analyzed resume against pasted JD text or uploaded `.pdf`/`.docx`/`.txt` JD document using ChromaDB Sentence-Transformer similarity, Scikit-learn TF-IDF keyword scoring, canonical + adjacent skill graph classification (`matchingSkills`, `partialSkills`, `missingSkills`), and structured LLM recommendations.
- `GET /api/job-matches` & `GET /api/job-matches/:id` *(Protected)* — Lists user's compatibility reports and retrieves detailed match breakdown.
- `DELETE /api/job-matches/:id` *(Protected)* — Removes saved `JobMatch` record owned by user.

## 7. AI Skill Gap Analyzer (`/api/skills`) — Phase 4
- `GET /api/skills/inventory` *(Protected)* — Returns candidate's normalized `UserSkill` inventory joined with `Skill`, alongside the seeded canonical `Skill` catalog.
- `PATCH /api/skills/inventory` *(Protected)* — Upserts a candidate skill (`name`, `category`, `proficiencyLevel`) into `Skill` & `UserSkill` tables, updating `confidenceScore` immediately.
- `DELETE /api/skills/inventory/:id` *(Protected)* — Removes an owned `UserSkill` record.
- `POST /api/skills/analyze` *(Protected)* — Evaluates `UserSkill`, optional primary/selected `Resume`, and optional `JobMatch` via FastAPI `/internal/ai/skills/analyze-gap`, computing role readiness %, dependency-ordered study sequence, category coverage, and Gemini tactical guidance.

## 8. Personalized Learning Roadmap (`/api/roadmaps`) — Phase 4
- `GET /api/roadmaps` & `GET /api/roadmaps/:id` *(Protected)* — Lists all saved `LearningRoadmap` plans (active plan first) with week/day ordered `RoadmapTask` items.
- `POST /api/roadmaps/generate` *(Protected)* — Generates a week-by-week (`2-12` weeks) and day-by-day curriculum from open skill gaps via FastAPI `/internal/ai/roadmap/generate`, saves `LearningRoadmap` + `RoadmapTask` rows atomically in PostgreSQL, and sets it active.
- `PATCH /api/roadmaps/:id/activate` *(Protected)* — Marks an existing roadmap active for Dashboard tracking.
- `PATCH /api/roadmaps/:id/tasks/:taskId` *(Protected)* — Updates task status (`PENDING` | `IN_PROGRESS` | `COMPLETED`) or priority and automatically recalculates `progressPct`.
- `DELETE /api/roadmaps/:id` *(Protected)* — Deletes a roadmap owned by the user and promotes the latest remaining plan if active.

## 9. AI Mock Interview System (`/api/interviews`) — Phase 5
- `GET /api/interviews` & `GET /api/interviews/:id` *(Protected)* — Lists user's interview sessions or retrieves full Q&A + rubric breakdown.
- `POST /api/interviews/start` *(Protected)* — Creates an `Interview` session and generates Question 1 grounded in the 9-topic ChromaDB CS Knowledge Base (and optional Resume chunks) via FastAPI `/internal/ai/interviews/start-question`.
- `POST /api/interviews/:id/answer` *(Protected)* — Submits candidate response, grades 5 rubric criteria (`technicalAccuracy`, `depthOfUnderstanding`, `completeness`, `clarityAndStructure`, `practicalExamples`), appends adaptive follow-up or next topic question, and auto-summarizes when `questionLimit` completes.
- `POST /api/interviews/:id/complete` *(Protected)* — Completes an active session early and computes the post-interview report in PostgreSQL.
- `DELETE /api/interviews/:id` *(Protected)* — Deletes an owned interview session.
