# CareerPilot AI — AI-Powered Career & Technical Interview SaaS

[![CI Pipeline](https://github.com/careerpilot-ai/careerpilot-ai/actions/workflows/ci.yml/badge.svg)](.github/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2%20App%20Router-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB.svg)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791.svg)](https://www.postgresql.org/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange.svg)](https://www.trychroma.com/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED.svg)](https://www.docker.com/)

A production-grade, AI-powered career intelligence and technical interview platform engineered with a **Next.js 14** frontend, an **Express.js + TypeScript** API gateway backed by **PostgreSQL 18 & Prisma ORM**, and a dedicated **Python + FastAPI** AI/ML microservice with **ChromaDB RAG**, **Sentence Transformers (`BAAI/bge-small-en-v1.5`)**, and multi-LLM orchestration with Server-Sent Events (SSE) streaming.

> 📚 **Interview & Portfolio Playbook**: See [PORTFOLIO_PRESENTATION_GUIDE.md](PORTFOLIO_PRESENTATION_GUIDE.md) for ready-to-use resume bullet points, 60-second elevator pitch, and answers to top technical interview questions for **Full Stack**, **AI / ML**, and **DevOps** roles.

---

## Architecture Overview

```
                          ┌────────────────────────────────────────────────────────┐
                          │            Client Layer (Next.js 14 App Router)        │
                          │  - In-Browser Web Worker Code Sandbox (JS)             │
                          │  - In-Browser Relational SQL Evaluator                 │
                          │  - Interactive System Design Topology Canvas (DAG)     │
                          │  - Client-Side ATS PDF Generator & Audio Recorder      │
                          └───────────────────────────┬────────────────────────────┘
                                                      │  HTTPS / REST / SSE
                                                      ▼
                          ┌────────────────────────────────────────────────────────┐
                          │          API Gateway (Express.js + TypeScript)         │
                          │  - JWT + Rotated HttpOnly Cookie Authentication        │
                          │  - Anti-Tamper Magic-Byte PDF/DOCX Validation          │
                          │  - Zod DTO Validation & Rate Limiting                  │
                          │  - PostgreSQL Telemetry & Observability Logger         │
                          └─────────────┬───────────────────────────┬──────────────┘
                                        │                           │ Internal HMAC Auth
                                        │ Prisma ORM                ▼
                                        │              ┌───────────────────────────┐
                                        ▼              │   AI Microservice (FastAPI│
    ┌──────────────────────────────────────────────┐   │   - ChromaDB RAG Engine   │
    │         PostgreSQL 18 Database               │   │   - bge-small-en-v1.5     │
    │  - Normalized Users, Resumes, Matches        │   │   - Hybrid TF-IDF Matcher │
    │  - Roadmaps, Sprint Tasks, Interviews        │   │   - SSE Hint Streaming    │
    │  - SM-2 Flashcards & AiTelemetryLog          │   │   - Speech Pacing (WPM)   │
    └──────────────────────────────────────────────┘   └─────────────┬─────────────┘
                                                                     │
                                                       ┌─────────────┴─────────────┐
                                                       │ LLM Providers & Fallbacks │
                                                       │ - Gemini 2.5 Flash        │
                                                       │ - OpenAI GPT-4o-mini      │
                                                       └───────────────────────────┘
```

---

## Multi-Track Engineering Highlights

### 1. Full Stack Software Engineering (SDE)
- **Monorepo Architecture**: Clean separation into `shared/`, `backend/`, and `frontend/` sharing validated Zod schemas, TypeScript types, and response contracts end-to-end.
- **In-Browser Sandboxed Code Execution**: JavaScript runs inside an isolated HTML5 Web Worker with overridden `console.log` capture and a 2000ms termination timer to prevent DOM freezing and infinite loops.
- **Interactive Relational SQL Engine**: In-memory SQL engine parsing `SELECT`, `WHERE`, `JOIN`, `ORDER BY`, and `LIMIT` against initialized tables (`employees`, `departments`, `orders`).
- **Interactive System Design Canvas**: Drag-and-drop microservice topologies where candidates visually connect Load Balancers, API Gateways, Caching layers, and Databases.
- **Security Hardening**: Anti-tamper magic-byte verification for PDF/DOCX uploads, JWT access tokens with rotated `HttpOnly` refresh token family replay protection, and CORS/Helmet guards.

### 2. AI / Machine Learning Engineering
- **RAG (Retrieval-Augmented Generation)**: ChromaDB vector store pre-indexed with a 9-topic Computer Science Knowledge Base (`DBMS`, `OOP`, `DSA`, `System Design`, `Networking`, `OS`, etc.) embedded using `BAAI/bge-small-en-v1.5`.
- **Hybrid Job Description Matcher**: Combines semantic cosine similarity embeddings with Scikit-learn TF-IDF n-gram keyword extraction and a canonical skill ontology to classify skills into *Matching*, *Related*, and *Missing*.
- **Low-Latency SSE Hint Streaming**: Server-Sent Events (`/hint-stream`) provide real-time token streaming for coaching hints during live mock interviews.
- **Speech Delivery Analytics**: Server-side audio transcription calculating candidate speaking pace (Words Per Minute), filler-word density, and response structure.
- **AI Observability & Graceful Fallbacks**: Tracks model latency (ms), provider usage, schema pass rate, and fallback counts in PostgreSQL `AiTelemetryLog`.

### 3. DevOps & Cloud Platform
- **Multi-Stage Docker Builds**: Production Dockerfiles for `backend/`, `frontend/`, and `ai-service/` reducing image sizes by >60% via build artifact extraction.
- **Multi-Container Orchestration**: `docker-compose.yml` defining networks, persistent volumes for PostgreSQL & ChromaDB, environment variable injection, and automated database health checks.
- **Automated GitHub Actions CI/CD Pipeline**: Multi-job workflow (`.github/workflows/ci.yml`) enforcing:
  1. Monorepo TypeScript compilation across `shared/`, `backend/`, and `frontend/`.
  2. Backend unit tests via `node:test`.
  3. Python 3.11 environment validation and `unittest` suites.
  4. Parallel Docker container image builds.

---

## Project Structure

```text
careerpilot-ai/
├── .github/workflows/ci.yml       # GitHub Actions CI/CD Pipeline
├── PORTFOLIO_PRESENTATION_GUIDE.md# Resume bullet points & technical interview prep
├── docker-compose.yml             # Multi-service container orchestration
├── .env.example                   # Unified environment variable template
├── shared/                        # End-to-end TypeScript DTOs, Enums & Zod Schemas
├── backend/                       # Express.js REST API Gateway & Prisma ORM
│   ├── src/                       # Controllers, routes, middleware, and services
│   ├── tests/                     # Backend unit test suite (node:test)
│   └── Dockerfile                 # Multi-stage production Docker build
├── ai-service/                    # Python FastAPI AI / ML Microservice
│   ├── app/                       # RAG, LLM providers, ChromaDB, audio & NLP
│   ├── tests/                     # Unit test suites & LLM evaluation harness
│   └── Dockerfile                 # Python 3.11 slim Docker build
├── database/                      # Database migrations, Prisma schemas, & seeds
│   ├── prisma/schema.prisma       # 15+ normalized relational models
│   └── prisma/seed.ts             # Canonical skills & benchmark tracks seed
└── frontend/                      # Next.js 14 App Router Web Application
    ├── src/app/(marketing)/       # Dynamic landing page with interactive lab
    ├── src/app/(workspace)/       # Dashboard, Resume, Matcher, Interviews, Drills
    ├── src/components/interview/  # Web Worker Sandbox & System Design Canvas
    └── Dockerfile                 # Next.js standalone production build
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js >= 20.x and npm >= 10.x
- Python >= 3.11
- PostgreSQL 16+ or Docker

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/careerpilot-ai.git
cd careerpilot-ai
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to the service directories:
```bash
cp .env.example backend/.env
cp .env.example ai-service/.env
```

### 3. Run via Docker Compose (Recommended)
```bash
docker compose up --build
```
- Web Application: **http://localhost:3000**
- API Gateway: **http://localhost:5000**
- AI Service Docs: **http://localhost:8000/internal/ai/docs**

---

### 4. Running Services Individually

```bash
# Build shared types
npm run build:shared

# Database migrations
npx --workspace=database prisma migrate deploy

# Run All Typechecks
npm run typecheck

# Run Unit Tests
npm run test:all
```

---

## Live Endpoints & Routes

| Module | Route / Endpoint | Description |
| :--- | :--- | :--- |
| **Homepage** | `http://localhost:3000/` | Split hero with personalized laptop preview & Interactive Lab |
| **Dashboard** | `http://localhost:3000/dashboard` | Placement readiness score, target tracks & progress |
| **Resume AI** | `http://localhost:3000/resume` | ATS scoring, bullet point rewrites & tailored PDF export |
| **Job Matcher** | `http://localhost:3000/matcher` | Hybrid semantic + TF-IDF job description compatibility |
| **Skill Audit** | `http://localhost:3000/skills` | Topological prerequisite ordering from beginner to advanced |
| **Interview Studio** | `http://localhost:3000/interview` | JS Web Worker, SQL Sandbox, Design Canvas, & SSE hints |
| **Smart Flashcards** | `http://localhost:3000/drills` | SM-2 spaced repetition scheduled from weak topics |
| **Applications** | `http://localhost:3000/applications` | Table & Kanban pipeline tracking |
| **AI Telemetry** | `http://localhost:3000/analytics` | Real-time AI response latency & fallback observability |
| **Health Probe** | `http://localhost:5000/api/health` | Gateway, Database, and AI Microservice health status |

---

## License
MIT License. Created for high-impact technical career development.
