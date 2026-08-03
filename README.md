# Super Cleaner

Super Cleaner est un utilitaire web local pour analyser, nettoyer et réexporter des fichiers CSV.

La V1 se concentre sur un flux simple :

1. importer un CSV ;
2. détecter les types, nulls, écarts et valeurs aberrantes ;
3. corriger ou supprimer les anomalies ;
4. exporter un CSV nettoyé et un rapport d'analyse.

## Points clés

- traitement local dans le navigateur ;
- détection du séparateur CSV ;
- analyse par colonne avec types, nulls, écarts et bornes ;
- édition directe dans la grille ;
- export CSV en UTF-8 ;
- export d'un rapport CSV ;
- interface disponible en français, anglais, russe et chinois simplifié.

## Stack

- React 19
- Vite
- TanStack Router / Start
- TypeScript
- Tailwind CSS

## Démarrage local

Prérequis :

- Node.js 20 ou plus récent ;
- npm.

Installation et lancement :

```sh
npm install
npm run dev
```

Application locale par défaut :

```txt
http://localhost:3000
```

Build de production :

```sh
npm run build
```

Prévisualisation du build :

```sh
npm run preview
```

## Structure utile

```txt
public/super-cleaner-demo.csv   Fichier de démonstration chargé depuis l'interface
src/routes                      Pages principales
src/components/sp               Composants métier et interface
src/lib/workspace.tsx           Etat, analyse et transformations du workspace
src/lib/i18n                    Traductions
```

## Périmètre V1

La V1 couvre un cas d'usage unique : nettoyer un fichier CSV tabulaire dans le navigateur sans backend.

Le projet ne vise pas encore :

- l'import Excel natif ;
- la persistance serveur ;
- les comptes utilisateurs ;
- la collaboration ;
- l'automatisation par pipeline distant.

## Dépôt GitHub

Le dépôt GitHub actuellement branché est :

```txt
https://github.com/loic-marigny/super-cleaner-studio
```

## Licence

MIT. Voir [LICENSE](./LICENSE).
