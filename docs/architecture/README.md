# AFRIC-ASSET AI — Architecture cible

## 1. Vue d'ensemble

AFRIC-ASSET AI est un SaaS multi-tenant de gestion des actifs et des stocks de chantiers. Le système est organisé en quatre couches :

```text
React/Vite + Tailwind + React Router + React Query
                    |
             API REST Express
       (validation, RBAC, audit, rate limit)
                    |
       Supabase Auth + PostgreSQL + Storage
                    |
         OpenAI via le backend uniquement
```

Le navigateur ne contacte jamais OpenAI et ne reçoit jamais la clé service Supabase. Les secrets restent côté serveur.

## 2. Arborescence cible

```text
afric-asset-ai/
├─ apps/
│  ├─ web/                         # React/Vite
│  │  └─ src/
│  │     ├─ app/                   # bootstrap, router, providers
│  │     ├─ components/            # composants UI réutilisables
│  │     ├─ features/              # dashboard, stocks, achats, IA...
│  │     ├─ layouts/
│  │     ├─ lib/                   # supabase browser client, query client
│  │     └─ styles/
│  └─ api/                         # Node/Express
│     └─ src/
│        ├─ config/
│        ├─ middleware/            # auth, RBAC, validation, rate limit
│        ├─ modules/               # modules métier isolés
│        ├─ integrations/          # Supabase, OpenAI
│        ├─ routes/
│        └─ server.ts
├─ packages/
│  ├─ contracts/                   # schémas Zod et types partagés
│  └─ eslint-config/
├─ supabase/
│  ├─ migrations/
│  ├─ seed.sql
│  └─ tests/database/
├─ tests/
│  ├─ api/
│  ├─ security/
│  └─ e2e/
├─ docs/architecture/
├─ docker-compose.yml              # développement local optionnel
└─ .env.example
```

## 3. Découpage fonctionnel

Chaque module possède son routeur, ses schémas d'entrée, son service métier, son dépôt Supabase et ses tests :

- `dashboard` : indicateurs, valorisation, alertes et graphiques Recharts.
- `catalog` : matériaux, consommables, outils, équipements et engins.
- `locations` : chantiers, magasins et dépôts.
- `inventory` : inventaires, niveaux, mouvements et traçabilité.
- `procurement` : fournisseurs, demandes et achats.
- `production` : ordres et consommations de production.
- `people` : collaborateurs et affectations.
- `assistant` : recherche conversationnelle, prévisions, anomalies et rapports.
- `settings` : organisation, rôles, paramètres et audit.

## 4. Flux sécurisé d'une requête

1. Supabase Auth émet un JWT.
2. Le frontend transmet uniquement le JWT dans `Authorization: Bearer`.
3. Express vérifie le JWT et charge le profil de l'organisation.
4. Le middleware RBAC contrôle l'action demandée.
5. Zod valide le payload et limite les champs acceptés.
6. Le service applique les règles métier et ouvre un contexte d'audit.
7. PostgreSQL/RLS limite les lignes à l'organisation et au périmètre utilisateur.
8. Toute erreur est normalisée sans fuite de SQL, secrets ou stack trace.

## 5. Décisions importantes

- `organization_id` est présent sur toute donnée métier et constitue la frontière multi-tenant.
- Les quantités sont `numeric(18,3)` et les montants `numeric(18,2)` pour éviter les erreurs flottantes.
- Les mouvements de stock sont append-only ; une correction crée un mouvement inverse.
- Le stock disponible est calculé depuis les mouvements, avec vues matérialisées possibles à grande échelle.
- L'IA utilise des outils backend à lecture seule et des requêtes SQL paramétrées ; elle ne reçoit pas un accès SQL brut.
- Les actions sensibles (suppression, export, changement de rôle, écriture IA) nécessitent une permission explicite et un audit.

## 6. Contrat de qualité

Avant chaque merge : lint, tests unitaires, tests d'autorisation multi-tenant, tests RLS Supabase, scan des dépendances, build frontend/backend et test E2E du parcours connexion → stock → assistant.
