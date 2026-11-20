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
│       └── prisma/        # Prisma module and service
├── ai-service/            # Python + FastAPI
├── infrastructure/        # Docker Compose configuration
├── .env.example
└── Readme.md
```

> `backend/src/generated/` is generated automatically by Prisma and is ignored by Git. It is recreated with `npx prisma generate`.

## 2. Prerequisites

Make sure the following tools are installed:

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

The project uses environment variables for database and service configuration.

### Root Environment File

Create the root environment file from the provided example:

```bash
cp .env.example .env
```

The root `.env` is used by the Docker Compose infrastructure.

Example:

```env
POSTGRES_DB=smartcampus
POSTGRES_USER=smartcampus
POSTGRES_PASSWORD=smartcampus123
POSTGRES_PORT=5433
```

### Backend Environment File

The backend requires its own environment file for Prisma and NestJS.

Create `backend/.env` with the following database connection:

```env
DATABASE_URL="postgresql://smartcampus:smartcampus123@localhost:5433/smartcampus"
```

The `DATABASE_URL` must match the PostgreSQL configuration used by the Docker container.

The backend `.env` is used by Prisma to connect to PostgreSQL.

### Important

Do not commit environment files containing passwords or other secrets.

The following files should remain local:

```text
.env
backend/.env
```

Use `.env.example` files to document the required environment variables without exposing sensitive values.

## 5. Database Setup — PostgreSQL + pgvector

Start PostgreSQL and pgvector using Docker Compose:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yaml up -d
```

Verify that the PostgreSQL container is running:

```bash
docker ps
```

The PostgreSQL container should be healthy.

### Database Connection

The database is accessible with the following configuration:

```text
Host: localhost
Port: 5433
Database: smartcampus
User: smartcampus
```

### Access PostgreSQL from the Terminal

You can access the PostgreSQL database directly using `psql` inside the Docker container:

```bash
docker exec -it smartcampus-postgres psql -U smartcampus -d smartcampus
```

Inside `psql`, you can inspect the database:

```sql
\dt
```

Display the formations:

```sql
SELECT * FROM "Formation" LIMIT 10;
```

Count the formations:

```sql
SELECT COUNT(*) FROM "Formation";
```

Exit `psql`:

```sql
\q
```

### Verify pgvector

Inside `psql`:

```sql
SELECT extname FROM pg_extension;
```

If necessary:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## 6. Backend Setup — NestJS + Prisma

Navigate to the backend:

```bash
cd backend
```

Install the dependencies:

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

Apply existing migrations:

```bash
npx prisma migrate deploy
```

For local development, migrations can also be created and applied with:

```bash
npx prisma migrate dev
```

### Access the Database with Prisma Studio

Prisma Studio provides a web interface to inspect the database tables and data without using DBeaver or pgAdmin.

From the backend directory:

```bash
npx prisma studio
```

Then open:

```text
http://localhost:51212
```

Prisma Studio uses the `DATABASE_URL` defined in `backend/.env`.

### Load Demonstration Data

To populate the database with the demonstration data:

```bash
npx prisma db seed
```

The seed includes:

- IIT
- ISA
- ISB
- Formations
- Spécialités
- Programmes
- Matières
- Conditions d'admission
- Prérequis
- Tarifs
- Responsable accounts

### Start the Backend

Start the NestJS development server:

```bash
npm run start:dev
```

The backend is available at:

```text
http://localhost:3000
```

### Test the Database Connection

The database connection can be tested through the backend endpoint:

```text
GET http://localhost:3000/test/database
```

Or with `curl`:

```bash
curl http://localhost:3000/test/database
```

### Backend Commands

Start the development server:

```bash
npm run start:dev
```

Start the application:

```bash
npm run start
```

Build the project:

```bash
npm run build
```

Run unit tests:

```bash
npm run test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

## 7. Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend is available at:

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
docker compose --env-file .env -f infrastructure/docker-compose.yaml up -d
```

Verify that the PostgreSQL container is running:

```bash
docker ps
```

### 2. Start the Backend

In a terminal:

```bash
cd backend
npm install
npx prisma generate
npm run start:dev
```

### 3. Start the Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

### 4. Start the AI Service

In another terminal:

```bash
cd ai-service
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

### 5. Access Prisma Studio

If you need to inspect the database tables and data:

```bash
cd backend
npx prisma studio
```

Then open:

```text
http://localhost:51212
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

### Create a Migration

After modifying the Prisma schema:

```bash
cd backend
npx prisma migrate dev --name <migration_name>
```

Then regenerate the Prisma Client:

```bash
npx prisma generate
```

### Apply Existing Migrations

To apply existing migrations:

```bash
npx prisma migrate deploy
```

### Seed the Database

If the database needs to be populated with the demonstration data:

```bash
npx prisma db seed
```

### Check Migration Status

```bash
npx prisma migrate status
```

## 11. Stopping Services

Stop the frontend, backend and AI service with:

```text
Ctrl + C
```

To stop the Docker services:

```bash
docker compose --env-file .env -f infrastructure/docker-compose.yaml down
```

This preserves the database volume and its data.

**Do not use `down -v` unless you intentionally want to delete the database data.**