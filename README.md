<p align="center">
  <img src="public/budgethor-logo.jpg" width="96" alt="Budgethor" />
</p>

<h1 align="center">Budgethor</h1>

<p align="center">
  App locale pour suivre <strong>paies</strong>, <strong>paiements</strong> et <strong>dettes</strong> — sans tracking.
</p>

Budgethor répond à une question simple : *combien me reste-t-il une fois les paies et les paiements prévus pris en compte ?*

Le tableau de bord sépare l’argent **déjà disponible** du solde **prévu en fin de mois**, et lit le mois (Bonne, À surveiller, Serrée) plutôt que de seulement additionner. Les dettes peuvent être liées à un compte : les charges l’augmentent, un virement la diminue.

Les montants sont stockés en **cents**, affichés en dollars canadiens. Tout reste sur la machine, dans une base SQLite.

## Fonctionnalités

- **Situation du mois** — disponible maintenant, reste prévu, revenus et paiements, plus une lecture de santé financière (seuil à 100 $ ou solde négatif, avec la date).
- **À traiter** — retards, échéances du jour et des 7 prochains jours, liste condensée.
- **Comptes** — argent (banque) ou crédit (carte), solde d’ouverture reporté du mois précédent.
- **Paies et paiements** — lignes éditables, modèles récurrents (hebdo, aux deux semaines, mensuel) éditables en place. Les paies dues sont marquées reçues automatiquement.
- **Dettes** — solde, mensualité, progression, prochain paiement. Simulation avalanche / snowball, drops et redirections, sans changer les soldes réels.
- **Mois** — navigation limitée au mois courant + 1. Historique des mois déjà générés.
- **Import CSV** — mapping vers paies, paiements, récurrents ou dettes.
- **Assistant de démarrage** et **thème** clair / sombre.

## Stack

| Couche | Choix |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (Base UI) |
| Données | SQLite (`better-sqlite3`), Drizzle ORM |
| Mutations | Server Actions |
| Runtime | Bun |

Les montants ne passent jamais par des `float`.

## Architecture

Monolithe local : pas d’API publique, pas de compte cloud.

- Schéma : `src/db/schema.ts`
- Lectures : `src/db/queries.ts`
- Écritures : `src/actions/budget.ts`
- Métier : `src/lib/` (totaux, santé financière, dettes, plan de remboursement, CSV)

Les migrations SQLite s’appliquent au démarrage.

## Démarrage

Prérequis : [Bun](https://bun.sh) 1.3+.

```bash
bun install
bun dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Au premier lancement, l’assistant crée les comptes et le mois courant.

```bash
bun run build
bun start
```

Base : `data/budgethor.db` (ignorée par Git). Autre chemin : `SQLITE_PATH`.

## Confidentialité

Aucune donnée budgétaire n’est envoyée à un serveur. Usage personnel, pas un déploiement multi-utilisateurs.

## Auteur

[Zachary Gagné](https://github.com/zf-development) — développeur indépendant à Montréal.

[GitHub](https://github.com/zf-development) · [LinkedIn](https://www.linkedin.com/in/zgagne)
