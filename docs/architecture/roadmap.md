# Roadmap de développement

## Phase 0 — Fondations (1 semaine)

Corriger l'arborescence starter, séparer `apps/web` et `apps/api`, ajouter TypeScript progressivement, configurer variables d'environnement, lint, tests et conventions de commits.

## Phase 1 — Identité et périmètre (1 semaine)

Supabase Auth, profils, organisations, rôles, middleware JWT/RBAC, RLS et audit minimal.

## Phase 2 — Référentiels (2 semaines)

Actifs, catégories, fournisseurs, chantiers, magasins et dépôts. Ajouter recherche, filtres, pagination et import CSV validé.

## Phase 3 — Stock (2 semaines)

Réceptions, sorties, transferts, inventaires, balance, valorisation et alertes de seuil. Les mouvements sont immuables.

## Phase 4 — Achats et production (2 semaines)

Demandes, validations, commandes, réceptions partielles, ordres de production et consommation de composants.

## Phase 5 — Dashboard et UX (1 semaine)

Shell responsive, navigation par rôle, graphiques Recharts, états vides, erreurs, chargement et accessibilité clavier.

## Phase 6 — Assistant IA (2 semaines)

Outils de lecture contrôlés, réponses avec provenance, historique, quotas, détection d'anomalies et prévisions de rupture. Aucun accès SQL libre au modèle.

## Phase 7 — Durcissement et lancement (2 semaines)

Tests E2E, tests RLS, DAST, scan dépendances/secrets, restauration, monitoring, budget OpenAI, déploiement Vercel/Render et runbook incident.

## Critères de sortie MVP

Un admin peut créer une organisation, un site, un magasin et un actif ; un magasinier peut enregistrer une réception et une sortie ; un manager peut consulter la valeur et les seuils ; un observateur ne peut qu'observer ; l'assistant répond avec données filtrées par organisation et chaque action sensible est auditée.
