# Budgethor

Application locale de suivi financier : **revenus**, **dépenses** et **dettes**, organisés par mois.

Budgethor répond à une question simple : *combien me reste-t-il une fois les paies et les paiements prévus pris en compte ?* Le tableau de bord distingue l’argent déjà disponible du solde prévu en fin de mois, et relie les dettes aux comptes (par exemple une carte de crédit) pour que les charges et les remboursements fassent bouger les soldes.

Les montants sont gérés en cents, affichés en dollars canadiens. Les données restent sur la machine, dans une base SQLite.

## Fonctionnalités

- **Vue d’ensemble mensuelle** — solde disponible maintenant, reste prévu après paiements, revenus reçus / attendus, paiements payés / dus, prochaine échéance.
- **Paies et paiements** — lignes éditables (libellé, jour, montant prévu / réel, compte), modèles récurrents (hebdo, aux deux semaines, mensuel).
- **Comptes** — actifs (compte bancaire) et passifs (carte de crédit), avec instantané d’ouverture par mois.
- **Dettes** — solde, mensualité, progression du remboursement, estimation de durée, date de début de paiement et capital initial. Une dette peut être liée à un compte : une dépense sur ce compte augmente le solde, un paiement depuis un autre compte le diminue.
- **File « À traiter »** — paiements en retard et échéances à venir.
- **Import CSV** — mapping des colonnes vers paies, paiements, modèles récurrents ou dettes.
- **Assistant de démarrage** — comptes, revenus, charges et dettes pour générer le premier mois.
- **Thème clair / sombre** et navigation entre les mois déjà créés.

## Stack

| Couche | Choix |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui (Base UI) |
| Données | SQLite (`better-sqlite3`), Drizzle ORM |
| Mutations | Server Actions |
| Runtime | Bun |

Les montants ne passent jamais par des `float` : tout est stocké en **cents** et formaté à l’affichage.

## Architecture

L’app est volontairement **monolithe et locale** : pas d’API publique, pas de compte cloud. Le schéma vit dans `src/db/schema.ts`, les lectures dans `src/db/queries.ts`, les écritures dans `src/actions/budget.ts`.

Logique métier extraite dans `src/lib/` (totaux du mois, dettes, import CSV, comptes) pour rester testable et réutilisable côté UI. Les composants métier (`dashboard-kpis`, tables type tableur, dialogues de confirmation) s’appuient sur des primitives UI dans `src/components/ui/`.

Les migrations SQLite sont appliquées au démarrage pour faire évoluer une base existante sans outil séparé.

## Démarrage

Prérequis : [Bun](https://bun.sh) 1.3+.

```bash
bun install
bun dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Au premier lancement, l’assistant de configuration crée les comptes et le mois courant.

```bash
bun run build
bun start
```

La base est créée dans `data/budgethor.db` (ignorée par Git). Chemin alternatif : variable `SQLITE_PATH`.

## Confidentialité

Aucune donnée budgétaire n’est envoyée à un serveur. Tout reste dans le fichier SQLite local. Convient à un usage personnel, pas à un déploiement multi-utilisateurs.

## Mode agent

Le dépôt sert aussi à montrer un flux **assisté par agents** : briefs fonctionnels, implémentation, puis itérations (dashboard, dettes, import CSV) jusqu’à un produit utilisable.

La direction reste humaine — métier, UX, ce qui entre dans Git. L’agent accélère le code ; le résultat doit se tenir tout seul : TypeScript, règles de soldes explicites, composants réutilisables, données locales. Pas un prototype jetable.
