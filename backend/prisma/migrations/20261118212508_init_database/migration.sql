-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CANDIDAT', 'RESPONSABLE', 'ADMIN');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('BROUILLON', 'PUBLIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "PreinscriptionStatus" AS ENUM ('BROUILLON', 'SOUMISE', 'EN_COURS', 'ACCEPTEE', 'REFUSEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "EquivalenceStatus" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "RendezVousStatus" AS ENUM ('PLANIFIE', 'CONFIRME', 'ANNULE', 'TERMINE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIF', 'ARCHIVE', 'SUPPRIME');

-- CreateEnum
CREATE TYPE "DocumentOperationType" AS ENUM ('AJOUT', 'MODIFICATION', 'SUPPRESSION');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'TERMINE', 'ECHEC');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateTable
CREATE TABLE "etablissements" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etablissements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formations" (
    "id" SERIAL NOT NULL,
    "etablissementId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "niveau" TEXT,
    "duree" TEXT,
    "statut" "PublicationStatus" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialites" (
    "id" SERIAL NOT NULL,
    "formationId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programmes" (
    "id" SERIAL NOT NULL,
    "specialiteId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "annee" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programmes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "credits" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_matieres" (
    "programmeId" INTEGER NOT NULL,
    "matiereId" INTEGER NOT NULL,
    "semestre" INTEGER,
    "coefficient" DOUBLE PRECISION,

    CONSTRAINT "programme_matieres_pkey" PRIMARY KEY ("programmeId","matiereId")
);

-- CreateTable
CREATE TABLE "conditions_admission" (
    "id" SERIAL NOT NULL,
    "formationId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "statutPublication" "PublicationStatus" NOT NULL DEFAULT 'BROUILLON',
    "dateDebutValidite" TIMESTAMP(3),
    "dateFinValidite" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prerequis" (
    "id" SERIAL NOT NULL,
    "formationId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "niveau" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prerequis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifs" (
    "id" SERIAL NOT NULL,
    "formationId" INTEGER NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "modalitesPaiement" TEXT,
    "statutPublication" "PublicationStatus" NOT NULL DEFAULT 'BROUILLON',
    "dateDebutValidite" TIMESTAMP(3),
    "dateFinValidite" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "telephone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils_academiques" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "niveauEtude" TEXT,
    "etablissement" TEXT,
    "diplome" TEXT,
    "anneeObtention" INTEGER,
    "moyenne" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profils_academiques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidats" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "statut" "CandidateStatus" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsables" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "etablissementId" INTEGER NOT NULL,
    "fonction" TEXT,
    "service" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitor_sessions" (
    "id" SERIAL NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,

    CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "visitorSessionId" INTEGER,
    "titre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "role" "MessageRole" NOT NULL,
    "contenu" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preinscriptions" (
    "id" SERIAL NOT NULL,
    "candidatId" INTEGER NOT NULL,
    "formationId" INTEGER NOT NULL,
    "statut" "PreinscriptionStatus" NOT NULL DEFAULT 'BROUILLON',
    "commentaire" TEXT,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preinscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equivalences" (
    "id" SERIAL NOT NULL,
    "preinscriptionId" INTEGER NOT NULL,
    "diplomeSource" TEXT NOT NULL,
    "etablissementSource" TEXT,
    "description" TEXT,
    "statut" "EquivalenceStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "decision" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equivalences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rendez_vous" (
    "id" SERIAL NOT NULL,
    "preinscriptionId" INTEGER NOT NULL,
    "responsableId" INTEGER NOT NULL,
    "dateHeure" TIMESTAMP(3) NOT NULL,
    "statut" "RendezVousStatus" NOT NULL DEFAULT 'PLANIFIE',
    "motif" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rendez_vous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entretiens" (
    "id" SERIAL NOT NULL,
    "rendezVousId" INTEGER NOT NULL,
    "resultat" TEXT,
    "commentaire" TEXT,
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entretiens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" SERIAL NOT NULL,
    "etablissementId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "uploadedBy" INTEGER,
    "statut" "DocumentStatus" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "taille" BIGINT,
    "hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "traitements_documents" (
    "id" SERIAL NOT NULL,
    "documentVersionId" INTEGER NOT NULL,
    "typeOperation" "DocumentOperationType" NOT NULL,
    "statut" "ProcessingStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateDebut" TIMESTAMP(3),
    "dateFin" TIMESTAMP(3),
    "erreur" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traitements_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_chunks" (
    "id" SERIAL NOT NULL,
    "documentVersionId" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "etablissements_code_key" ON "etablissements"("code");

-- CreateIndex
CREATE INDEX "formations_etablissementId_idx" ON "formations"("etablissementId");

-- CreateIndex
CREATE INDEX "formations_statut_idx" ON "formations"("statut");

-- CreateIndex
CREATE INDEX "specialites_formationId_idx" ON "specialites"("formationId");

-- CreateIndex
CREATE INDEX "programmes_specialiteId_idx" ON "programmes"("specialiteId");

-- CreateIndex
CREATE UNIQUE INDEX "matieres_code_key" ON "matieres"("code");

-- CreateIndex
CREATE INDEX "programme_matieres_matiereId_idx" ON "programme_matieres"("matiereId");

-- CreateIndex
CREATE INDEX "conditions_admission_formationId_idx" ON "conditions_admission"("formationId");

-- CreateIndex
CREATE INDEX "conditions_admission_statutPublication_idx" ON "conditions_admission"("statutPublication");

-- CreateIndex
CREATE INDEX "prerequis_formationId_idx" ON "prerequis"("formationId");

-- CreateIndex
CREATE INDEX "tarifs_formationId_idx" ON "tarifs"("formationId");

-- CreateIndex
CREATE INDEX "tarifs_statutPublication_idx" ON "tarifs"("statutPublication");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profils_academiques_userId_key" ON "profils_academiques"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "candidats_userId_key" ON "candidats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "responsables_userId_key" ON "responsables"("userId");

-- CreateIndex
CREATE INDEX "responsables_etablissementId_idx" ON "responsables"("etablissementId");

-- CreateIndex
CREATE UNIQUE INDEX "visitor_sessions_sessionToken_key" ON "visitor_sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "visitor_sessions_expiresAt_idx" ON "visitor_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "visitor_sessions_userId_idx" ON "visitor_sessions"("userId");

-- CreateIndex
CREATE INDEX "conversations_userId_idx" ON "conversations"("userId");

-- CreateIndex
CREATE INDEX "conversations_visitorSessionId_idx" ON "conversations"("visitorSessionId");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_expiresAt_idx" ON "messages"("expiresAt");

-- CreateIndex
CREATE INDEX "preinscriptions_candidatId_idx" ON "preinscriptions"("candidatId");

-- CreateIndex
CREATE INDEX "preinscriptions_formationId_idx" ON "preinscriptions"("formationId");

-- CreateIndex
CREATE INDEX "preinscriptions_statut_idx" ON "preinscriptions"("statut");

-- CreateIndex
CREATE INDEX "equivalences_preinscriptionId_idx" ON "equivalences"("preinscriptionId");

-- CreateIndex
CREATE INDEX "equivalences_statut_idx" ON "equivalences"("statut");

-- CreateIndex
CREATE INDEX "rendez_vous_preinscriptionId_idx" ON "rendez_vous"("preinscriptionId");

-- CreateIndex
CREATE INDEX "rendez_vous_responsableId_idx" ON "rendez_vous"("responsableId");

-- CreateIndex
CREATE INDEX "rendez_vous_dateHeure_idx" ON "rendez_vous"("dateHeure");

-- CreateIndex
CREATE UNIQUE INDEX "entretiens_rendezVousId_key" ON "entretiens"("rendezVousId");

-- CreateIndex
CREATE INDEX "documents_etablissementId_idx" ON "documents"("etablissementId");

-- CreateIndex
CREATE INDEX "documents_statut_idx" ON "documents"("statut");

-- CreateIndex
CREATE INDEX "document_versions_documentId_idx" ON "document_versions"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_documentId_version_key" ON "document_versions"("documentId", "version");

-- CreateIndex
CREATE INDEX "traitements_documents_documentVersionId_idx" ON "traitements_documents"("documentVersionId");

-- CreateIndex
CREATE INDEX "traitements_documents_statut_idx" ON "traitements_documents"("statut");

-- CreateIndex
CREATE INDEX "document_chunks_documentVersionId_idx" ON "document_chunks"("documentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "document_chunks_documentVersionId_chunkIndex_key" ON "document_chunks"("documentVersionId", "chunkIndex");

-- AddForeignKey
ALTER TABLE "formations" ADD CONSTRAINT "formations_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "specialites" ADD CONSTRAINT "specialites_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programmes" ADD CONSTRAINT "programmes_specialiteId_fkey" FOREIGN KEY ("specialiteId") REFERENCES "specialites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_matieres" ADD CONSTRAINT "programme_matieres_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "programmes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programme_matieres" ADD CONSTRAINT "programme_matieres_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditions_admission" ADD CONSTRAINT "conditions_admission_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prerequis" ADD CONSTRAINT "prerequis_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifs" ADD CONSTRAINT "tarifs_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils_academiques" ADD CONSTRAINT "profils_academiques_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidats" ADD CONSTRAINT "candidats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsables" ADD CONSTRAINT "responsables_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsables" ADD CONSTRAINT "responsables_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitor_sessions" ADD CONSTRAINT "visitor_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_visitorSessionId_fkey" FOREIGN KEY ("visitorSessionId") REFERENCES "visitor_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preinscriptions" ADD CONSTRAINT "preinscriptions_candidatId_fkey" FOREIGN KEY ("candidatId") REFERENCES "candidats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preinscriptions" ADD CONSTRAINT "preinscriptions_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "formations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equivalences" ADD CONSTRAINT "equivalences_preinscriptionId_fkey" FOREIGN KEY ("preinscriptionId") REFERENCES "preinscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_preinscriptionId_fkey" FOREIGN KEY ("preinscriptionId") REFERENCES "preinscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" ADD CONSTRAINT "rendez_vous_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "responsables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entretiens" ADD CONSTRAINT "entretiens_rendezVousId_fkey" FOREIGN KEY ("rendezVousId") REFERENCES "rendez_vous"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "traitements_documents" ADD CONSTRAINT "traitements_documents_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_documentVersionId_fkey" FOREIGN KEY ("documentVersionId") REFERENCES "document_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
