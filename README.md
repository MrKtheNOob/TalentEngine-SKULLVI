# Talent Engine

Une petite application réalisée pour le projet de recrutement SKULLVI : importer les candidatures à des programmes, extraire les informations des formulaires et des CV, évaluer les profils selon des critères configurables et aider un évaluateur à identifier les candidats à examiner en priorité.

Backend : Python, FastAPI, PostgreSQL et SQLAlchemy. Frontend : React, TypeScript et Vite. Le traitement par LLM et la reconnaissance de texte des PDF scannés (OCR) utilisent OpenRouter.

## Démonstration

Le frontend est déployé sur Vercel et l’API sur Render ; le déploiement fonctionne selon la vérification du porteur du projet.

- Frontend : **URL Vercel à renseigner avant la remise**.
- API : https://talentengine-skullvi.onrender.com
- Les identifiants du compte de démonstration sont transmis séparément aux évaluateurs.

## Installation

Prérequis : Python 3.13+, [uv](https://docs.astral.sh/uv/), Node.js 22.12+ (ou 20.19+), npm et un serveur PostgreSQL démarré. L’import et l’évaluation nécessitent également une clé API OpenRouter, un identifiant de modèle et suffisamment de crédits.

### 1. Base de données et backend

Créez une base vide avec votre compte PostgreSQL, ou utilisez une base existante :

```sh
createdb -h localhost -U postgres talent_engine
```

Depuis la racine du dépôt :

```sh
cd backend
uv sync
cp .env.example .env
```

Renseignez vos paramètres dans `backend/.env` :

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/talent_engine
OPENROUTER_API_KEY=votre-cle-api
OPENROUTER_MODEL=identifiant-du-modele-openrouter
CORS_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
```

Choisissez un modèle capable de suivre les consignes de normalisation et d’évaluation au format JSON. L’OCR utilise le même compte ; aucune clé API supplémentaire n’est nécessaire. Ne commitez pas le fichier `.env`.

Définissez également `JWT_SECRET` dans l’environnement du processus avant de lancer l’API. Le code actuel lit cette variable à l’import du module, avant le chargement du `.env` par la configuration ; l’exporter explicitement évite d’utiliser la valeur de secours :

```sh
export JWT_SECRET="$(openssl rand -hex 32)"
```

Conservez la même valeur entre les redémarrages si vous souhaitez préserver les sessions. Ne partagez pas ce secret.

Appliquez les migrations et démarrez l’API depuis `backend/` :

```sh
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

L’API est accessible à `http://localhost:8000`. Sa documentation interactive à `http://localhost:8000/docs` est protégée : connectez-vous d’abord via le frontend en utilisant le même hôte `localhost`. Le démarrage échoue si PostgreSQL est indisponible. Sans configuration du LLM, la gestion des programmes reste accessible, mais les demandes d’import et d’évaluation retournent une erreur 503.

### 2. Frontend

Dans un second terminal, depuis la racine du dépôt :

```sh
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Dans `frontend/.env`, définissez `VITE_API_URL=http://localhost:8000/api`. Ouvrez `http://localhost:5173` : `/` redirige vers `/app`, puis vers `/login` si aucune session n’est disponible. Axios envoie automatiquement le cookie. Redémarrez Vite après une modification du `.env`. Utilisez `localhost` pour les deux services, sans le mélanger avec `127.0.0.1`.

### 3. Tester le parcours

1. Connectez-vous avec le compte de démonstration.
2. Créez un programme depuis la page Programs.
3. Enregistrez ses critères d’évaluation dans l’onglet Configuration.
4. Ouvrez Imports, sélectionnez le programme et envoyez un export CSV ou JSON. Activez l’évaluation automatique ou lancez-la ensuite depuis Configuration.
5. Suivez la progression des tâches, puis consultez le classement, les informations extraites, les points à vérifier et les explications des scores.

L’import accepte un CSV UTF-8 séparé par des virgules avec des en-têtes, ou un tableau JSON d’objets. Chaque ligne ou objet représente une candidature. Incluez les réponses du formulaire et des liens HTTPS vers les CV accessibles sans authentification. Limites : 10 Mio et 1 000 candidatures par import ; 10 Mio et 30 pages par PDF.

Les fichiers d’exemple, leurs sources et leurs limites sont décrits dans [docs/examples/kaggle-applications](docs/examples/kaggle-applications/README.md). Ces PDF permettent de tester le recours à l’OCR. `backend-config.json` est une configuration de référence, pas un fichier de candidatures à importer : reproduisez ses critères dans Configuration. `docs/examples/import.json` est un exemple plus simple, sans CV.

Sur une base locale vide, exécutez `uv run python seed.py` depuis `backend/` après les migrations pour créer le compte de démonstration, quatre programmes et sept candidatures non traitées. Le compte utilise les identifiants de démonstration définis dans `backend/seed.py` ; le mot de passe est stocké sous forme de hash bcrypt. Les comptes et données existants ne sont pas remplacés. Le seeder ne génère actuellement pas de mot de passe aléatoire ; sa sortie console peut afficher un e-mail de candidature à la place de l’e-mail du compte. Référez-vous au compte défini dans le script. Ces données de démonstration ne remplacent pas un import réel et ne doivent pas servir de compte de production.

## Authentification et déploiement

La connexion crée un JWT de 30 minutes dans un cookie HttpOnly. `/api/auth/me` retourne l’utilisateur connecté ; `/api/auth/logout` supprime le cookie. Le middleware exige une session valide pour les autres routes, y compris Swagger ; seuls la connexion, la déconnexion et les requêtes CORS `OPTIONS` sont publics. Le frontend restaure la session à son chargement et protège les routes `/app`. Un échec de vérification redirige aussi vers `/login` ; cette redirection ne résout pas une indisponibilité de l’API ou un problème de CORS.

### Render — backend

- Racine du service : `backend` ; runtime Python.
- Build : `uv sync --locked`.
- Démarrage : `uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port $PORT`.
- Variables : `DATABASE_URL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `JWT_SECRET`, `PYTHON_VERSION=3.13.5`, `UV_PYTHON_DOWNLOADS=automatic`, `COOKIE_SECURE=true` et `CORS_ORIGINS=https://VOTRE-FRONTEND.vercel.app`.

`CORS_ORIGINS` accepte plusieurs origines séparées par des virgules, sans crochets, chemins ni slash final. La valeur doit correspondre exactement à l’origine utilisée dans le navigateur ; une URL de prévisualisation Vercel est une autre origine. Ne lancez pas automatiquement le seeder à chaque démarrage.

### Vercel — frontend

- Racine du projet : `frontend` ; framework Vite.
- Build : `npm run build` ; répertoire de sortie : `dist`.
- Variable de production : `VITE_API_URL=https://talentengine-skullvi.onrender.com/api`.
- `frontend/vercel.json` sert `index.html` pour permettre le rechargement des routes React.

Les variables `VITE_*` sont publiques et intégrées au build : redéployez après modification. Une URL `localhost` en production pointe vers la machine du visiteur. `COOKIE_SECURE=true` active `SameSite=None; Secure` pour les requêtes HTTPS entre Vercel et Render ; certains navigateurs peuvent néanmoins bloquer ces cookies tiers.

Avant la remise, vérifier connexion, rechargement d’une page `/app`, petit import, progression, score et déconnexion sur les URL déployées. Une requête API sans cookie doit retourner 401. La reprise d’un traitement après mise en veille/redémarrage de Render reste à vérifier sur l’hébergement.

## Fonctionnement

```mermaid
flowchart TD
    A[Envoyer un CSV ou JSON pour un programme] --> B[Valider le fichier et enregistrer la tâche d’import]
    B --> C[Le worker traite chaque ligne]
    C --> D[Le LLM extrait les réponses et le lien du CV]
    D --> E{Lien de CV présent ?}
    E -->|Non| I[Valider et enregistrer la candidature]
    E -->|Oui| F[Télécharger et valider le PDF]
    F --> G{Texte extractible ?}
    G -->|Oui| H[Le LLM intègre le texte du CV]
    G -->|Non| O[Recours à l’OCR via OpenRouter]
    O --> H
    F -->|Échec de lecture| W[Conserver les réponses et ajouter un point à vérifier]
    O -->|Échec de l’OCR| W
    W --> I
    H --> I
    I --> J[Mettre l’évaluation en file automatiquement ou sur demande]
    J --> K[Le LLM attribue et explique un score par critère]
    K --> L[Valider les scores et les valeurs]
    L --> M[Le backend calcule le total pondéré]
    M --> N[Classer les candidatures et effectuer une revue humaine]
```

Chaque ligne traitée avec succès est enregistrée immédiatement. Les erreurs sont conservées sans bloquer les autres candidatures. L’évaluation est une tâche distincte pour chaque candidature. Le backend calcule `somme(score × poids) / somme(poids)`, avec des poids de 3/2/1 pour les priorités haute/moyenne/basse. Aucun score ne provoque de rejet automatique.

## Vérifications

Depuis `backend/` : `uv run pytest` (ou `uv run pytest -v` pour le détail).

Depuis `frontend/` : `npm run build`, `npm run lint` et `node --test tests/*.test.cjs`.

Les tests automatisés simulent les appels aux fournisseurs et ne génèrent aucun coût de LLM ou d’OCR. Le parcours réel d’import, d’OCR et d’évaluation a également été vérifié en local par le porteur du projet.

## Limites du MVP

- L’OCR, l’extraction et l’évaluation par LLM peuvent être inexacts, notamment avec des CV flous. Les points à vérifier concernent les données incertaines ou manquantes, pas les scores faibles ; la sélection finale reste humaine.
- Le traitement entraîne des coûts de LLM et d’OCR. Un appel interrompu peut être répété après un redémarrage. Les tâches échouées n’ont pas de mécanisme de relance automatique.
- Le worker s’exécute avec l’API et traite les tâches une par une. La mise en veille de l’hébergement interrompt le traitement ; les tâches enregistrées reprennent au réveil de l’API.
- Les fichiers importés et les CV originaux ne sont pas archivés. L’accès au CV dépend de son hébergeur ; la suppression d’une candidature conserve l’historique d’import et sa ligne brute.
- Une seule configuration s’applique par programme. Sa modification ne remplace pas automatiquement les anciens scores : une nouvelle évaluation doit être demandée explicitement. Il n’existe pas d’interface de gestion des versions de configuration.
- L’authentification ne comprend ni rôles, ni inscription publique, ni récupération de mot de passe, ni révocation immédiate des JWT. La déconnexion efface le cookie mais un token copié reste valide jusqu’à expiration. Il n’existe pas de protection CSRF dédiée ; CORS ne la remplace pas.
- Le code conserve un secret JWT de secours et un compte de seed à mot de passe fixe. Définir un `JWT_SECRET` privé et utiliser un compte distinct est nécessaire pour un environnement réel ; ces limites de sécurité ne sont pas résolues par le déploiement.
- Il n’existe pas de parcours complet de correction manuelle des données extraites incertaines.

Consultez la [documentation du backend](backend/README.md), la [documentation du frontend](frontend/README.md) et le [journal des décisions](docs/DECISIONS.md) pour les choix d’implémentation et le comportement de l’API.
