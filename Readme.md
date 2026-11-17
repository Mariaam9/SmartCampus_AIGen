# SmartCampus AI

SmartCampus AI is an intelligent university orientation platform.

This repository contains the frontend, backend, AI service, and database infrastructure.

## 1. Project Structure

```text
SmartCampus_AIGen/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Main backend API
├── ai-service/        # Python + FastAPI
├── infrastructure/    # Docker Compose configuration
├── .env.example
└── README.md
```

## 2. Prerequisites

Make sure you have installed:

- Git
- Node.js and npm
- Python 3.10+
- Docker Desktop (optional, only if using Docker PostgreSQL)

## 3. Clone the Repository

```bash
git clone <repository-url>
cd SmartCampus_AIGen
```

## 4. Database Setup (PostgreSQL + pgvector)

You can use either Docker PostgreSQL or a local PostgreSQL installation.

```

Start PostgreSQL:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml up -d
```

Verify the container:

```bash
docker ps
```

The PostgreSQL container should have a healthy status.

Verify the database and pgvector extension:

```bash
docker exec -it smartcampus-postgres psql -U smartcampus -d smartcampus
```

Inside PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
SELECT extname FROM pg_extension;
```

Exit with:

```sql
\q
```

Database connection:

```text
Host: localhost
Port: 5433
Database: smartcampus
```

### Option B: Using Local PostgreSQL

If PostgreSQL is already installed, you can use your local database instead.

Create a database named `smartcampus`, enable pgvector if required, and configure the application connection string to use your local PostgreSQL port (usually 5432).

**Note:** You do not need Docker if you choose local PostgreSQL.

## 5. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open:

http://localhost:5173/

Verify that the Vite + React application loads successfully.

## 6. AI Service Setup

Navigate to the AI service:

```bash
cd ai-service
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it (Windows PowerShell):

```bash
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```


Start the FastAPI development server using the project's configured application entry point.

Verify the API through its Swagger documentation if enabled.
```bash
python -m uvicorn app.main:app --reload 
```
## 7. Backend Setup (NestJS)

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```
Start the NestJS development server:
```bash
npm run start:dev
```
The backend should start in development mode with automatic reloading when source files change.

By default, NestJS runs on:

http://localhost:3000/

Test the Backend

Open the following URL in your browser:

http://localhost:3000/

You should receive the default NestJS response if you haven't modified the initial application endpoint.

Alternatively, test using curl:

curl http://localhost:3000/

Expected default response:

Hello World!

You can also verify that the application starts without compilation errors in the terminal.

Available NestJS commands:

# Development mode with automatic reload
npm run start:dev

# Normal startup
npm run start

# Production build
npm run build

# Run tests
npm run test

# Run end-to-end tests
npm run test:e2e

## 8. Final Verification Checklist

Before considering the development environment ready, verify:

- [ ] Repository cloned successfully.
- [ ] Frontend dependencies installed.
- [ ] Frontend development server starts.
- [ ] Backend dependencies installed.
- [ ] Backend API starts successfully.
- [ ] AI service virtual environment created.
- [ ] AI service dependencies installed.
- [ ] AI service starts successfully.
- [ ] PostgreSQL starts successfully (Docker or local).
- [ ] PostgreSQL connection works.
- [ ] pgvector extension is available.

## 9. Stopping Services

Stop the frontend, backend, and AI service using `Ctrl + C` in their respective terminals.

If using Docker PostgreSQL:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml down
```

**Important:** This command preserves the database volume and its data. Avoid using `down -v` unless you intentionally want to delete the database data.