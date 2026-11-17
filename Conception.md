# SmartCampus AI – Architecture

## 1. Use Case Diagram

![SmartCampus AI Use Case Diagram](docs/images/use-case-diagram.png)

## 2. Architecture technique

![SmartCampus AI system design](docs/images/System_design.png)

## 2. Technological Stack

| Component | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend principal | NestJS |
| Service IA | Python + FastAPI |
| Orchestration agentique | LangGraph |
| Base métier | PostgreSQL |
| Base vectorielle | pgvector |
| Extraction PDF | PyMuPDF |
| Extraction DOCX | python-docx |
| Embeddings | Sentence Transformers ou modèle d'embedding adapté |
| Communication | HTTP/REST |
| Déploiement | Docker Compose |