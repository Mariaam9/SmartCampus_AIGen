# Livraison SmartCampus AI – API NestJS (catalogue et frais de scolarité)

Cette livraison contient les développements et corrections ciblés réalisés dans le backend NestJS de SmartCampus AI.

Le projet d'origine est conservé : les dossiers `frontend`, `ai-service`, la configuration Docker et le schéma Prisma existant n'ont pas été remplacés par un nouveau projet.

## 1. Fonctionnalités développées

### Gestion du catalogue pédagogique

Développement des API permettant de gérer :

- Les formations
- Les spécialités
- Les programmes pédagogiques
- Les matières
- Les conditions d'admission
- Les prérequis

Les opérations disponibles comprennent la création, la consultation, la modification et la suppression, ainsi que la recherche et le filtrage des données.

La gestion des associations entre programmes et matières est également prévue.

### Gestion des frais de scolarité et de la publication

Développement des API relatives aux tarifs et aux modalités de paiement.

Les données concernées disposent notamment :
- D'un statut de publication.
- D'une date de début de validité.
- D'une date de fin de validité.

Les routes publiques appliquent des filtres afin de ne présenter que les informations publiées et valides. Les informations du catalogue sont également accessibles à l'agent IA via :

`GET /api/agent/catalogue`

### Validation et gestion des erreurs

La validation des entrées est configurée avec `class-validator`, `class-transformer` et le `ValidationPipe` global de NestJS.

Les validations comprennent notamment les champs obligatoires, les types de données, les statuts autorisés et la cohérence des périodes de validité.

Les erreurs liées aux contraintes Prisma sont également prises en compte.

## 2. Avant de commencer

1. Décompresser l'archive dans un nouveau dossier de travail ou dans le dossier de votre choix.
2. Ouvrir le dossier `backend` dans PowerShell.
3. Vérifier le fichier `.env` du backend : `DATABASE_URL` doit pointer vers votre PostgreSQL existant.
4. Conserver les valeurs locales déjà correctes.
5. Ne pas supprimer les volumes Docker et ne pas exécuter `prisma migrate reset`.

## 3. Installation et vérification du backend

Exécuter les commandes une par une depuis le dossier `backend` :

```powershell
npm ci
npx prisma validate
npx prisma generate
npm test -- --runInBand src/catalogue/catalogue.service.spec.ts
npm run build
```

Si une commande échoue, arrêter la procédure et examiner l'erreur avant de poursuivre.

**Résultats des tests déjà obtenus pendant le développement :**

- Tests unitaires du `CatalogueService` : 19/19 réussis.
- Tests automatisés des API : 102/102 réussis.
- Les scénarios automatisés comprennent les opérations CRUD, les validations, les associations et les suppressions des données temporaires de test.

Le build doit encore être exécuté et vérifié dans l'environnement de livraison.

## 4. Démarrage de l'application

S'assurer que PostgreSQL est démarré et que le fichier `.env` est correctement configuré.

Depuis le dossier `backend` :

```powershell
npm run start:dev
```

L'API est disponible par défaut à l'adresse :

`http://localhost:3000/api`

Dans une deuxième fenêtre PowerShell, tester les routes publiques :

```powershell
Invoke-RestMethod http://localhost:3000/api/formations
Invoke-RestMethod http://localhost:3000/api/agent/catalogue
```

## 5. Documentation et preuves de test

Les éléments de vérification sont disponibles dans le backend :

- `API_CATALOGUE_TESTS.md` : documentation des routes et des scénarios de test.
- `test-complet-api.ps1` : script de test automatisé.
- `rapports-tests-api/` : rapports de tests au format TXT et CSV.
- `test_api/` : captures d'écran des tests réalisés avec Postman.

## 6. Périmètre et sécurité

Les fonctionnalités de gestion, de publication, de validité et de validation technique des entrées sont développées.

**Limite de sécurité importante :**

Les routes `/api/gestion/...` ne disposent pas encore d'une protection par rôle utilisateur dans cette version. Aucune authentification serveur exploitable n'étant disponible dans le projet fourni, les mécanismes JWT/Guards n'ont pas été ajoutés.

Ces routes sont donc destinées aux essais locaux et ne doivent pas être exposées à des utilisateurs ou à Internet sans mise en place préalable de l'authentification et des autorisations appropriées.

Aucune réinitialisation de la base de données ni suppression des volumes Docker n'est nécessaire pour utiliser cette livraison.