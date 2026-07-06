# Portfolio Astro - Agent Instructions

## Role du projet

- Ce projet est le frontend Astro du portfolio, deploye sur Vercel.
- La source de verite des donnees reste ZodBack.
- Le site doit rester lisible meme si ZodBack tombe temporairement.

## Contrat d'integration ZodBack

- Host canonique machine-to-machine: `https://integrations-api.zodev.live`
- Host legacy conserve temporairement: `https://api.zodev.live`
- Mode prod attendu: `PORTFOLIO_DATA_MODE=api-required`
- Les requetes SSR authentifiees vers ZodBack doivent envoyer `Authorization: Bearer ...` mais **ne pas** envoyer `Origin`.
- Les requetes non authentifiees ou purement publiques peuvent conserver `Origin` pour les besoins CORS/diagnostic.
- Si `integrations-api.zodev.live` est disponible, c'est la cible a utiliser en premier.

## Resilience / Fallback

- Si l'API ZodBack est indisponible ou retourne un payload incomplet, le site doit lire le dernier snapshot valide dans Vercel Blob.
- Le snapshot vit dans `portfolio-snapshots/<showcaseSlug>/latest.json`.
- Le fallback attendu est `last known good`, pas une base locale SQLite.
- Ne jamais introduire de stockage local persistant sur Vercel pour ce besoin.

## Synchronisation snapshot

- ZodBack appelle `POST /api/portfolio-sync.json` sur le frontend Astro via webhook.
- Le secret de sync doit etre partage entre backend, Vercel et GitHub Actions.
- La resynchronisation doit exister sur trois fronts:
  - webhook immediat a chaque mutation publique
  - reconciliation au demarrage du backend
  - reconciliation periodique toutes les 5 minutes

## Variables importantes

- Cote Vercel: `PORTFOLIO_DATA_MODE`, `PORTFOLIO_API_BASE_URL`, `PORTFOLIO_API_TOKEN`, `PORTFOLIO_API_ORIGIN`, `PORTFOLIO_SHOWCASE_SLUG`, `PORTFOLIO_SNAPSHOT_SYNC_SECRET`, `BLOB_STORE_ID`
- `BLOB_READ_WRITE_TOKEN` n'est pas necessaire sur Vercel si le Blob Store est connecte via OIDC
- Cote backend ZodBack: `PORTFOLIO_SNAPSHOT_WEBHOOK_URL`, `PORTFOLIO_SNAPSHOT_SYNC_SECRET`, `PORTFOLIO_SNAPSHOT_SHOWCASE_SLUG`, `PORTFOLIO_SNAPSHOT_STARTUP_RECONCILE`

## Verifications a faire avant de valider un changement

- `bun test`
- `bun run build`
- `curl -I https://my.zodev.live/work`
- `curl -s https://my.zodev.live/api/portfolio-runtime.json`
- Verifier que `x-portfolio-data-source` vaut `api` en temps normal et `snapshot` pendant une panne simulee

## Regles de travail

- Utiliser `bun`, jamais `npm` ou `yarn`.
- Ne pas casser le contrat de header `Origin` sur les fetchs tokenises.
- Si tu modifies la forme des donnees portfolio, mettre a jour en meme temps:
  - `src/lib/portfolio-data-source.ts`
  - `src/lib/portfolio-snapshot.ts`
  - `src/pages/api/portfolio-sync.json.ts`
  - les tests associes

## Deploiement

- Un `git commit` puis `git push` sur `main` suffit pour declencher Vercel.
- Verifier ensuite en live la page `/work` et l'endpoint `/api/portfolio-runtime.json`.
