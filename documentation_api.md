# Conception des API et des règles d’accès

## 1. Architecture des API

La plateforme utilise deux services principaux :

- **NestJS – Backend métier :** responsable de l’authentification, de la gestion des utilisateurs, des candidats, des conversations, de l’historique et des documents.
- **FastAPI – Service IA :** responsable du traitement des messages, de l’orchestration de l’agent, du RAG, de la recherche documentaire et de la génération des réponses.

Le frontend communique principalement avec NestJS. NestJS communique avec FastAPI lorsqu'un traitement IA est nécessaire.

### Répartition des responsabilités

| Fonctionnalité | Service responsable |
|---|---|
| Authentification et autorisation | NestJS |
| Gestion des candidats et profils | NestJS |
| Gestion des conversations et historique | NestJS |
| Gestion des documents officiels | NestJS |
| Extraction et indexation des documents | FastAPI |
| Recherche vectorielle (RAG) | FastAPI |
| Traitement des messages par l'agent IA | FastAPI |
| Exécution des actions métier confirmées | NestJS |

---

## 2. Gestion des utilisateurs et des candidats

### 2.1 Authentification

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/auth/register` | Créer un compte candidat | Visiteur |
| POST | `/api/auth/login` | Authentifier un utilisateur | Public |
| POST | `/api/auth/logout` | Déconnecter l'utilisateur | Utilisateur authentifié |
| GET | `/api/auth/me` | Récupérer les informations de l'utilisateur connecté | Utilisateur authentifié |

**Exemple : création d'un compte**

Requête :
```json
{
  "firstName": "Ahmed",
  "lastName": "Ben Ali",
  "email": "ahmed@example.com",
  "password": "********"
}
```

Réponse `201 Created` :
```json
{
  "id": "user_123",
  "firstName": "Ahmed",
  "lastName": "Ben Ali",
  "email": "ahmed@example.com",
  "role": "CANDIDATE"
}
```

### 2.2 Gestion du profil candidat

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| GET | `/api/candidates/me` | Consulter son profil | Candidat |
| PATCH | `/api/candidates/me` | Modifier son profil | Candidat |
| GET | `/api/candidates/:id` | Consulter le profil d'un candidat | Responsable NAU |
| GET | `/api/candidates` | Consulter la liste des candidats | Responsable NAU |

**Exemple : mise à jour du profil**

Requête :
```json
{
  "educationLevel": "Baccalaureat",
  "interests": ["Informatique", "Mathematiques"],
  "preferredFields": ["Génie logiciel", "Data Science"],
  "academicResults": {
    "average": 15.5
  }
}
```

Réponse `200 OK` :
```json
{
  "id": "candidate_123",
  "educationLevel": "Baccalaureat",
  "interests": ["Informatique", "Mathematiques"],
  "preferredFields": ["Génie logiciel", "Data Science"],
  "academicResults": {
    "average": 15.5
  },
  "updatedAt": "2026-11-17T10:30:00Z"
}
```

Le profil est progressivement enrichi à partir des informations fournies par le candidat et des informations extraites par l'agent. Les modifications importantes proposées par l'agent doivent être confirmées par le candidat avant leur enregistrement.

---

## 3. Gestion des conversations

La plateforme permet aux visiteurs de discuter avec l'agent sans créer immédiatement un compte. Lorsqu'ils créent un compte, leur historique peut être associé à leur nouveau compte.

### 3.1 API de gestion des conversations

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/conversations` | Créer une conversation | Visiteur / Candidat |
| GET | `/api/conversations` | Lister ses conversations | Candidat |
| GET | `/api/conversations/:id` | Consulter une conversation | Propriétaire |
| DELETE | `/api/conversations/:id` | Supprimer une conversation | Propriétaire |
| POST | `/api/conversations/:id/messages` | Envoyer un message à l'agent | Propriétaire |
| GET | `/api/conversations/:id/messages` | Consulter les messages | Propriétaire |

### 3.2 Création d'une conversation

Requête :
```json
{
  "language": "fr",
  "channel": "text"
}
```

Réponse `201 Created` :
```json
{
  "conversationId": "conv_123",
  "status": "ACTIVE",
  "createdAt": "2026-11-17T10:30:00Z"
}
```

Pour les visiteurs, le backend utilise une session anonyme identifiée par un jeton de session sécurisé.

### 3.3 Envoi d'un message

Requête :
```json
{
  "content": "Je souhaite connaître les formations disponibles en informatique.",
  "language": "fr"
}
```

NestJS récupère le contexte nécessaire (profil candidat, historique pertinent), puis transmet la requête au service FastAPI.

FastAPI traite le message à travers l'agent IA et retourne une réponse structurée.

Réponse `200 OK` :
```json
{
  "messageId": "msg_456",
  "conversationId": "conv_123",
  "content": "Plusieurs formations en informatique sont disponibles...",
  "intent": "COMPARE_PROGRAMS",
  "sources": [
    {
      "documentId": "doc_001",
      "title": "Guide des formations",
      "page": 12
    }
  ],
  "proposedActions": [],
  "requiresConfirmation": false,
  "createdAt": "2026-11-17T10:31:00Z"
}
```

### 3.4 Confirmation d'une action proposée par l'agent

Certaines actions nécessitent une confirmation explicite du candidat avant leur exécution.

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/actions/:id/confirm` | Confirmer une action proposée | Candidat concerné |
| POST | `/api/actions/:id/reject` | Refuser une action proposée | Candidat concerné |

Exemple de réponse de l'agent :
```json
{
  "content": "Voulez-vous confirmer votre demande de préinscription ?",
  "proposedActions": [
    {
      "id": "action_123",
      "type": "SUBMIT_PRE_REGISTRATION",
      "status": "PENDING_CONFIRMATION"
    }
  ],
  "requiresConfirmation": true
}
```

L'exécution effective de l'action est ensuite prise en charge par NestJS après vérification de l'identité, des droits et de la confirmation.

---

## 4. Gestion des documents officiels

Le Responsable NAU peut ajouter, modifier, consulter et supprimer les documents officiels utilisés par le système RAG.

Les documents acceptés sont les fichiers PDF et DOCX.

### 4.1 API de gestion documentaire

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/documents` | Ajouter un document | Responsable NAU |
| GET | `/api/documents` | Lister les documents | Responsable NAU |
| GET | `/api/documents/:id` | Consulter les informations d'un document | Responsable NAU |
| PATCH | `/api/documents/:id` | Modifier les métadonnées | Responsable NAU |
| DELETE | `/api/documents/:id` | Supprimer un document | Responsable NAU |
| POST | `/api/documents/:id/reindex` | Relancer l'indexation | Responsable NAU |

### 4.2 Ajout d'un document

Requête `multipart/form-data` :

- `file` : fichier PDF ou DOCX.
- `title` : titre du document.
- `establishment` : IIT ou ISB.
- `category` : admissions, formations, frais, etc.
- `year` : année de validité.

Réponse `202 Accepted` :
```json
{
  "documentId": "doc_001",
  "title": "Guide des admissions 2026",
  "status": "PROCESSING",
  "message": "Le document a été reçu et son indexation est en cours."
}
```

L'indexation est effectuée par FastAPI selon les étapes suivantes :

1. Extraction du texte.
2. Découpage en chunks.
3. Génération des embeddings.
4. Enregistrement des vecteurs et métadonnées dans PostgreSQL avec pgvector.
5. Passage du document au statut `INDEXED` après validation de l'indexation.

### 4.3 Consultation de l'état d'indexation

Réponse `200 OK` :
```json
{
  "documentId": "doc_001",
  "status": "INDEXED",
  "indexedChunks": 45,
  "updatedAt": "2026-11-17T10:45:00Z"
}
```

Les statuts possibles sont :

- `PROCESSING` : indexation en cours.
- `INDEXED` : document disponible pour la recherche.
- `FAILED` : erreur lors de l'indexation.
- `INACTIVE` : document désactivé ou non valide.

La suppression ou la modification d'un document doit également mettre à jour les chunks et embeddings associés afin d'éviter de retourner des informations obsolètes.

---

## 5. Communication interne entre NestJS et FastAPI

Ces API ne sont pas destinées à être directement appelées par le frontend. Elles servent à la communication entre les deux services.

| Méthode | Endpoint FastAPI | Description |
|---|---|---|
| POST | `/internal/agent/process` | Traiter un message avec l'agent |
| POST | `/internal/documents/index` | Déclencher l'indexation d'un document |
| DELETE | `/internal/documents/:id/index` | Supprimer les données vectorielles d'un document |
| POST | `/internal/rag/search` | Effectuer une recherche documentaire |

**Exemple : traitement d'un message**

Requête envoyée par NestJS :
```json
{
  "conversationId": "conv_123",
  "message": "Quelles sont les formations en informatique ?",
  "language": "fr",
  "candidateContext": {
    "educationLevel": "Baccalaureat",
    "interests": ["Informatique"]
  },
  "conversationHistory": []
}
```

Réponse de FastAPI :
```json
{
  "response": "Voici les formations correspondant à votre demande...",
  "intent": "SEARCH_PROGRAMS",
  "sources": [],
  "profileUpdates": [],
  "proposedActions": [],
  "requiresConfirmation": false
}
```

NestJS reste responsable de la validation des modifications métier et de leur persistance.

---

## 6. Règles d'accès selon le type d'utilisateur

Trois catégories d'utilisateurs sont considérées :

- **Visiteur :** utilisateur non authentifié pouvant découvrir la plateforme et discuter avec l'agent.
- **Candidat :** utilisateur authentifié pouvant gérer son profil et ses conversations.
- **Responsable NAU :** utilisateur disposant de droits administratifs sur les candidats et les documents.

### Matrice des autorisations

| Fonctionnalité | Visiteur | Candidat | Responsable NAU |
|---|:---:|:---:|:---:|
| Consulter les informations publiques | ✓ | ✓ | ✓ |
| Discuter avec l'agent | ✓ | ✓ | ✓ |
| Créer un compte | ✓ | — | — |
| Consulter son profil | — | ✓ | — |
| Modifier son profil | — | ✓ | — |
| Consulter ses conversations | Session courante | ✓ | — |
| Supprimer ses conversations | Session courante | ✓ | — |
| Consulter le profil d'un candidat | — | — | ✓ |
| Consulter la liste des candidats | — | — | ✓ |
| Ajouter un document officiel | — | — | ✓ |
| Modifier un document officiel | — | — | ✓ |
| Supprimer un document officiel | — | — | ✓ |
| Consulter l'état d'indexation | — | — | ✓ |

**Règles complémentaires :**

1. Un candidat ne peut consulter et modifier que son propre profil.
2. Un candidat ne peut accéder qu'à ses propres conversations et actions.
3. Un visiteur ne peut accéder qu'à sa session anonyme.
4. Un visiteur ne peut pas consulter les profils ou les conversations d'autres utilisateurs.
5. Seul le Responsable NAU peut gérer les documents officiels.
6. Les endpoints internes de FastAPI ne sont accessibles qu'aux services autorisés.
7. Les décisions officielles d'admission restent sous la responsabilité humaine.

---

## 7. Gestion des erreurs

Toutes les API doivent retourner des codes HTTP cohérents et des messages d'erreur structurés.

### Codes HTTP principaux

| Code | Signification | Exemple |
|---|---|---|
| 200 | OK | Consultation ou modification réussie |
| 201 | Created | Création d'un compte ou d'une conversation |
| 202 | Accepted | Document accepté pour indexation |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Utilisateur non authentifié |
| 403 | Forbidden | Utilisateur sans autorisation |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict | Ressource déjà existante ou conflit de version |
| 413 | Payload Too Large | Fichier trop volumineux |
| 415 | Unsupported Media Type | Format de document non accepté |
| 422 | Unprocessable Entity | Données syntaxiquement valides mais non conformes aux règles métier |
| 429 | Too Many Requests | Trop de requêtes |
| 500 | Internal Server Error | Erreur interne |
| 503 | Service Unavailable | Service IA temporairement indisponible |

### Format standard d'une réponse d'erreur

```json
{
  "statusCode": 403,
  "error": "FORBIDDEN",
  "message": "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  "timestamp": "2026-11-17T10:30:00Z",
  "path": "/api/documents"
}
```

Les messages d'erreur ne doivent pas exposer les informations sensibles, les détails internes de la base de données ou les secrets techniques.

### Gestion des erreurs entre NestJS et FastAPI

Si le service IA est indisponible :

- NestJS ne doit pas perdre le message envoyé par le candidat.
- Le message peut être conservé avec un statut `PROCESSING` ou `FAILED`.
- Une réponse adaptée doit informer le candidat que le service est temporairement indisponible.
- Une nouvelle tentative peut être effectuée sans créer de doublons.

Pour l'indexation documentaire, un échec doit être enregistré et signalé au Responsable NAU. Un document ne doit pas être considéré comme disponible pour le RAG tant que son indexation n'est pas terminée avec succès.

---

## 8. Mesures de sécurité

Les règles suivantes doivent être appliquées à l'ensemble des API :

- Utilisation de JWT pour authentifier les utilisateurs.
- Contrôle des rôles et permissions côté NestJS (RBAC).
- Vérification de la propriété des ressources pour chaque conversation et profil.
- Validation des données reçues (DTO et validation des fichiers).
- Limitation de la taille et des formats des documents téléversés.
- Communication sécurisée entre NestJS et FastAPI.
- Protection des endpoints internes par authentification interservices.
- Journalisation des opérations administratives sensibles.
- Protection contre les accès directs non autorisés aux ressources.

**Principe fondamental :** le frontend ne décide jamais des autorisations. Toutes les permissions sont vérifiées côté backend, même si l'interface masque certaines fonctionnalités.

---

## 9. Synthèse

La conception proposée repose sur une séparation claire des responsabilités :

- NestJS expose les API métier et contrôle les autorisations.
- FastAPI fournit les fonctionnalités d'intelligence artificielle et de recherche documentaire.
- PostgreSQL conserve les données métier et les informations nécessaires à l'historique.
- pgvector conserve les embeddings et les métadonnées des documents indexés.

Cette organisation permet de maintenir une architecture évolutive, sécurisée et cohérente avec les fonctionnalités de la plateforme SmartCampus AI.