# SmartCampus AI – Conception de la base de données 
## 1. Objet

Ce document présente la conception relationnelle de la base de données métier de SmartCampus AI.

Il couvre principalement les tâches :

- **SA-11** – Modèle relationnel métier
- **SA-12** – Tables du catalogue académique
- **SA-13** – Tables des utilisateurs et des candidatures
- **SA-14** – Gestion des documents et suivi des traitements
- **SA-15 à SA-18** – Mise en œuvre PostgreSQL, migrations et données de démonstration

---

## 2. Modèle relationnel

Le modèle comprend **24 tables** et **27 relations**.

Le diagramme est également disponible au format modifiable :

`docs/modele-relationnel-bd.png`

### Conventions

- **PK** : clé primaire
- **FK** : clé étrangère
- **UQ** : contrainte d'unicité
- **?** : attribut optionnel
- **1** : exactement un
- **0..1** : zéro ou un
- **0..N** : zéro ou plusieurs

---

## 3. Catalogue académique – SA-12

Le catalogue académique permet de gérer les établissements, formations, spécialités, programmes, matières, conditions d'admission, prérequis et tarifs.

| Table                  | Description                               |
| ---------------------- | ----------------------------------------- |
| `etablissements`       | Informations sur les établissements       |
| `formations`           | Formations proposées par un établissement |
| `specialites`          | Spécialités associées aux formations      |
| `programmes`           | Programmes d'études d'une spécialité      |
| `matieres`             | Matières enseignées                       |
| `programme_matieres`   | Association entre programmes et matières  |
| `conditions_admission` | Conditions d'admission des formations     |
| `prerequis`            | Prérequis des formations                  |
| `tarifs`               | Tarifs et modalités de paiement           |

### Relations principales

```text
Etablissement 1 ──── 0..N Formation
Formation 1 ──── 0..N Specialite
Specialite 1 ──── 0..N Programme

Programme 1 ──── 0..N ProgrammeMatiere
Matiere 1 ──── 0..N ProgrammeMatiere

Formation 1 ──── 0..N ConditionAdmission
Formation 1 ──── 0..N Prerequis
Formation 1 ──── 0..N Tarif
```

`programme_matieres` permet de représenter la relation **N\:N** entre les programmes et les matières.

---

## 4. Utilisateurs et candidatures – SA-13

La gestion des utilisateurs distingue les candidats, les responsables et les administrateurs.

| Table                 | Description                               |
| --------------------- | ----------------------------------------- |
| `users`               | Comptes utilisateurs                      |
| `profils_academiques` | Informations académiques d'un utilisateur |
| `candidats`           | Informations spécifiques aux candidats    |
| `responsables`        | Responsables rattachés à un établissement |
| `visitor_sessions`    | Sessions des visiteurs                    |
| `conversations`       | Conversations avec l'assistant            |
| `messages`            | Messages des conversations                |
| `preinscriptions`     | Préinscriptions des candidats             |
| `equivalences`        | Demandes d'équivalence                    |
| `rendez_vous`         | Rendez-vous liés aux préinscriptions      |
| `entretiens`          | Résultats des entretiens                  |

### Relations principales

```text
User 1 ──── 0..1 ProfilAcademique
User 1 ──── 0..1 Candidat
User 1 ──── 0..1 Responsable

User 1 ──── 0..N VisitorSession
User 1 ──── 0..N Conversation
VisitorSession 1 ──── 0..N Conversation
Conversation 1 ──── 0..N Message

Candidat 1 ──── 0..N Preinscription
Formation 1 ──── 0..N Preinscription
Preinscription 1 ──── 0..N Equivalence
Preinscription 1 ──── 0..N RendezVous
Responsable 1 ──── 0..N RendezVous
RendezVous 1 ──── 0..1 Entretien
```

Les relations entre `User` et `VisitorSession` ainsi qu'entre `User` et `Conversation` sont optionnelles du côté de l'entité référencée : une session visiteur ou une conversation peut exister sans utilisateur authentifié.

## 5. Documents et traitements – SA-14

La gestion documentaire permet de conserver les documents, leurs versions et le suivi de leur traitement pour l'alimentation du système documentaire utilisé par le service IA.

| Table                   | Description                            |
| ----------------------- | -------------------------------------- |
| `documents`             | Documents associés à un établissement  |
| `document_versions`     | Versions successives d'un document     |
| `traitements_documents` | Suivi des opérations de traitement     |
| `document_chunks`       | Fragments textuels issus des documents |

### Relations

```text
Etablissement 1 ──── 0..N Document
User 0..1 ──── 0..N Document

Document 1 ──── 0..N DocumentVersion

DocumentVersion 1 ──── 0..N TraitementDocument
DocumentVersion 1 ──── 0..N DocumentChunk
```

Une version est identifiée de manière unique par le couple :

```text
(documentId, version)
```

De même, un fragment est identifié de manière unique par :

```text
(documentVersionId, chunkIndex)
```

Le suivi des traitements permet d'enregistrer les opérations d'ajout, de modification ou de suppression ainsi que leur état d'exécution.

---

## 6. Contraintes principales

Le modèle applique les principales contraintes d'intégrité suivantes :

- clés primaires sur les 24 tables ;
- clés étrangères entre les entités liées ;
- unicité des codes d'établissement et des codes matière ;
- unicité des adresses e-mail utilisateur ;
- relations 1:1 assurées par des clés étrangères uniques ;
- clé primaire composée pour `programme_matieres` ;
- unicités composées pour les versions de documents et les fragments ;
- suppression en cascade lorsque les données dépendantes doivent être supprimées ;
- `SET NULL` pour certaines relations optionnelles ;
- `RESTRICT` pour les formations liées aux préinscriptions et les responsables liés aux rendez-vous.

---

## 7. Mise en œuvre – SA-15 à SA-18

La base de données est implémentée avec **PostgreSQL** et gérée avec **Prisma**.

La migration initiale crée :

- **10 types énumérés** ;
- **24 tables** ;
- les clés primaires et étrangères ;
- les contraintes d'unicité ;
- les index nécessaires.

Les données de démonstration sont chargées par le script :

`backend/prisma/seed.ts`

Elles comprennent notamment les établissements **IIT, ISA et ISB**, leurs formations et les comptes responsables de démonstration.

---

## 8. Correspondance avec les tâches

| Tâche     | Réalisation                                                |
| --------- | ---------------------------------------------------------- |
| **SA-11** | Modèle relationnel métier|
| **SA-12** | Concevoir les tables du catalogue académique|
| **SA-13** | Concevoir les tables des utilisateurs et des candidatures|
| **SA-14** | Concevoir les tables de gestion des documents et de synchronisation |
| **SA-15** | Base PostgreSQL et migration Prisma                        |
| **SA-16** | Installer et configurer PostgreSQL
 |
| **SA-17** | Créer les tables et les relations de la base de données    |
| **SA-18** | Alimenter la base avec des données de démonstration       |

---

## 9. Fichiers de référence

- `backend/prisma/schema.prisma` — modèle Prisma
- `backend/prisma/migrations/20261118212508_init_database/migration.sql` — migration SQL
- `backend/prisma/seed.ts` — données de démonstration
- `infrastructure/docker-compose.yaml` — infrastructure PostgreSQL
- `docs/images/modele-relationnel-bd.png` — diagramme relationnel

