# SmartCampus AI — Team Setup Guide

This document describes how to configure the development environment and run SmartCampus AI locally.

The project consists of three main components:

- **Backend:** NestJS — authentication, users, roles, conversations and database operations.
- **AI Service:** FastAPI — conversational AI processing and communication with Ollama.
- **Infrastructure:** PostgreSQL — persistent storage, running through Docker.

---

# 1. Prerequisites

Install the following tools before starting:

| Tool | Purpose |
|---|---|
| Node.js and npm | NestJS backend |
| Python 3.12 | FastAPI AI service |
| PostgreSQL | Database |
| Docker Desktop | Running PostgreSQL |
| Git | Source code management |
| Ollama | Local LLM inference |

Verify the installations:

```bash
node --version
npm --version
python --version
docker --version
git --version
ollama --version
```

Python should be version 3.12.

---

# 2. Project Structure

The project is organized into the following directories:

```text
SmartCampus_AIGen/
│
├── backend/
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── .env
│
├── ai-service/
│   ├── app/
│   ├── requirements.txt
│   └── .env
│
├── infrastructure/
│   ├── docker-compose.yml
│   └── .env
│
└── documentation.md
```

The exact internal structure may evolve as the project develops.

---

# 3. Environment Configuration

Each developer must create their own environment files locally.

Do not commit `.env` files containing credentials or secrets.

## 3.1. Infrastructure environment

Create the file:

```text
infrastructure/.env
```

Add:

```env
POSTGRES_DB=smartcampus
POSTGRES_USER=smartcampus
POSTGRES_PASSWORD=smartcampus123
POSTGRES_PORT=5434
```

Description:

| Variable | Description |
|---|---|
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_PORT` | Host port used to access PostgreSQL |

The password can be chosen locally by each developer, provided the same credentials are used in the backend database connection.

## 3.2. Backend environment — NestJS

Create the file:

```text
backend/.env
```

Add:

```env
DATABASE_URL="postgresql://smartcampus:smartcampus123@localhost:5434/smartcampus"
ADMIN_EMAIL=admin@smartcampus.tn
ADMIN_PASSWORD=admin123456789@
ADMIN_NOM=Admin
ADMIN_PRENOM=SmartCampus
JWT_SECRET=805c887a64b02bf81c05a236770d43a4fac50360557ff92516db0c2be2aed376
```

Description:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_EMAIL` | Initial administrator email |
| `ADMIN_PASSWORD` | Initial administrator password |
| `ADMIN_NOM` | Administrator last name |
| `ADMIN_PRENOM` | Administrator first name |
| `JWT_SECRET` | Secret used to sign JWT tokens |

**Important:** The database username, password, database name and port in `DATABASE_URL` must match the infrastructure configuration.

The administrator variables are used by the application if its administrator initialization process is configured to read them.

## 3.3. AI Service environment — FastAPI

Create the file:

```text
ai-service/.env
```

Add:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:4b

LLM_TEMPERATURE=0.3
LLM_TIMEOUT=120
LLM_MAX_TOKENS=1024
```

Description:

| Variable | Description |
|---|---|
| `OLLAMA_BASE_URL` | Ollama server address |
| `OLLAMA_MODEL` | Model used for generation |
| `LLM_TEMPERATURE` | Controls response randomness |
| `LLM_TIMEOUT` | Maximum waiting time in seconds |
| `LLM_MAX_TOKENS` | Maximum number of generated tokens |

The Ollama server must be running and the configured model must be available locally.

---

# 4. Backend Dependencies — NestJS

The following commands install the additional backend dependencies required by the project.

Navigate to the backend directory:

```bash
cd backend
```

Install the required production dependencies:

```bash
npm install @nestjs/config @nestjs/jwt @prisma/client @prisma/adapter-pg bcryptjs class-validator class-transformer pg
```

Install Prisma as a development dependency:

```bash
npm install -D prisma
```

These commands install only the packages listed above rather than relying on a shared `package.json`.

After installation, generate the Prisma client:

```bash
npx prisma generate
```

If the project database migrations are already defined, apply them using the appropriate project workflow. For a local development database:

```bash
npx prisma migrate dev
```

Start the backend using the configured npm script:

```bash
npm run start:dev
```

The backend is expected to be available at:

```text
http://localhost:3000
```

---

# 5. AI Service Dependencies — FastAPI

Navigate to the AI service directory:

```bash
cd ai-service
```

## 5.1. Create a virtual environment

```bash
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use an appropriate execution policy for your local environment or activate the environment through another supported terminal.

## 5.2. Install dependencies

Install the packages declared in `requirements.txt`:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Main Python dependencies

| Dependency | Purpose |
|---|---|
| `fastapi` | REST API framework |
| `uvicorn[standard]` | ASGI server |
| `httpx` | HTTP communication |
| `pydantic` | Data validation |
| `pydantic-settings` | Configuration management |
| `python-dotenv` | Environment variables |
| `langgraph` | Agent workflow orchestration |
| `langchain-core` | LangChain core components |
| `pgvector` | Vector search integration |
| `psycopg[binary]` | PostgreSQL connectivity |
| `PyMuPDF` | PDF extraction |
| `pymupdf4llm` | PDF processing for LLM applications |
| `python-docx` | DOCX processing |
| `sentence-transformers` | Embedding generation |
| `transformers` | Pretrained models |
| `torch` | Deep learning |
| `scikit-learn` | Machine learning utilities |

These dependencies support the AI service and its document-processing, embedding and agent-orchestration capabilities.

## 5.3. Start FastAPI

Start the service using the project's application entry point.

For an application exposing `app` from `app.main`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If the actual entry point differs, use the module and application name defined in the project.

The service is expected to be available at:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

# 6. PostgreSQL Setup — Docker

Navigate to the infrastructure directory:

```bash
cd infrastructure
```

Make sure Docker Desktop is running.

Start PostgreSQL:

```bash
docker compose up -d
```

Verify the running containers:

```bash
docker compose ps
```

Check the PostgreSQL logs:

```bash
docker compose logs -f
```

PostgreSQL should be accessible from the host machine using:

```text
Host: localhost
Port: 5433
Database: smartcampus
```

The actual database credentials must match `infrastructure/.env` and the backend `DATABASE_URL`.

---

# 7. Ollama Setup

Install Ollama and make sure it is running.

Download the configured model:

```bash
ollama pull qwen3:4b
```

Check the available models:

```bash
ollama list
```

Start the Ollama server if it is not already running:

```bash
ollama serve
```

Ollama uses the default local address:

```text
http://localhost:11434
```

If Ollama is already running as a background application, do not start another server instance.

---

# 8. Running the Complete Application

The services must be running simultaneously.

Open separate terminal windows.

### Terminal 1 — PostgreSQL

```bash
cd infrastructure
docker compose up -d
```

### Terminal 2 — Ollama

Ensure Ollama is running and the model is available:

```bash
ollama list
```

### Terminal 3 — FastAPI

```bash
cd ai-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 4 — NestJS

```bash
cd backend
npm run start:dev
```

---

# 9. Service URLs

| Service | URL |
|---|---|
| NestJS Backend | `http://localhost:3000` |
| NestJS API prefix | `http://localhost:3000/api` |
| FastAPI | `http://localhost:8000` |
| FastAPI Swagger | `http://localhost:8000/docs` |
| FastAPI health check | `http://localhost:8000/api/v1/health` |
| Ollama | `http://localhost:11434` |
| PostgreSQL | `localhost:5433` |

---

# 10. Important Notes for Team Members

1. Each developer must create their own `.env` files.
2. Never commit database passwords, administrator passwords or JWT secrets.
3. Ensure PostgreSQL is running before starting NestJS.
4. Ensure Ollama is running and the configured model is downloaded before testing AI generation.
5. Activate the Python virtual environment before running FastAPI.
6. Install the required backend packages using the commands in Section 4 when setting up the backend.
7. Run `pip install -r requirements.txt` after pulling AI service dependency changes.
8. Run Prisma generation and apply database migrations when the Prisma schema or migrations change.
9. Keep the environment variable names consistent with the application's configuration.
10. Use the same PostgreSQL credentials across the infrastructure and backend configuration.
11. The backend dependency commands must be run when setting up a fresh local environment because `package.json` is not shared through Git.

---

# 11. Quick Setup Checklist

- [ ] Install Node.js and npm.
- [ ] Install Python 3.12.
- [ ] Install Docker Desktop.
- [ ] Install Ollama.
- [ ] Clone the project repository.
- [ ] Create `infrastructure/.env`.
- [ ] Create `backend/.env`.
- [ ] Create `ai-service/.env`.
- [ ] Start PostgreSQL using Docker Compose.
- [ ] Install the backend dependencies using the commands in Section 4.
- [ ] Generate Prisma client and apply migrations.
- [ ] Create the AI service virtual environment.
- [ ] Install Python dependencies.
- [ ] Download the `qwen3:4b` model.
- [ ] Start Ollama, FastAPI and NestJS.
- [ ] Test authentication and conversation generation.

**End of setup guide.**