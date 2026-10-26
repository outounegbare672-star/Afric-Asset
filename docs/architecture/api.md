# Contrats API REST

Base URL : `/api/v1`. Toutes les routes métier nécessitent un JWT Supabase valide.

## Réponse standard

```json
{ "data": {}, "meta": { "requestId": "uuid" } }
```

Erreur :

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Payload invalide", "fields": {} }, "meta": { "requestId": "uuid" } }
```

## Routes

| Domaine | Méthodes | Règles |
|---|---|---|
| `/me` | `GET` | Profil courant |
| `/dashboard/summary` | `GET` | KPIs filtrés par site/période |
| `/assets` | `GET`, `POST`, `PATCH` | Admin, manager, magasinier en écriture |
| `/locations` | `GET`, `POST`, `PATCH` | Admin et manager |
| `/stock/movements` | `GET`, `POST` | Toute écriture génère un audit |
| `/stock/balance` | `GET` | Solde par actif et emplacement |
| `/inventory-sessions` | `GET`, `POST`, `POST /:id/close` | Manager et magasinier |
| `/suppliers` | `GET`, `POST`, `PATCH` | Admin et manager |
| `/purchases` | `GET`, `POST`, `PATCH /:id/status` | Admin et manager |
| `/productions` | `GET`, `POST`, `POST /:id/consume` | Manager et magasinier |
| `/sites` | `GET`, `POST`, `PATCH` | Admin et manager |
| `/assistant/conversations` | `POST`, `GET` | Accès lecture selon périmètre |
| `/assistant/query` | `POST` | Rate limit strict, lecture seule par défaut |
| `/reports/stock` | `POST` | Manager et admin, export audité |
| `/audit-logs` | `GET` | Admin uniquement |

## Exemple de requête métier

`POST /api/v1/stock/movements`

```json
{
  "assetId": "uuid",
  "locationId": "uuid",
  "type": "receipt",
  "quantity": "250.000",
  "unitCost": "4.50",
  "reference": "BL-2026-001"
}
```

Le serveur refuse les organisations forcées par le client, les quantités négatives, les actifs inactifs et toute référence vers une autre organisation.

## Assistant IA

`POST /api/v1/assistant/query`

```json
{ "message": "Quels produits seront en rupture cette semaine ?", "siteId": "uuid" }
```

Le backend sélectionne un outil autorisé (`get_stock_balance`, `get_low_stock_forecast`, `get_unused_assets`, etc.), exécute une requête paramétrée limitée à l'organisation, puis demande à OpenAI de formuler la réponse avec les sources et la date des données. Aucune génération SQL libre n'est exécutée.
