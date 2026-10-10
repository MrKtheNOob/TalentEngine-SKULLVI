# Feuille de route : authentification

Objectif : protéger les candidatures et les opérations payantes avant le déploiement public. Tu implémentes cette partie ; ce document sert de guide, sans imposer les détails de ton code.

## Direction proposée

- Un compte administrateur, sans inscription publique ni gestion des rôles.
- Sessions expirables, cookie `HttpOnly` et authentification vérifiée côté backend.
- Frontend sur Vercel, API sur Render. Une réécriture Vercel transmet `/api/*` à Render : le navigateur utilise uniquement l’origine du frontend.
- Protection CSRF pour les opérations qui modifient des données, y compris les imports et les évaluations.

Ce sont les recommandations discutées, pas des décisions déjà implémentées. Les routes, le stockage des sessions et leur durée restent à choisir.

## 1. Fixer le petit contrat d’authentification

- [ ] Définir l’identifiant administrateur et le stockage d’un hash du mot de passe côté backend. Aucun secret dans une variable `VITE_*`.
- [ ] Choisir le stockage des sessions : une table PostgreSQL avec un jeton aléatoire opaque est une option simple, persistante et révocable. Stocker son hash plutôt que le jeton utilisable.
- [ ] Définir la durée de session et le comportement à expiration. Éviter les refresh tokens pour ce MVP si une reconnexion suffit.
- [ ] Définir trois endpoints : connexion, session courante et déconnexion. Exemple possible : `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`.
- [ ] Choisir la protection CSRF : jeton lié à la session, avec contrôle de l’origine pour les requêtes modificatrices. Prévoir aussi la connexion, avant qu’une session existe.

Décider notamment : quelle réponse renvoie `/me`, comment le frontend obtient le jeton CSRF et quels endpoints restent publics. Une session manquante ou expirée doit retourner 401 ; une requête CSRF invalide doit retourner 403.

## 2. Construire le backend d’abord

- [ ] Ajouter un petit module `backend/auth/` avec schemas, routes et logique de session. Une migration Alembic suffit si tu ajoutes une table.
- [ ] Vérifier le mot de passe avec un algorithme de hachage adapté, sans stocker ni journaliser le mot de passe brut.
- [ ] À la connexion, générer une nouvelle session et définir un cookie de session limité au domaine courant : pas de `Domain` pointant vers Render.
- [ ] En production : `HttpOnly`, `Secure`, `SameSite=Lax`, et un `Path` cohérent avec les endpoints, par exemple `/api`. En local HTTP, prévoir explicitement `Secure=false`.
- [ ] Créer une dépendance de vérification de session, sur le modèle des dépendances dans `backend/shared/dependencies.py`.
- [ ] Protéger les routeurs programmes et jobs, y compris leurs GET : données personnelles, configuration, suppression, import et lancement d’évaluations. La protection ne doit pas dépendre du frontend ni du proxy.
- [ ] Vérifier CSRF sur POST/PUT/PATCH/DELETE ; garder OPTIONS accessible si tu conserves des appels cross-origin.
- [ ] À la déconnexion, révoquer la session en base et effacer le cookie avec le même nom, domaine et chemin.
- [ ] Retourner une erreur de connexion générique et limiter les tentatives répétées. Choisir une solution proportionnée au déploiement ; ne pas ajouter une infrastructure de queue pour cela.
- [ ] Envoyer `Cache-Control: no-store` pour les réponses d’authentification et les données privées.

Commentaires utiles dans le code : pourquoi la session est renouvelée à la connexion, comment elle expire, pourquoi le cookie n’a pas de domaine Render et où la vérification CSRF s’applique.

## 3. Brancher le frontend

- [ ] Ajouter `authService.ts` dans `frontend/src/services/`, avec Axios et le même `Result<T>` que les autres services.
- [ ] Mettre les appels et l’état de session dans un petit hook. Si plusieurs composants ont besoin de cet état, un unique contexte d’auth explicite peut se justifier ; pas de nouveau gestionnaire d’état.
- [ ] Ajouter une page de connexion en français : chargement, erreur de connexion et erreur réseau.
- [ ] Ajouter une garde autour des routes `/app` dans `frontend/src/App.tsx`. Vérifier `/me` avant d’afficher les écrans privés pour éviter les requêtes de données avant authentification.
- [ ] Rediriger vers la connexion après un 401 et arrêter les boucles de polling actives. Un 403 CSRF ou une panne réseau ne doit pas être interprété comme une déconnexion.
- [ ] Ajouter la déconnexion dans l’interface. Ne pas afficher la session comme fermée si la révocation a échoué silencieusement.
- [ ] Transmettre le jeton CSRF dans un en-tête pour chaque requête modificatrice, y compris les fichiers multipart et le bouton de réévaluation.
- [ ] Ne pas stocker de jeton de session dans `localStorage` ou `sessionStorage`.

Le client actuel utilise `/api`. Avec le proxy, les cookies sont envoyés sur les requêtes de même origine ; il n’est pas nécessaire de changer la baseURL pour appeler Render directement.

## 4. Relier Vercel et Render

- [ ] Dans la configuration Vercel du projet frontend, ajouter la réécriture `/api/:path*` vers `https://TON-BACKEND.onrender.com/api/:path*`.
- [ ] Placer cette règle avant la règle de fallback React vers `index.html`, pour ne pas renvoyer du HTML aux appels API.
- [ ] Garder la baseURL frontend à `/api` ; ne pas définir `VITE_API_URL` sur le domaine Render dans ce montage.
- [ ] Définir les secrets backend et les origines autorisées sur Render. Configurer les URLs de preview explicitement si elles doivent pouvoir se connecter.
- [ ] Vérifier que le cookie émis à travers le proxy est bien associé au domaine Vercel et transmis aux appels suivants.
- [ ] Pour CSRF, valider l’en-tête `Origin` contre l’origine frontend autorisée, pas contre le domaine Render. Définir le comportement pour les clients sans `Origin` au lieu d’un contournement implicite.
- [ ] Ne pas activer la mise en cache des réécritures pour les réponses privées.
- [ ] Conserver le contrôle d’auth sur Render : connaître l’URL directe ne doit donner aucun accès supplémentaire.

Le proxy évite les cookies tiers entre Vercel et Render. Si tu choisis finalement des appels directs entre les deux domaines, il faut revoir ensemble cookies, CORS, credentials et CSRF ; un simple ajout de `withCredentials` ne suffit pas.

## 5. Vérifier avant de terminer

- [ ] Identifiants valides → session créée ; invalides → aucune session.
- [ ] Cookie absent, invalide ou expiré → 401 sur les endpoints privés, sans modification ni appel LLM/OCR.
- [ ] Session valide → consultation, modification, import, scoring et suppression fonctionnent.
- [ ] Jeton CSRF absent/invalide ou origine non autorisée → refus des requêtes modificatrices.
- [ ] Déconnexion → session révoquée ; rejouer l’ancien cookie ne fonctionne plus.
- [ ] Rechargement du navigateur → session conservée jusqu’à expiration ; déconnexion/expiration → polling arrêté.
- [ ] Erreurs de réseau et indisponibilité de Render → message compréhensible, sans prétendre que les identifiants sont incorrects.
- [ ] Test réel via Vercel → Render, avec cookies tiers désactivés ; accès direct à Render sans session refusé.
- [ ] Tests backend existants, tests frontend, build et lint restent valides. Adapter les fixtures HTTP pour fournir une session ou remplacer la dépendance d’auth uniquement dans les tests concernés.

## 6. Documenter le résultat

- [ ] Ajouter au README la configuration du compte administrateur et les variables nécessaires, sans publier de vrais identifiants.
- [ ] Expliquer comment le reviewer reçoit ses identifiants et peut lancer le projet localement.
- [ ] Mettre à jour la limite « pas d’authentification » et enregistrer les choix effectivement retenus dans `docs/DECISIONS.md`.

À laisser hors scope : inscription, récupération de mot de passe, rôles, comptes candidats, OAuth et interface d’administration des utilisateurs.

## Références

- [Réécritures Vercel](https://vercel.com/docs/routing/rewrites).
- [Cookies tiers et blocages navigateur — MDN](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies).
- [Gestion des sessions — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
- [Protection CSRF — OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
