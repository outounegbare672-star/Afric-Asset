# Sécurité et DevSecOps

## Contrôles applicatifs

- JWT Supabase vérifié côté API avec audience et issuer attendus.
- RBAC serveur : les contrôles frontend ne sont jamais considérés comme une sécurité.
- RLS activé sur chaque table métier avec `organization_id`.
- Validation Zod/JSON Schema et taille maximale des payloads.
- Requêtes Supabase/PostgreSQL paramétrées ; aucun SQL concaténé.
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, HSTS en production et cookies sécurisés.
- CSRF double-submit si une authentification par cookie est ajoutée ; avec bearer header pur, CORS strict reste obligatoire.
- Rate limiting séparé pour login, API métier, exports et assistant IA.
- Audit append-only des écritures, changements de rôle, exports et requêtes IA.
- Clés OpenAI et Supabase service role uniquement dans Render/Vercel server environment.

## Tests de sécurité obligatoires

1. Un utilisateur ne lit ni ne modifie les lignes d'une autre organisation.
2. Un observateur ne peut créer aucun mouvement ni achat.
3. Un conducteur ne peut modifier que les affectations qui lui sont autorisées.
4. Les UUID et filtres invalides retournent `400`, jamais une stack trace.
5. Les payloads contenant HTML/script sont neutralisés ou refusés.
6. Les endpoints assistant et export respectent le rate limit.
7. Les secrets n'apparaissent ni dans les logs ni dans les réponses.
8. Les suppressions directes de mouvements sont refusées.
9. Les tests de dépendances et de conteneur bloquent les CVE critiques.

## CI/CD

Pipeline GitHub Actions recommandé : `npm ci` → lint → tests unitaires → tests RLS Supabase → build → audit npm → scan secret → déploiement preview Vercel → déploiement API Render après approbation. Les migrations sont versionnées et appliquées avant le déploiement API.

## Sauvegardes et observabilité

Activer les sauvegardes et la rétention Supabase selon le plan choisi, tester une restauration mensuelle, centraliser les logs Render, ajouter un `requestId`, et surveiller latence API, erreurs 5xx, refus RLS, coût OpenAI et temps de réponse assistant.
