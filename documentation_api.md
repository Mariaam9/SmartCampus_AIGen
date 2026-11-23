# SmartCampus AI — Conception des API et des règles d’accès

**Document technique — Architecture des services, conception des API et contrôle des accès**

---

# 1. Architecture des API

## 1.1. Architecture générale

La plateforme SmartCampus AI repose sur une architecture distribuée composée de deux services principaux :

- **NestJS – Backend métier :** responsable de l’authentification, de la gestion des utilisateurs, des rôles, des sessions visiteurs, des conversations, de l’historique des échanges et des opérations métier.
- **FastAPI – Service IA :** responsable du traitement des messages, de l'orchestration de l'agent conversationnel, de la construction du contexte et de la génération des réponses à l'aide d'un modèle de langage.

Le frontend communique principalement avec NestJS. Lorsqu'un utilisateur envoie un message, NestJS vérifie les autorisations, récupère le contexte conversationnel nécessaire et transmet la requête au service FastAPI.

FastAPI construit le contexte de génération, applique le prompt système et communique avec le modèle de langage afin de produire une réponse. Cette réponse est ensuite retournée à NestJS, qui assure sa persistance et son retour au frontend.

Cette séparation permet de distinguer les responsabilités métier des traitements liés à l'intelligence artificielle.

## 1.2. Répartition des responsabilités

| Fonctionnalité | Service responsable |
|---|---|
| Authentification et autorisation | NestJS |
| Gestion des utilisateurs et des rôles | NestJS |
| Gestion des profils candidats | NestJS |
| Gestion des sessions visiteurs | NestJS |
| Gestion des conversations et de l'historique | NestJS |
| Persistance des messages | NestJS / PostgreSQL |
| Association des conversations visiteurs à un compte | NestJS |
| Gestion des documents officiels | NestJS |
| Traitement des messages par l'agent IA | FastAPI |
| Construction du contexte conversationnel | FastAPI |
| Génération des réponses | FastAPI / Ollama |
| Extraction et indexation des documents | FastAPI |
| Génération des embeddings | FastAPI |
| Recherche vectorielle (RAG) | FastAPI |
| Enrichissement du profil candidat | FastAPI / NestJS |
| Validation et exécution des actions métier | NestJS |

## 1.3. Technologies utilisées

| Composant | Technologie |
|---|---|
| Backend métier | NestJS |
| Service IA | FastAPI |
| Base de données relationnelle | PostgreSQL |
| ORM | Prisma |
| Authentification | JWT |
| Modèle de langage | Ollama |
| Communication interservices | HTTP / API REST |
| Recherche vectorielle | PostgreSQL / pgvector |
| Interface utilisateur | Application frontend |

---

# 2. Gestion des utilisateurs et des candidats

## 2.1. Authentification

L'authentification est assurée par NestJS. La plateforme distingue les utilisateurs non authentifiés des utilisateurs disposant d'un compte.

Les utilisateurs authentifiés reçoivent un jeton JWT permettant d'accéder aux endpoints protégés.

### API d'authentification

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/auth/register/candidat` | Créer un compte candidat | Public |
| POST | `/api/auth/register/responsable` | Créer un compte responsable | Selon les permissions de la plateforme |
| POST | `/api/auth/login` | Authentifier un utilisateur | Public |
| GET | `/api/auth/me` | Récupérer les informations de l'utilisateur connecté | Utilisateur authentifié |
| POST | `/api/auth/logout` | Déconnecter l'utilisateur | Utilisateur authentifié |

### Exemple : création d'un compte candidat

Requête :

```http
POST /api/auth/register/candidat
Content-Type: application/json
```

```json
{
  "nom": "Ben Ali",
  "prenom": "Ahmed",
  "email": "ahmed@example.com",
  "password": "********",
  "telephone": "22123456"
}
```

Les champs `nom`, `prenom`, `email` et `password` permettent de créer le compte candidat. Le champ `telephone` est facultatif.

### Exemple : connexion

Requête :

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "ahmed@example.com",
  "password": "********"
}
```

Après vérification des identifiants, le backend retourne un jeton JWT.

Ce jeton est transmis dans l'en-tête des requêtes nécessitant une authentification :

```http
Authorization: Bearer <JWT_TOKEN>
```

### Consultation du profil connecté

```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

Cet endpoint permet de récupérer les informations associées à l'utilisateur authentifié.

## 2.2. Gestion des rôles

La plateforme distingue trois catégories principales d'utilisateurs :

- **CANDIDAT :** utilisateur inscrit qui peut consulter son espace personnel, gérer ses informations et accéder à ses conversations.
- **RESPONSABLE :** utilisateur chargé des opérations administratives liées à la gestion des candidats et des documents institutionnels, selon les permissions attribuées.
- **ADMIN :** administrateur disposant de droits de gestion et de configuration de la plateforme.

Les rôles sont définis dans le backend et permettent de contrôler l'accès aux fonctionnalités et aux ressources.

## 2.3. Gestion du profil candidat

Le profil candidat centralise les informations nécessaires à la personnalisation de l'accompagnement proposé par l'agent IA.

Il peut notamment contenir :

- Le niveau d'études.
- Les intérêts académiques.
- Les domaines de formation préférés.
- Les résultats scolaires.
- Les objectifs académiques et professionnels.

### API de gestion du profil

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| GET | `/api/candidates/me` | Consulter son profil | Candidat |
| PATCH | `/api/candidates/me` | Modifier son profil | Candidat |
| GET | `/api/candidates/:id` | Consulter le profil d'un candidat | Responsable |
| GET | `/api/candidates` | Consulter la liste des candidats | Responsable |

### Exemple : mise à jour du profil

Requête :

```json
{
  "educationLevel": "Baccalaureat",
  "interests": [
    "Informatique",
    "Mathematiques"
  ],
  "preferredFields": [
    "Génie logiciel",
    "Data Science"
  ],
  "academicResults": {
    "average": 15.5
  }
}
```

Les informations du profil peuvent être enrichies progressivement à partir des données fournies par le candidat et des informations pertinentes identifiées au cours des échanges avec l'agent IA.

Les modifications importantes proposées par l'agent doivent être soumises à la validation explicite du candidat avant leur enregistrement.

---

# 3. Gestion des conversations

La plateforme permet aux visiteurs d'interagir avec l'agent IA sans créer immédiatement un compte.

Lorsqu'un visiteur crée un compte candidat, son historique de conversation peut être associé à son nouveau compte afin de garantir la continuité des échanges.

Les conversations et les messages sont conservés dans PostgreSQL.

## 3.1. API de gestion des conversations

Les endpoints sont organisés selon le type d'utilisateur.

### A. API des visiteurs

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/visitor/session` | Créer une session anonyme | Public |
| GET | `/api/visitor/test` | Vérifier l'accès à la session visiteur | Visiteur |
| POST | `/api/visitor/conversations` | Créer une conversation | Visiteur |
| GET | `/api/visitor/conversations` | Lister les conversations de la session | Visiteur |
| GET | `/api/visitor/conversations/:id` | Consulter une conversation et ses messages | Propriétaire |
| POST | `/api/visitor/conversations/:id/messages` | Envoyer un message à l'agent | Propriétaire |

Le visiteur est identifié par un jeton de session sécurisé transmis dans l'en-tête :

```http
x-visitor-token: <VISITOR_TOKEN>
```

Le jeton est généré de manière sécurisée. Sa version hachée est conservée dans la base de données afin de limiter les risques liés à son exposition.

La session possède une durée de validité de sept jours, renouvelée lors d'une utilisation valide.

### B. API des candidats authentifiés

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/conversations` | Créer une conversation | Candidat |
| GET | `/api/conversations` | Lister ses conversations | Candidat |
| GET | `/api/conversations/:id` | Consulter une conversation et ses messages | Propriétaire |
| POST | `/api/conversations/:id/messages` | Envoyer un message à l'agent | Propriétaire |
| DELETE | `/api/conversations/:id` | Supprimer une conversation | Propriétaire |

Les endpoints candidats nécessitent un JWT valide :

```http
Authorization: Bearer <JWT_TOKEN>
```

L'accès à chaque conversation est contrôlé côté backend à partir de son propriétaire.

## 3.2. Création d'une conversation

Pour un candidat authentifié :

```http
POST /api/conversations
Authorization: Bearer <JWT_TOKEN>
```

Pour un visiteur :

```http
POST /api/visitor/conversations
x-visitor-token: <VISITOR_TOKEN>
```

Une conversation est créée et associée à son propriétaire.

Exemple de réponse :

```json
{
  "id": 123,
  "titre": "Nouvelle conversation",
  "createdAt": "2026-11-17T10:30:00.000Z",
  "updatedAt": "2026-11-17T10:30:00.000Z"
}
```

Les identifiants des conversations sont numériques et générés par la base de données.

## 3.3. Envoi d'un message

Un utilisateur transmet son message à travers l'endpoint correspondant à son type de session.

Pour un candidat :

```http
POST /api/conversations/:id/messages
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Pour un visiteur :

```http
POST /api/visitor/conversations/:id/messages
x-visitor-token: <VISITOR_TOKEN>
Content-Type: application/json
```

Requête :

```json
{
  "contenu": "Je souhaite connaître les formations disponibles en informatique."
}
```

### Traitement du message

Le traitement suit les étapes suivantes :

1. NestJS vérifie l'identité de l'utilisateur.
2. NestJS vérifie que la conversation appartient bien à cet utilisateur ou à sa session visiteur.
3. NestJS récupère les messages précédents de la conversation.
4. Le message courant est enregistré dans PostgreSQL.
5. NestJS transmet le message et l'historique au service FastAPI.
6. FastAPI construit le contexte conversationnel et prépare les messages destinés au modèle de langage.
7. FastAPI interroge Ollama pour générer une réponse.
8. La réponse est retournée à NestJS.
9. NestJS enregistre la réponse de l'assistant dans PostgreSQL.
10. NestJS retourne les messages au frontend.

L'historique transmis au service IA est limité aux dix derniers messages utilisateur et assistant. Le message courant est transmis séparément afin d'éviter les duplications.

### Communication entre NestJS et FastAPI

NestJS transmet une requête au service IA :

```http
POST /api/v1/chat
Content-Type: application/json
```

Exemple de requête :

```json
{
  "conversation_id": 123,
  "message": "Je souhaite connaître les formations disponibles en informatique.",
  "history": [
    {
      "role": "user",
      "content": "Je suis intéressé par l'informatique."
    },
    {
      "role": "assistant",
      "content": "Quels domaines de l'informatique vous intéressent ?"
    }
  ]
}
```

FastAPI applique le prompt système, assemble l'historique et le message courant, puis transmet le contexte au modèle de langage.

Exemple de réponse :

```json
{
  "response": "Plusieurs domaines de formation en informatique peuvent vous intéresser...",
  "model": "qwen3:4b"
}
```

### Réponse retournée par NestJS

NestJS retourne les messages enregistrés ainsi que le modèle utilisé.

Exemple de structure :

```json
{
  "userMessage": {
    "role": "USER",
    "contenu": "Je souhaite connaître les formations disponibles en informatique."
  },
  "assistantMessage": {
    "role": "ASSISTANT",
    "contenu": "Plusieurs domaines de formation en informatique peuvent vous intéresser..."
  },
  "model": "qwen3:4b"
}
```

Les objets de messages contiennent également leurs identifiants et leurs dates de création.

## 3.4. Transfert des conversations visiteurs vers un compte candidat

Lorsqu'un visiteur crée un compte candidat, les conversations existantes peuvent être associées à son compte.

Le backend utilise l'identifiant de la session visiteur pour retrouver les conversations concernées et les associer à l'utilisateur nouvellement créé.

Cette fonctionnalité garantit la continuité des échanges et permet au candidat de retrouver son historique après son inscription.

Après le transfert, le frontend utilise le JWT du candidat pour accéder aux conversations authentifiées.

## 3.5. Confirmation des actions proposées par l'agent

Certaines opérations métier peuvent nécessiter une confirmation explicite du candidat avant leur exécution.

Par exemple, une demande de préinscription peut suivre le processus suivant :

1. Le candidat exprime son souhait d'effectuer une préinscription.
2. L'agent identifie l'action demandée.
3. L'agent présente les informations et demande une confirmation.
4. Le candidat accepte ou refuse l'action.
5. NestJS vérifie les droits et les conditions métier.
6. NestJS exécute l'action uniquement après confirmation valide.

### API de confirmation des actions

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/actions/:id/confirm` | Confirmer une action proposée | Candidat concerné |
| POST | `/api/actions/:id/reject` | Refuser une action proposée | Candidat concerné |

Ces endpoints permettent de séparer la proposition d'une action par l'agent IA de son exécution effective par le backend métier.

L'agent IA ne doit jamais exécuter directement une opération métier sensible.

---

# 4. Gestion des documents officiels

La gestion documentaire permet aux responsables autorisés d'administrer les documents institutionnels utilisés comme sources d'information par l'agent IA.

Les formats envisagés sont PDF et DOCX.

## 4.1. API de gestion documentaire

| Méthode | Endpoint | Description | Accès |
|---|---|---|---|
| POST | `/api/documents` | Ajouter un document | Responsable |
| GET | `/api/documents` | Lister les documents | Responsable |
| GET | `/api/documents/:id` | Consulter les informations d'un document | Responsable |
| PATCH | `/api/documents/:id` | Modifier les métadonnées | Responsable |
| DELETE | `/api/documents/:id` | Supprimer un document | Responsable |
| POST | `/api/documents/:id/reindex` | Relancer l'indexation | Responsable |

## 4.2. Ajout d'un document

Le téléversement d'un document utilise le format `multipart/form-data`.

Les champs attendus sont :

- `file` : fichier PDF ou DOCX.
- `title` : titre du document.
- `establishment` : établissement concerné, par exemple IIT ou ISB.
- `category` : admissions, formations, frais, etc.
- `year` : année de validité.

Exemple de réponse :

```json
{
  "documentId": "doc_001",
  "title": "Guide des admissions 2026",
  "status": "PROCESSING",
  "message": "Le document a été reçu et son indexation est en cours."
}
```

## 4.3. Processus d'indexation documentaire

L'indexation est effectuée par FastAPI selon les étapes suivantes :

1. Extraction du texte du document.
2. Découpage du texte en segments (chunks).
3. Génération des embeddings.
4. Enregistrement des vecteurs et des métadonnées dans PostgreSQL avec pgvector.
5. Validation de l'indexation.
6. Passage du document au statut `INDEXED`.

### Statuts d'indexation

| Statut | Description |
|---|---|
| `PROCESSING` | Indexation en cours |
| `INDEXED` | Document disponible pour la recherche |
| `FAILED` | Erreur lors de l'indexation |
| `INACTIVE` | Document désactivé ou non valide |

La modification ou la suppression d'un document doit également mettre à jour les chunks et les embeddings associés afin d'éviter de retourner des informations obsolètes.

## 4.4. Consultation de l'état d'indexation

Exemple de réponse :

```json
{
  "documentId": "doc_001",
  "status": "INDEXED",
  "indexedChunks": 45,
  "updatedAt": "2026-11-17T10:45:00Z"
}
```

---

# 5. Communication interne entre NestJS et FastAPI

La communication entre NestJS et FastAPI est effectuée par HTTP. Les endpoints du service IA sont destinés à être utilisés par le backend métier et ne sont pas directement exposés aux utilisateurs finaux.

## 5.1. API FastAPI

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/health` | Vérifier l'état du service IA |
| GET | `/api/v1/test` | Vérifier le fonctionnement de l'API |
| POST | `/api/v1/chat` | Traiter un message et générer une réponse |

## 5.2. Traitement d'un message

NestJS transmet au service FastAPI les informations nécessaires à la génération :

- L'identifiant de la conversation.
- Le message courant.
- L'historique conversationnel.

Exemple de requête :

```json
{
  "conversation_id": 123,
  "message": "Quelles sont les formations en informatique ?",
  "history": [
    {
      "role": "user",
      "content": "Je souhaite poursuivre des études supérieures."
    },
    {
      "role": "assistant",
      "content": "Quel domaine d'études vous intéresse ?"
    }
  ]
}
```

FastAPI construit le contexte du modèle à partir de trois éléments :

1. Le prompt système défini côté service IA.
2. L'historique de la conversation.
3. Le message courant de l'utilisateur.

Le service interroge ensuite Ollama et retourne une réponse structurée.

Exemple de réponse :

```json
{
  "response": "Voici quelques orientations possibles...",
  "model": "qwen3:4b"
}
```

## 5.3. Évolution de la communication interservices

L'architecture permet d'intégrer ultérieurement des fonctionnalités supplémentaires :

| Endpoint envisagé | Description |
|---|---|
| `POST /internal/agent/process` | Traitement avancé d'une requête par l'agent |
| `POST /internal/documents/index` | Déclencher l'indexation d'un document |
| `DELETE /internal/documents/:id/index` | Supprimer les données vectorielles d'un document |
| `POST /internal/rag/search` | Effectuer une recherche documentaire |

Ces endpoints complètent l'API conversationnelle et permettent d'étendre progressivement les capacités du service IA.

NestJS reste responsable de la validation des opérations métier et de leur persistance.

---

# 6. Règles d'accès selon le type d'utilisateur

Trois catégories principales d'utilisateurs sont considérées.

- **Visiteur :** utilisateur non authentifié pouvant accéder aux fonctionnalités publiques et discuter avec l'agent à travers une session anonyme.
- **Candidat :** utilisateur authentifié pouvant gérer ses informations personnelles et accéder à ses conversations.
- **Responsable NAU :** utilisateur disposant de permissions administratives sur les candidats et les documents institutionnels.

## 6.1. Matrice des autorisations

| Fonctionnalité | Visiteur | Candidat | Responsable NAU |
|---|:---:|:---:|:---:|
| Consulter les informations publiques | ✓ | ✓ | ✓ |
| Discuter avec l'agent | ✓ | ✓ | Selon permissions |
| Créer un compte | ✓ | — | — |
| Consulter son profil | — | ✓ | — |
| Modifier son profil | — | ✓ | — |
| Consulter ses conversations | Session courante | ✓ | — |
| Créer une conversation | ✓ | ✓ | Selon permissions |
| Supprimer ses conversations | Session courante | ✓ | — |
| Consulter le profil d'un candidat | — | — | ✓ |
| Consulter la liste des candidats | — | — | ✓ |
| Ajouter un document officiel | — | — | ✓ |
| Modifier un document officiel | — | — | ✓ |
| Supprimer un document officiel | — | — | ✓ |
| Consulter l'état d'indexation | — | — | ✓ |
| Confirmer une action proposée | — | ✓ | Selon permissions |

## 6.2. Règles complémentaires

1. Un candidat ne peut consulter et modifier que ses propres informations personnelles.
2. Un candidat ne peut accéder qu'à ses propres conversations et aux actions qui lui sont associées.
3. Un visiteur ne peut accéder qu'aux données liées à sa session anonyme.
4. Un visiteur ne peut pas consulter les profils ou les conversations d'autres utilisateurs.
5. Seuls les responsables disposant des permissions appropriées peuvent gérer les documents officiels.
6. Les endpoints internes du service IA doivent être protégés contre les appels non autorisés.
7. Les décisions officielles d'admission restent sous la responsabilité des personnes et des organismes compétents.
8. Toute action métier sensible doit être validée côté backend avant son exécution.

---

# 7. Gestion des erreurs

Les API doivent retourner des codes HTTP cohérents et des messages d'erreur structurés afin de faciliter le diagnostic et la gestion des incidents.

## 7.1. Codes HTTP principaux

| Code | Signification | Exemple |
|---|---|---|
| 200 | OK | Consultation ou traitement réussi |
| 201 | Created | Création d'un compte ou d'une conversation |
| 202 | Accepted | Document accepté pour indexation |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Utilisateur non authentifié |
| 403 | Forbidden | Utilisateur sans autorisation |
| 404 | Not Found | Ressource inexistante |
| 409 | Conflict | Ressource déjà existante ou conflit |
| 413 | Payload Too Large | Fichier trop volumineux |
| 415 | Unsupported Media Type | Format de document non accepté |
| 422 | Unprocessable Entity | Données non conformes aux règles de validation |
| 429 | Too Many Requests | Trop de requêtes |
| 500 | Internal Server Error | Erreur interne |
| 502 | Bad Gateway | Erreur de communication avec un service externe |
| 503 | Service Unavailable | Service temporairement indisponible |
| 504 | Gateway Timeout | Délai d'attente du service IA dépassé |

## 7.2. Format standard d'une réponse d'erreur

Exemple :

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

## 7.3. Gestion des erreurs entre NestJS et FastAPI

En cas d'indisponibilité du service IA :

- NestJS doit informer l'utilisateur que le service est temporairement indisponible.
- Le message utilisateur doit être conservé afin de limiter les pertes de données.
- Le traitement peut être associé à un statut `PROCESSING` ou `FAILED` dans le cadre d'un mécanisme de suivi des traitements.
- Une nouvelle tentative doit éviter de créer des messages en double.

La gestion des statuts de traitement, des tentatives automatiques et de l'idempotence constitue une partie importante de la fiabilisation de la communication interservices.

Pour l'indexation documentaire, un échec doit être enregistré et signalé au responsable concerné. Un document ne doit pas être considéré comme disponible pour le RAG tant que son indexation n'est pas terminée avec succès.

---

# 8. Mesures de sécurité

La sécurité est prise en compte à travers les mécanismes d'authentification, de contrôle des permissions, de validation des données et de protection des communications entre les services.

Les mesures suivantes structurent la sécurité de la plateforme :

- Utilisation de JWT pour authentifier les utilisateurs.
- Contrôle des rôles et des permissions côté NestJS (RBAC).
- Vérification de la propriété des ressources pour chaque conversation et profil.
- Utilisation de jetons de session sécurisés pour les visiteurs.
- Hachage des jetons visiteurs avant leur stockage.
- Validation des données reçues à travers les DTO.
- Limitation de la taille et des formats des documents téléversés.
- Communication sécurisée entre NestJS et FastAPI.
- Protection des endpoints internes par authentification interservices.
- Journalisation des opérations administratives sensibles.
- Protection contre les accès directs non autorisés aux ressources.
- Stockage sécurisé des secrets et des clés d'authentification.

## 8.1. Contrôle des accès

Le frontend ne constitue jamais une source d'autorisation.

Même si l'interface masque certaines fonctionnalités en fonction du rôle de l'utilisateur, toutes les permissions doivent être vérifiées côté backend.

La vérification de la propriété des ressources est indispensable pour empêcher un utilisateur d'accéder aux conversations ou aux informations d'un autre utilisateur en modifiant simplement un identifiant dans une requête.

## 8.2. Sécurité interservices

La communication entre NestJS et FastAPI doit être protégée afin d'empêcher les appels directs non autorisés au service IA.

Les mécanismes envisagés comprennent :

- Authentification interservices.
- Restriction de l'accès réseau au service IA.
- Utilisation de variables d'environnement pour les secrets.
- Protection des communications lorsque les services sont déployés sur des environnements distincts.

---

# 9. Synthèse

L'architecture de SmartCampus AI repose sur une séparation claire des responsabilités entre le backend métier et le service d'intelligence artificielle.

- **NestJS** expose les API métier, assure l'authentification, contrôle les autorisations et gère les conversations ainsi que les données des utilisateurs.
- **FastAPI** fournit les fonctionnalités d'intelligence artificielle, construit le contexte conversationnel et orchestre la génération des réponses.
- **PostgreSQL** conserve les données métier, les utilisateurs, les sessions, les conversations et les messages.
- **Ollama** permet l'exécution du modèle de langage utilisé pour la génération des réponses.
- **pgvector** constitue la solution prévue pour stocker les embeddings et les métadonnées nécessaires à la recherche documentaire.

Cette architecture permet d'intégrer progressivement des fonctionnalités avancées telles que le RAG, la gestion documentaire, la personnalisation des recommandations, l'enrichissement du profil candidat et l'exécution contrôlée des actions métier.

La séparation entre les responsabilités métier et les traitements IA garantit une architecture modulaire, évolutive et adaptée aux exigences de sécurité et de fiabilité d'une plateforme d'orientation universitaire.

---

**Fin du document.**