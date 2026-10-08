# Talent Engine

Une petite application réalisée pour le projet de recrutement SKULLVI : importer les candidatures à des programmes, extraire les informations des formulaires et des CV, évaluer les profils selon des critères configurables et aider un évaluateur à identifier les candidats à examiner en priorité.

Backend : Python, FastAPI, PostgreSQL et SQLAlchemy. Frontend : React, TypeScript et Vite. Le traitement par LLM et la reconnaissance de texte des PDF scannés (OCR) utilisent OpenRouter.

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
```

Choisissez un modèle capable de suivre les consignes de normalisation et d’évaluation au format JSON. L’OCR utilise le même compte ; aucune clé API supplémentaire n’est nécessaire. Ne commitez pas le fichier `.env`.

Appliquez les migrations et démarrez l’API depuis `backend/` :

```sh
uv run alembic upgrade head
uv run uvicorn main:app --reload
```

L’API est accessible à `http://127.0.0.1:8000` et sa documentation interactive à `http://127.0.0.1:8000/docs`. Le démarrage échoue si PostgreSQL est indisponible. Sans configuration du LLM, la gestion des programmes reste accessible, mais les demandes d’import et d’évaluation retournent une erreur 503.

### 2. Frontend

Dans un second terminal, depuis la racine du dépôt :

```sh
cd frontend
npm ci
npm run dev
```

Ouvrez `http://localhost:5173/app`. Vite transmet les requêtes `/api` au backend : aucune variable d’environnement supplémentaire n’est nécessaire pour configurer l’adresse de l’API en local.

### 3. Tester le parcours

1. Créez un programme depuis la page Programs.
2. Enregistrez ses critères d’évaluation dans l’onglet Configuration.
3. Ouvrez Imports, sélectionnez le programme et envoyez un export CSV ou JSON. Activez l’évaluation automatique ou lancez-la ensuite depuis Configuration.
4. Suivez la progression des tâches, puis consultez le classement, les informations extraites, les points à vérifier et les explications des scores.

L’import accepte un CSV UTF-8 séparé par des virgules avec des en-têtes, ou un tableau JSON d’objets. Chaque ligne ou objet représente une candidature. Incluez les réponses du formulaire et des liens HTTPS vers les CV accessibles sans authentification. Limites : 10 Mio et 1 000 candidatures par import ; 10 Mio et 30 pages par PDF.

Les fichiers d’exemple, leurs sources et leurs limites sont décrits dans [docs/examples/kaggle-applications](docs/examples/kaggle-applications/README.md). Ces PDF permettent de tester le recours à l’OCR. `backend-config.json` est une configuration de référence, pas un fichier de candidatures à importer : reproduisez ses critères dans Configuration. `docs/examples/import.json` est un exemple plus simple, sans CV.

Facultatif : la commande `uv run python seed.py`, exécutée depuis `backend/`, crée quatre programmes de démonstration et sept candidatures non traitées. Elle n’est pas nécessaire pour tester un import complet sur une base vide.

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

Depuis `backend/` : `uv run python -m unittest discover -s tests -v`.

Depuis `frontend/` : `npm run build`, `npm run lint` et `node --test tests/*.test.cjs`.

Les tests automatisés simulent les appels aux fournisseurs et ne génèrent aucun coût de LLM ou d’OCR. Le parcours réel d’import, d’OCR et d’évaluation a également été vérifié en local par le porteur du projet.

## Limites du MVP

- L’OCR, l’extraction et l’évaluation par LLM peuvent être inexacts, notamment avec des CV flous. Les points à vérifier concernent les données incertaines ou manquantes, pas les scores faibles ; la sélection finale reste humaine.
- Le traitement entraîne des coûts de LLM et d’OCR. Un appel interrompu peut être répété après un redémarrage. Les tâches échouées n’ont pas de mécanisme de relance automatique.
- Le worker s’exécute avec l’API et traite les tâches une par une. La mise en veille de l’hébergement interrompt le traitement ; les tâches enregistrées reprennent au réveil de l’API.
- Les fichiers importés et les CV originaux ne sont pas archivés. L’accès au CV dépend de son hébergeur ; la suppression d’une candidature conserve l’historique d’import et sa ligne brute.
- Une seule configuration s’applique par programme. Sa modification ne remplace pas automatiquement les anciens scores : une nouvelle évaluation doit être demandée explicitement. Il n’existe pas d’interface de gestion des versions de configuration.
- Aucun système d’authentification ou de permissions des évaluateurs n’est implémenté. Un déploiement en production nécessite des contrôles d’accès adaptés et une configuration du routage de l’API et du CORS.

Consultez la [documentation du backend](backend/README.md), la [documentation du frontend](frontend/README.md) et le [journal des décisions](docs/DECISIONS.md) pour les choix d’implémentation et le comportement de l’API.
