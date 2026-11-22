# Vérification des API du catalogue – tâches 1 à 3

## Ce qui est couvert par le code

- CRUD des formations, spécialités, programmes, matières, conditions d'admission,
  prérequis et tarifs.
- Association et désassociation des matières à un programme.
- Routes publiques limitées aux formations publiées et aux données associées à une
  formation publiée.
- Tarifs et conditions d'admission publics limités au statut `PUBLIE` et à leur
  période de validité (`dateDebutValidite` / `dateFinValidite`).
- Routes de gestion permettant de consulter aussi les brouillons et archives.
- Validation des DTO HTTP par `ValidationPipe` : transformation des nombres,
  suppression interdite des propriétés inconnues et rejet des propriétés non déclarées.
- Contrôles des champs obligatoires, du montant et de la cohérence des dates.
- Traduction des erreurs Prisma d'unicité et de relation en erreurs HTTP.
- Tests unitaires du service avec Prisma simulé, y compris la régression de
  sélection des dates lors de la modification.

## Installation et tests (Windows PowerShell)

Ouvrir PowerShell dans le dossier `backend` du projet, puis exécuter :

```powershell
npm ci
```

Si l'installation se termine sans erreur :

```powershell
npm test -- --runInBand src/catalogue/catalogue.service.spec.ts
npm run build
```

Pour exécuter les tests e2e déjà configurés dans le projet :

```powershell
npm run test:e2e -- --runInBand
```

Les tests e2e ne remplacent pas des tests d'intégration réels des nouvelles routes.
Si cette commande échoue à cause de la configuration ou de la base, conserver le
message d'erreur complet pour diagnostic.

## Vérifier la base et démarrer l'API

Depuis `backend` :

```powershell
npx prisma validate
npx prisma generate
```

Vérifier que PostgreSQL est démarré et que `DATABASE_URL` dans le fichier `.env`
du backend pointe vers la base utilisée par ce projet. Ne pas réinitialiser la base.
Ne pas exécuter `prisma migrate reset`.

Ensuite :

```powershell
npm run start:dev
```

L'API écoute sur le port défini par `PORT`, sinon sur `3000`.

## Routes principales

| Méthode | Route | Usage |
|---|---|---|
| GET | `/api/formations` | Catalogue public publié |
| GET | `/api/formations/:id` | Détail public publié |
| GET | `/api/specialites` | Spécialités liées aux formations publiées |
| GET | `/api/programmes` | Programmes liés aux formations publiées |
| GET | `/api/matieres` | Matières associées aux programmes publiés |
| GET | `/api/conditions-admission` | Conditions publiées et valides |
| GET | `/api/tarifs` | Tarifs publiés et valides |
| GET | `/api/agent/catalogue` | Données officielles publiées et valides pour l'agent |
| GET | `/api/gestion/:resource` | Liste de gestion, brouillons inclus |
| GET | `/api/gestion/:resource/:id` | Détail de gestion |
| POST | `/api/gestion/:resource` | Création |
| PATCH | `/api/gestion/:resource/:id` | Modification |
| DELETE | `/api/gestion/:resource/:id` | Suppression |
| GET | `/api/programmes/:id/matieres` | Matières d'un programme publié |
| POST | `/api/gestion/programmes/:id/matieres` | Associer une matière |
| DELETE | `/api/gestion/programmes/:id/matieres/:matiereId` | Retirer l'association |

`resource` accepte : `formations`, `specialites`, `programmes`, `matieres`,
`conditions-admission`, `prerequis`, `tarifs`.

Exemples de vérification avec PowerShell (API démarrée) :

```powershell
Invoke-RestMethod http://localhost:3000/api/formations
Invoke-RestMethod http://localhost:3000/api/agent/catalogue
Invoke-RestMethod "http://localhost:3000/api/formations?page=1&limit=10"
```

Les routes `/api/gestion/...` sont des routes de gestion non sécurisées dans l'état
actuel du projet : ne pas les exposer sur Internet et ne pas les considérer comme
réservées à un responsable tant qu'une authentification et des Guards d'autorisation
n'ont pas été ajoutés.

## Résultats de vérification dans l'environnement de préparation

| Vérification | Résultat | Détail |
|---|---|---|
| Intégrité de l'archive complète | PASS | L'archive a été testée après mise à jour. |
| Compilation NestJS | PASS | `node node_modules/@nestjs/cli/bin/nest.js build` termine sans erreur. |
| Commande `npm run build` sous Linux | BLOCKED | Le shim `node_modules/.bin/nest` fourni dans l'archive n'a pas le droit d'exécution dans cet environnement Linux. La commande directe du CLI fonctionne. |
| Tests Jest ciblés | BLOCKED | Jest reste bloqué en tentant de télécharger `@unrs/resolver-binding-linux-x64-gnu`; les tests n'ont donc pas été exécutés jusqu'au bout. |
| Tests réels sur PostgreSQL | NON EXÉCUTÉS | Ils doivent être lancés dans l'environnement local avec la base du projet. |
| Autorisations par rôle | NON VALIDABLE | Aucun mécanisme d'authentification opérationnel n'existe dans le backend fourni. |

## Limites d'autorisation – importante

Le schéma Prisma fourni contient les rôles `CANDIDAT`, `RESPONSABLE`, `ADMIN` et la
relation entre responsable et établissement, mais le backend fourni ne contient pas
de mécanisme d'authentification opérationnel ni de Guards qui vérifient ces rôles.
Il est donc impossible de confirmer une permission réelle ou l'isolation d'un
responsable par établissement dans cette livraison. Aucun JWT ni fausse identité
n'a été ajouté, conformément au périmètre demandé.

Les tests Jest et les tests contre PostgreSQL doivent être exécutés dans
l'environnement Windows du projet après `npm ci`. Aucun test non exécuté n'est
présenté comme PASS.
