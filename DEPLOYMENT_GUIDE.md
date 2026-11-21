# CareerPilot AI — Production Cloud VPS Deployment Guide

This guide walks you through deploying **CareerPilot AI** to a single **Linux Cloud VPS** (DigitalOcean Droplet, AWS EC2, Hetzner Cloud, Linode/Akamai, or Azure VM) using **Docker Compose** and **Caddy** (for automatic HTTPS / SSL certificates).

---

## Architecture in Production

```text
                           Internet (HTTP:80 / HTTPS:443)
                                          │
                                          ▼
                   ┌──────────────────────────────────────────────┐
                   │          Caddy Reverse Proxy (HTTPS)         │
                   │        Automatic Let's Encrypt SSL           │
                   └──────────────┬────────────────┬──────────────┘
                                  │                │
            /api /api/* (REST)    │                │  All other routes (UI)
                                  ▼                ▼
┌───────────────────────────────────────┐   ┌──────────────────────────────┐
│  Spring Boot 3 API Gateway (:5000)    │   │  Next.js 14 Frontend (:3000) │
│  - Spring Security & JWT Auth         │   │  - App Router Production     │
│  - Hibernate 6 & HikariCP             │   │  - Interactive Sandboxes     │
└──────────────┬────────────────────────┘   └──────────────────────────────┘
               │                    │
               │ Internal JDBC      │ Internal HMAC HTTP (:8000)
               ▼                    ▼
┌───────────────────────────┐  ┌───────────────────────────────────────────┐
│  PostgreSQL 18 Database   │  │  FastAPI AI Microservice (:8000)          │
│  - Persistent Volume      │  │  - ChromaDB RAG Engine                    │
└───────────────────────────┘  │  - Sentence Transformers & Multi-LLM      │
                               └─────────────────────┬─────────────────────┘
                                                     │ Internal (:8000)
                                                     ▼
                               ┌───────────────────────────────────────────┐
                               │  ChromaDB Vector Store                    │
                               │  - Persistent Volume                      │
                               └───────────────────────────────────────────┘
```

---

## 1. Recommended Server Specifications

| Provider | Recommended Tier / Specs | Approximate Cost |
| :--- | :--- | :--- |
| **Hetzner Cloud** *(Best Value)* | CPX21 or CPX31 (3–4 vCPU, 4–8 GB RAM) | ~€7 – €13 / month |
| **DigitalOcean** | Basic Droplet (2 vCPU, 4 GB RAM) | ~$24 / month |
| **AWS EC2** | `t3.medium` or `t3.large` (2 vCPU, 4–8 GB RAM) | ~$30 / month |
| **Linode / Akamai** | Dedicated or Shared 4GB (2 vCPU, 4 GB RAM) | ~$24 / month |

> **OS Recommendation**: **Ubuntu 22.04 LTS** or **Ubuntu 24.04 LTS (64-bit)**.

---

## 2. Step 1: Prepare the Server (SSH & System Setup)

SSH into your freshly created VPS:
```bash
ssh root@<YOUR_SERVER_PUBLIC_IP>
```

### A. Update System Packages
```bash
apt update && apt upgrade -y
```

### B. Add a 4GB Swap File (Crucial for Docker Builds on 4GB RAM)
Adding swap ensures your server never runs out of memory during compilation and container builds:
```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### C. Install Docker & Docker Compose
```bash
# Install Docker and Compose plugin
apt install -y docker.io docker-compose-v2 git curl ufw

# Enable and start Docker service
systemctl enable --now docker
```

### D. Configure Firewall (UFW)
Allow SSH, HTTP (80), and HTTPS (443):
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

---

## 3. Step 2: Configure Your Domain & DNS

1. Go to your DNS provider (Cloudflare, Namecheap, GoDaddy, Route 53, etc.).
2. Add an **A Record** pointing your domain (or subdomain) to your VPS IP address:
   - **Type**: `A`
   - **Name**: `@` (or `careerpilot` for `careerpilot.yourdomain.com`)
   - **Value / Target**: `<YOUR_SERVER_PUBLIC_IP>`
   - **TTL**: Auto or 300 seconds
3. *(If using Cloudflare)*: Set SSL/TLS mode to **Full** (or temporarily set Proxy to **DNS Only** while Caddy provisions the first certificate).

---

## 4. Step 3: Clone Repository & Configure Environment

Clone the repository onto your server:
```bash
cd /opt
git clone https://github.com/<your-username>/careerpilot-ai.git
cd careerpilot-ai
```

Copy the environment template:
```bash
cp .env.example .env
nano .env
```

### Set Your Production Values in `.env`:
```ini
# Database credentials (use strong passwords)
POSTGRES_USER=careerpilot
POSTGRES_PASSWORD=generate_a_strong_password_here_min_16_chars
POSTGRES_DB=careerpilot_db

# Security Secrets (generate random strings with: openssl rand -hex 32)
JWT_ACCESS_SECRET=your_32_char_minimum_random_secret_for_jwt_access
JWT_REFRESH_SECRET=your_32_char_minimum_random_secret_for_jwt_refresh
INTERNAL_SERVICE_KEY=your_internal_service_signature_key_shared_between_services

# AI / LLM Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_production_gemini_api_key
OPENAI_API_KEY=

# Production Domain (Caddy uses this to automatically obtain Let's Encrypt HTTPS certificates)
APP_DOMAIN=yourdomain.com
```

Save and exit in `nano`: Press `Ctrl + O`, `Enter`, then `Ctrl + X`.

---

## 5. Step 4: Build and Launch the Stack

Run one command to build all images and start the production stack in background:
```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

### What Happens Automatically:
1. **PostgreSQL 18** starts and verifies database readiness.
2. **ChromaDB** starts with persistent vector storage.
3. **FastAPI AI Microservice** builds, pre-loads the Sentence Transformer embedding model (`bge-small-en-v1.5`), and indexes the CS knowledge base.
4. **Spring Boot 3 Backend** compiles with Maven, packages the standalone Java 21 jar, connects to PostgreSQL, and starts Tomcat on port 5000.
5. **Next.js Frontend** builds the optimized static & server-rendered assets with `NEXT_PUBLIC_API_URL=https://yourdomain.com/api`.
6. **Caddy Reverse Proxy** connects to Let's Encrypt, generates a free SSL certificate for `yourdomain.com`, and securely routes traffic.

---

## 6. Step 5: Verify Deployment

Check container status:
```bash
docker compose ps
```
All containers should display status **Up (healthy)** or **Up**:
- `careerpilot_caddy`
- `careerpilot_frontend`
- `careerpilot_backend`
- `careerpilot_ai_service`
- `careerpilot_postgres`
- `careerpilot_chromadb`

### Test Health Endpoint from your browser or terminal:
```bash
curl https://yourdomain.com/api/health
```
Expected output:
```json
{
  "success": true,
  "data": {
    "gateway": "ok (Spring Boot 3.3.5)",
    "database": "ok",
    "aiService": {
      "status": "ok",
      "service": "careerpilot-ai-service",
      "llm_provider": "gemini",
      "llm_configured": true
    }
  }
}
```

Now open **`https://yourdomain.com`** in your browser to access the live web application!

---

## 7. Ongoing Maintenance & Operations

### View Live Logs:
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f ai-service
docker compose logs -f caddy
```

### Deploying Updates / Code Changes:
When you push new changes to GitHub:
```bash
cd /opt/careerpilot-ai
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.production.yml up -d --build
```

### Database Backup:
To back up the PostgreSQL database:
```bash
docker exec -t careerpilot_postgres pg_dump -U careerpilot careerpilot_db > /opt/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restart Stack:
```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml restart
```

### Stop Stack:
```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml down
```
*(Data in PostgreSQL and ChromaDB remains safe in Docker named volumes).*
