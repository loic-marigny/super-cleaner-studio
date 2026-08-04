# Super Cleaner

Super Cleaner est un utilitaire web local de contrôle, nettoyage et réexport de fichiers CSV.

L'application vise un usage simple et direct :

- charger un CSV dans le navigateur ;
- comprendre rapidement la structure et la qualité des données ;
- corriger les anomalies les plus courantes sans écrire de code ;
- réexporter un CSV nettoyé ainsi qu'un rapport d'analyse exploitable.

## Objectifs du produit

Super Cleaner V1 a été conçu pour répondre à des besoins concrets de pré-nettoyage de données tabulaires :

- qualifier rapidement un fichier CSV reçu d'un outil métier, d'un export ERP/CRM ou d'un tableur ;
- repérer les colonnes problématiques sans passer par Excel ou un script ad hoc ;
- formaliser les types attendus colonne par colonne ;
- corriger ou supprimer les valeurs incompatibles, incohérentes, manquantes ou aberrantes ;
- préparer un export final plus propre avant réimport dans un autre système ;
- garder un fonctionnement 100 % local, sans backend ni envoi de données.

## Périmètre fonctionnel actuel

### Import CSV

- import de fichiers `.csv` depuis l'interface ;
- chargement d'un fichier de démonstration intégré au projet ;
- détection automatique du séparateur ;
- limite d'import de 300 Mo ;
- décodage robuste des fichiers importés ;
- gestion de plusieurs encodages courants avec normalisation vers UTF-8 côté export ;
- normalisation de certains espaces parasites lors de la lecture.

### Analyse tabulaire

- analyse par colonnes et par cellules ;
- détection d'en-têtes incohérents ;
- contrôle du nombre de colonnes ;
- calcul d'indicateurs globaux :
  - nombre de lignes ;
  - nombre de colonnes ;
  - lignes vides ;
  - lignes très incomplètes ;
  - colonnes très incomplètes ;
  - cellules manquantes ;
  - clés primaires potentielles ;
- pagination de l'aperçu de la grille par blocs de 100 lignes.

### Typage des colonnes

- détection automatique du type majoritaire par colonne ;
- changement manuel du type depuis l'en-tête ;
- types natifs disponibles :
  - texte ;
  - entier ;
  - décimal ;
  - booléen ;
  - date ;
  - date+heure ;
  - null ;
- validation des cellules par rapport au type de la colonne, et non plus cellule par cellule de façon isolée.

### Types personnalisés

- création de types de sélection ;
- création manuelle d'un type à valeurs autorisées ;
- ajout et suppression d'options dans le formulaire de création ;
- analyse d'une colonne existante pour préremplir un type de sélection ;
- tri des valeurs détectées par fréquence décroissante ;
- affichage du nombre d'occurrences par option ;
- création de types structurés par composition de segments ;
- segments disponibles :
  - texte libre ;
  - lettres ;
  - majuscules ;
  - minuscules ;
  - chiffres ;
  - alphanumérique ;
  - caractère littéral ;
- définition de longueurs fixes ou libres selon le segment ;
- usage possible pour des formats comme :
  - emails ;
  - références métier ;
  - identifiants formatés.

### Gestion des valeurs manquantes

- affichage de `null` dans les cellules vides ;
- rendu visuel dédié :
  - gris ;
  - italique ;
  - aligné à droite ;
- option par colonne pour relever ou non les nulls ;
- impact direct de cette option sur la jauge, les alertes et la synthèse.

### Analyse des écarts et valeurs aberrantes

- option par colonne pour relever ou non les écarts ;
- disponible sur les colonnes numériques ;
- calcul automatique de bornes ;
- mise en évidence des valeurs potentiellement aberrantes ;
- champs `Min` / `Max` éditables dans les en-têtes ;
- préremplissage avec les bornes calculées automatiquement ;
- réévaluation immédiate des cellules si les bornes sont modifiées ;
- action de suppression des erreurs associées à la colonne.

### Gestion des nombres

- prise en charge des colonnes entières et décimales ;
- sélecteur global pour le séparateur décimal attendu :
  - `.` ;
  - `,` ;
  - les deux ;
- signalement en orange des valeurs compatibles mais non conformes à la préférence choisie ;
- ajout de cas de test numériques variés dans le fichier d'exemple.

### Gestion des booléens

- acceptation de variantes usuelles :
  - `true` / `false` ;
  - `1` / `0` ;
  - `oui` / `non` ;
  - autres variantes usuelles gérées sans sensibilité à la casse ;
- signalement en orange des booléens compatibles mais non canoniques ;
- bouton de correction automatique en en-tête ;
- normalisation possible vers une forme canonique.

### Gestion des dates

- détection des colonnes de dates ;
- prise en charge d'orthographes et formats variés ;
- distinction entre :
  - date invalide non corrigeable ;
  - date identifiable mais mal formalisée ;
- signalement orange pour les dates reconnaissables mais non normalisées ;
- signalement rouge pour les dates non corrigeables automatiquement ;
- correction automatique possible pour certains cas comme :
  - année seule ;
  - année + mois ;
  - variantes de format reconnues ;
- choix global du format cible dans la barre d'outils.

### Grille de travail

- affichage des données dans un tableau éditable ;
- aperçu limité à 100 lignes par page pour préserver les performances ;
- navigation explicite entre blocs de 100 lignes ;
- survol des cellules en défaut avec message explicatif ;
- indicateurs visuels par cellule :
  - warning orange pour les avertissements ;
  - croix rouge pour les erreurs ;
- édition inline des cellules via un crayon dans la grille ;
- validation de la saisie en fonction du type de colonne ;
- saisie de `null` autorisée ;
- redimensionnement des colonnes ;
- menu contextuel sur les lignes ;
- clic droit sur une ligne pour :
  - supprimer la ligne ;
  - utiliser la ligne comme en-têtes ;
- support de la colonne d'index `#`.

### En-têtes de colonnes

- sélection du type de colonne ;
- jauge d'état par colonne ;
- état visuel synthétique :
  - coche verte si conforme ;
  - warning si anomalies ;
- suppression d'une colonne depuis l'en-tête ;
- zone de contrôles repliable / dépliable ;
- filtres par colonne via un bouton hamburger dédié ;
- surbrillance visuelle lorsqu'un filtre est actif ;
- contrôles séparés pour :
  - relever les écarts ;
  - relever les nulls ;
  - supprimer les erreurs ;
  - corriger les booléens ;
  - corriger les dates ;
  - bornes min / max sur colonnes numériques.

### Filtres de colonnes

- ouverture d'un panneau de filtrage par colonne ;
- interface présente pour tous les types principaux ;
- filtrage disponible selon le type :
  - erreurs uniquement ;
  - avertissements uniquement ;
  - nulls uniquement ;
  - recherche texte ;
  - valeur exacte ;
  - bornes min / max ;
  - date de / à ;
  - booléen vrai / faux ;
- fermeture du panneau par action explicite ;
- surbrillance de la colonne lorsqu'un filtre est actif.

### Synthèse et diagnostic

- panneau de synthèse à droite ;
- métriques avec aide au survol ;
- détection de clés primaires potentielles ;
- affichage de plusieurs candidats ;
- possibilité de choisir :
  - une clé candidate ;
  - aucune clé primaire ;
- mise en évidence de la clé retenue dans la grille ;
- détection des doublons sur la clé sélectionnée ;
- carte de synthèse des problèmes ouverts ;
- liste d'actions de nettoyage proposées.

### Volet des anomalies

- vue dédiée aux anomalies détectées ;
- regroupement par type de problème et par colonne ;
- affichage des lignes en faute pour chaque anomalie ;
- prévisualisation limitée des lignes concernées ;
- possibilité d'éditer directement les cellules depuis ce volet ;
- export du rapport depuis ce volet ;
- prévisualisation de l'impact avant application d'une action.

### Actions de nettoyage

- remplacement des valeurs incompatibles par `NULL` ;
- suppression des lignes incompatibles ;
- remplacement des valeurs aberrantes par `NULL` ;
- suppression de lignes vides ;
- suppression de lignes très incomplètes ;
- suppression de colonnes ;
- suppression automatique optionnelle des colonnes vides à l'import ;
- une colonne est considérée vide si :
  - toutes ses valeurs sont manquantes ;
  - ou toutes ses valeurs non manquantes valent `0` ;
- normalisation des booléens ;
- normalisation des dates ;
- dédoublonnage sur clé primaire potentielle ;
- annulation des dernières opérations ;
- historique local limité des actions.

### Exports

- export du CSV nettoyé ;
- export du rapport d'anomalies au format CSV ;
- export en UTF-8 avec BOM pour une meilleure compatibilité ;
- conservation du séparateur source lors de l'export ;
- rapport structuré par colonnes avec indicateurs détaillés.

### Rapport d'analyse exporté

Le rapport CSV exporté inclut actuellement, par colonne :

- `nombre_null` ;
- `quasi_vide` ;
- `vide` ;
- `type_releve` ;
- `taux_unicite` ;
- `nombre_erreurs_type` ;
- `bornes_identifiees` ;
- `nombre_valeurs_hors_bornes`.

Le rapport inclut aussi les colonnes automatiquement supprimées à l'import parce qu'elles étaient vides, afin de ne pas perdre cette information.

### Internationalisation

- interface disponible en :
  - français ;
  - anglais ;
  - russe ;
  - chinois simplifié ;
- changement de langue depuis la barre supérieure ;
- couverture i18n appliquée à l'ensemble du produit.

### Navigation et pages

- page d'accueil ;
- page `workspace` pour l'analyse et le nettoyage ;
- page `about` ;
- page `settings`.

## Stack technique

- React 19
- TypeScript
- Vite
- TanStack Router
- TanStack Start
- Tailwind CSS
- Radix UI

## Démarrage local

Prérequis :

- Node.js 20 ou plus récent ;
- npm.

Installation :

```sh
npm install
```

Lancement en local :

```sh
npm run dev
```

Adresse locale par défaut :

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

Build GitHub Pages :

```sh
npm run build:pages
```

## Structure utile

```txt
public/super-cleaner-demo.csv   CSV de démonstration chargé depuis l'interface
scripts/build-pages.mjs         Build adapté à GitHub Pages
src/routes                      Pages de l'application
src/components/sp               Composants métier du produit
src/lib/workspace.tsx           Moteur d'analyse, état et transformations
src/lib/i18n                    Traductions et provider i18n
src/server.ts                   Entrée serveur / SSR
```

## Limites actuelles

Le produit couvre aujourd'hui un cas d'usage précis : le nettoyage local de CSV tabulaires.

Ce qui n'est pas couvert à ce stade :

- import natif `.xlsx` ;
- jointures multi-fichiers ;
- règles métier persistées par projet ;
- sauvegarde serveur ;
- comptes utilisateurs ;
- collaboration temps réel ;
- API distante d'automatisation ;
- pipeline batch côté serveur.

## Dépôt GitHub

Dépôt actuellement associé :

```txt
https://github.com/loic-marigny/super-cleaner-studio
```

## Licence

MIT. Voir [LICENSE](./LICENSE).
