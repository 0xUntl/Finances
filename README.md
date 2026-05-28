# Finances

Web app de comptabilité pro (kiné) & perso, basée sur la structure du fichier `Comptabilité 2026.xlsx`.

## Stack
- **Front** : Vite + React + TypeScript + Tailwind (PWA via vite-plugin-pwa)
- **Back** : Express + SQLite (better-sqlite3)
- **Déploiement** : Railway (Nixpacks)

## Périmètre V1
- Navigation mois/année avec dashboard du mois (Brut / Pro / Perso / Prévision invest / Bonta & Matelas)
- Saisie des revenus kiné avec répartition automatique en 4 enveloppes
- Charges fixes pro (SCM/SCI/conventionnement) + récurrentes perso, avec statut "fait" mensuel
- Dépenses ponctuelles
- Abonnements annuels (renouvellements)
- Plan d'investissement (PEA 70 / OR 20 / Crypto 10 par défaut) avec sous-allocation par ISIN
- Until Prod (suivi facturation montage vidéo)
- Réglages : pourcentages de répartition + allocation invest, modifiables à la volée

## Lancement local
```bash
npm run install:all
npm run dev
```
- Front : http://localhost:5173
- API : http://localhost:3001

## Build & start (prod)
```bash
npm run build
npm start
```

## Données
SQLite stocké dans `server/data/finances.db` (créé automatiquement). Les charges fixes pro/perso et les abonnements sont pré-remplis à partir du fichier Excel source.
