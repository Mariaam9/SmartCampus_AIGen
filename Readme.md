# SmartCampus AI

SmartCampus AI is an intelligent university orientation platform.

This repository contains the frontend, backend, AI service, and database infrastructure.

## 1. Project Structure

```text
SmartCampus_AIGen/
├── frontend/              # React + TypeScript + Vite
├── backend/               # NestJS + Prisma backend API
│   ├── prisma/            # Prisma schema, migrations and seed
│   └── src/
│       ├── prisma/        # Prisma module and service
│       └── generated/     # Generated Prisma Client
├── ai-service/            # Python + FastAPI
├── infrastructure/        # Docker Compose configuration
├── .env.example
└── README.md
```

## 2. Prerequisites

Make sure you have installed:

- Git
- Node.js and npm
- Python 3.10+
- Docker

PostgreSQL is provided through Docker. A local PostgreSQL installation is not required.

## 3. Clone the Repository

```bash
git clone <repository-url>
cd SmartCampus_AIGen
```

## 4. Environment Configuration

Create the environment file from the example:

```bash
cp .env.example .env
```

Make sure the PostgreSQL connection information corresponds to the Docker configuration.

The backend uses the `DATABASE_URL` environment variable to connect to PostgreSQL.

Example:

```text
DATABASE_URL="postgresql://smartcampus:<password>@localhost:5433/smartcampus"
```

Do not commit the `.env` file to Git.

## 5. Database Setup — PostgreSQL + pgvector

PostgreSQL is provided by Docker.

From the project root:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml up -d
```

Verify that the containers are running:

```bash
docker ps
```

The PostgreSQL container should be healthy.

The default database configuration is:

```text
Host: localhost
Port: 5433
Database: smartcampus
User: smartcampus
```

You can access PostgreSQL directly inside the container:

```bash
docker exec -it smartcampus-postgres psql -U smartcampus -d smartcampus
```

Verify the pgvector extension:

```sql
SELECT extname FROM pg_extension;
```

If necessary:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Exit PostgreSQL:

```sql
\q
```

## 6. Backend Setup — NestJS + Prisma

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Generate the Prisma Client:

```bash
npx prisma generate
```

Check the migration status:

```bash
npx prisma migrate status
```

Apply the database migrations:

```bash
npx prisma migrate deploy
```

For local development, migrations can also be created with:

```bash
npx prisma migrate dev
```

### Load demonstration data

The project contains an official SmartCampus seed containing demonstration data for:

- IIT
- ISA
- ISB
- formations
- spécialités
- programmes
- matières
- conditions d'admission
- prérequis
- tarifs
- responsible accounts

Run:

```bash
npx prisma db seed
```

### Start the backend

```bash
npm run start:dev
```

The backend runs by default on:

```text
http://localhost:3000
```

### Test the database connection

The backend provides a test endpoint:

```text
GET http://localhost:3000/test/database
```

You can test it with:

```bash
curl http://localhost:3000/test/database
```

The endpoint should return the establishments and their formations retrieved from PostgreSQL through Prisma.

### Backend commands

Development mode:

```bash
npm run start:dev
```

Normal startup:

```bash
npm run start
```

Production build:

```bash
npm run build
```

Tests:

```bash
npm run test
```

End-to-end tests:

```bash
npm run test:e2e
```

## 7. Frontend Setup

Navigate to the frontend:

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

```text
http://localhost:5173/
```

## 8. AI Service Setup

Navigate to the AI service:

```bash
cd ai-service
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.venv\Scripts\Activate.ps1
```

On Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
python -m pip install -r requirements.txt
```

Start the FastAPI development server:

```bash
python -m uvicorn app.main:app --reload
```

Verify the API through its Swagger documentation if enabled.

## 9. Development Workflow

When starting work on the project:

### 1. Start PostgreSQL

From the project root:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml up -d
```

### 2. Start the backend

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

### 3. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Start the AI service

In another terminal:

```bash
cd ai-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

## 10. Database Development

The Prisma schema is located at:

```text
backend/prisma/schema.prisma
```

Migrations are located at:

```text
backend/prisma/migrations/
```

The database seed is located at:

```text
backend/prisma/seed.ts
```

After modifying the Prisma schema, create a migration:

```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

Then regenerate the Prisma Client:

```bash
npx prisma generate
```

If the database needs to be populated with the demonstration data:

```bash
npx prisma db seed
```


## 12. Stopping Services

Stop the frontend, backend and AI service with:

```text
Ctrl + C
```

To stop the Docker services:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yml down
```

This preserves the database volume and its data.

**Do not use `down -v` unless you intentionally want to delete the database data.**