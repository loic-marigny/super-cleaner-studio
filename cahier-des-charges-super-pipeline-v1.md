
# Cahier des charges fonctionnel - Super Cleaner V1

## 1. Objet du document

Ce document définit le périmètre fonctionnel de la première version de **Super Cleaner**, un utilitaire web de contrôle et de nettoyage de données tabulaires.

La V1 sera centrée exclusivement sur les fichiers **CSV**. Les formats Parquet, XLSX et JSON seront étudiés et ajoutés dans des versions ultérieures.

L'application sera hébergée sur **GitHub Pages** et exécutera l'ensemble des traitements directement dans le navigateur de l'utilisateur. Aucun backend ne sera utilisé dans cette première version.

---

## 2. Objectifs du produit

Super Cleaner poursuit trois objectifs principaux :

1. **Analyser la propreté d'un fichier tabulaire**
2. **Permettre à l'utilisateur de nettoyer facilement le fichier**
3. **Permettre l'export d'un rapport de propreté du fichier**

Dans la V1, l'analyse de qualité se concentre uniquement sur les contrôles **intra-colonne**. Les contrôles de cohérence entre plusieurs colonnes sont hors périmètre.

---

## 3. Périmètre fonctionnel de la V1

### 3.1 Fonctionnalités incluses

La V1 doit permettre :

- l'import d'un fichier CSV ;
- la détection automatique du séparateur ;
- l'interprétation du fichier comme une seule table ;
- l'analyse de toutes les colonnes, une par une ;
- la détection du type majoritaire de chaque colonne ;
- le calcul du taux de valeurs compatibles avec ce type ;
- l'analyse de la complétude ;
- la détection des lignes et colonnes très incomplètes ;
- la détection d'une clé primaire potentielle ;
- le contrôle des doublons sur cette clé ;
- la détection de valeurs aberrantes dans les colonnes numériques ;
- la proposition d'actions de nettoyage adaptées ;
- la validation manuelle de chaque action ;
- la conservation d'un historique limité des opérations ;
- la gestion des principales erreurs d'import et de traitement.

### 3.2 Fonctionnalités hors périmètre

Les éléments suivants ne sont pas inclus dans la première version :

- import de fichiers Parquet ;
- import de fichiers XLSX ;
- import de fichiers JSON ;
- analyse de plusieurs tables ;
- cohérence entre plusieurs colonnes ;
- détection avancée de patterns ;
- détection de valeurs aberrantes dans les dates ;
- score global de qualité ;
- sauvegarde et réimportation d'une configuration de nettoyage ;
- backend ;
- comptes utilisateurs ;
- stockage distant ;
- historique persistant entre plusieurs sessions ;
- traitement par lot de plusieurs fichiers ;
- export du fichier nettoyé dans la première implémentation ;
- export du rapport dans la première implémentation.

Les fonctions d'export restent des objectifs du produit et seront ajoutées dans une étape ultérieure de la V1 ou dans une V1.1.

---

## 4. Architecture fonctionnelle

L'application repose sur les composants suivants :

- **React** pour l'interface ;
- **TypeScript** pour la logique applicative ;
- **DuckDB-Wasm** pour l'analyse et les transformations SQL ;
- **GitHub Pages** pour l'hébergement ;
- traitement local dans le navigateur ;
- aucun transfert du fichier vers un serveur.

Flux général :

```text
Import du fichier CSV
        ↓
Validation du fichier
        ↓
Détection du séparateur et lecture
        ↓
Analyse générale
        ↓
Analyse colonne par colonne
        ↓
Détection des anomalies
        ↓
Proposition d'actions de nettoyage
        ↓
Validation manuelle
        ↓
Application des transformations
        ↓
Prévisualisation du résultat
```

---

## 5. Contraintes sur les données

### 5.1 Nature des données acceptées

La V1 accepte uniquement :

- un fichier CSV ;
- contenant une seule table ;
- avec une ligne d'en-tête ;
- avec des colonnes identifiables ;
- avec des données organisées en lignes et colonnes.

Les données imbriquées, multi-tables ou semi-structurées ne sont pas concernées.

### 5.2 Taille maximale

La taille maximale autorisée pour un fichier CSV est fixée à :

> **300 Mo**

Tout fichier dépassant cette limite doit être refusé avant le lancement de l'analyse.

L'application doit afficher un message expliquant que :

- le traitement est réalisé dans le navigateur ;
- les performances dépendent de la mémoire disponible ;
- les fichiers plus volumineux doivent être découpés avant import.

Cette limite pourra être modifiée après des tests de performance sur plusieurs machines.

### 5.3 Détection du séparateur

L'application doit tenter de détecter automatiquement le séparateur du fichier.

Les séparateurs prioritaires sont :

- virgule `,` ;
- point-virgule `;` ;
- tabulation ;
- barre verticale `|`.

Le séparateur détecté doit être affiché à l'utilisateur.

Une correction manuelle pourra être prévue si la détection automatique échoue ou produit une table incohérente.

---

## 6. Analyse générale du fichier

Après import, l'application doit afficher au minimum :

- nom du fichier ;
- taille du fichier ;
- nombre de lignes ;
- nombre de colonnes ;
- séparateur détecté ;
- nombre de lignes entièrement vides ;
- nombre de colonnes très incomplètes ;
- clé primaire potentielle détectée, le cas échéant.

L'application ne doit jamais charger l'intégralité des données dans l'état React.

L'aperçu visuel doit être limité à un nombre raisonnable de lignes, par exemple 50 à 100 lignes.

Les calculs statistiques doivent être exécutés dans DuckDB-Wasm.

---

## 7. Analyse des types

### 7.1 Objectif

Pour chaque colonne, l'application doit :

- détecter le type majoritaire ;
- calculer le taux de valeurs compatibles avec ce type ;
- identifier les valeurs incompatibles ;
- afficher un échantillon de ces valeurs.

### 7.2 Types envisagés

Les types principaux sont :

- chaîne de caractères ;
- entier ;
- nombre décimal ;
- booléen ;
- date ;
- date et heure ;
- valeur nulle.

### 7.3 Type majoritaire

Le type majoritaire correspond au type compatible avec le plus grand nombre de valeurs non manquantes.

Exemple :

```text
Colonne : montant
Type majoritaire : nombre décimal
Taux de compatibilité : 98,7 %
Valeurs incompatibles : 412
```

### 7.4 Actions proposées

Selon le résultat, l'application pourra proposer :

- convertir la colonne vers le type majoritaire ;
- remplacer les valeurs incompatibles par `NULL` ;
- conserver les valeurs originales ;
- filtrer les lignes incompatibles ;
- changer manuellement le type cible.

Aucune action ne doit être appliquée sans validation de l'utilisateur.

---

## 8. Analyse de la complétude

### 8.1 Valeurs considérées comme manquantes

Pour tous les types :

- `NULL`.

Pour les colonnes textuelles :

- chaîne vide ;
- chaîne composée uniquement d'espaces ;
- `N/A` ;
- `NA` ;
- `null` ;
- `None` ;
- `-`.

La comparaison des chaînes textuelles doit être insensible aux espaces de début et de fin.

Selon les choix d'implémentation, la comparaison pourra aussi être insensible à la casse.

### 8.2 Indicateurs par colonne

Pour chaque colonne, l'application doit afficher :

- nombre de valeurs manquantes ;
- taux de valeurs manquantes ;
- nombre de valeurs présentes ;
- taux de complétude.

### 8.3 Colonnes très incomplètes

Une colonne est signalée comme très incomplète lorsque :

> plus de 80 % de ses valeurs sont manquantes.

L'application doit clairement distinguer :

- les colonnes totalement vides ;
- les colonnes vides à plus de 80 % ;
- les autres colonnes.

### 8.4 Lignes très incomplètes

Une ligne est signalée comme très incomplète lorsque :

> plus de 80 % de ses cellules sont manquantes.

Les lignes entièrement vides doivent être signalées séparément.

### 8.5 Actions proposées

Selon le cas, l'application pourra proposer :

- supprimer une colonne très incomplète ;
- supprimer les lignes entièrement vides ;
- supprimer les lignes très incomplètes ;
- remplacer certaines valeurs manquantes ;
- conserver les données telles quelles.

Les remplacements proposés devront rester simples dans la V1, par exemple :

- valeur fixe ;
- zéro ;
- chaîne vide ;
- moyenne ou médiane pour une colonne numérique.

---

## 9. Analyse des patterns

L'analyse des patterns est hors périmètre de la première implémentation.

Le module sera prévu dans l'architecture, mais ne sera pas détaillé dans cette version du cahier des charges.

Il pourra ultérieurement couvrir :

- longueurs dominantes ;
- formats textuels ;
- casse ;
- caractères spéciaux ;
- expressions régulières ;
- valeurs ne respectant pas le format dominant.

---

## 10. Analyse des écarts et valeurs aberrantes

### 10.1 Colonnes concernées

Dans la première version, la détection des valeurs aberrantes concerne uniquement les colonnes numériques.

Les colonnes de date seront analysées plus tard.

### 10.2 Méthode de détection

Pour chaque colonne numérique :

1. calculer le premier décile `D1` ;
2. calculer le neuvième décile `D9` ;
3. calculer l'intervalle central :

```text
I = D9 - D1
```

4. calculer la borne basse :

```text
Borne basse = D1 - 0,25 x I
```

5. calculer la borne haute :

```text
Borne haute = D9 + 0,25 x I
```

Une valeur est considérée comme potentiellement aberrante lorsqu'elle est :

- inférieure à la borne basse ;
- supérieure à la borne haute.

### 10.3 Résultats affichés

Pour chaque colonne numérique, l'application doit pouvoir afficher :

- minimum ;
- maximum ;
- premier décile ;
- neuvième décile ;
- borne basse ;
- borne haute ;
- nombre de valeurs aberrantes ;
- taux de valeurs aberrantes ;
- aperçu des valeurs concernées.

### 10.4 Actions proposées

L'application pourra proposer :

- conserver les valeurs ;
- remplacer les valeurs aberrantes par `NULL` ;
- supprimer les lignes concernées ;
- plafonner les valeurs à la borne haute ;
- relever les valeurs à la borne basse ;
- remplacer par la médiane ;
- filtrer temporairement ces valeurs dans l'aperçu.

Une valeur aberrante doit toujours être présentée comme potentiellement inhabituelle, et non comme nécessairement erronée.

---

## 11. Détection d'une clé primaire potentielle

### 11.1 Objectif

L'application doit tenter d'identifier une colonne pouvant servir de clé primaire potentielle.

### 11.2 Règles de sélection

Pour chaque colonne candidate :

- calculer le nombre de valeurs distinctes ;
- calculer le taux d'unicité ;
- calculer le nombre de valeurs manquantes.

Priorité de sélection :

1. colonne sans valeur manquante et avec 100 % de valeurs uniques ;
2. à défaut, colonne sans valeur manquante et avec au moins 95 % de valeurs uniques ;
3. à défaut, aucune clé primaire n'est proposée.

Formule du taux d'unicité :

```text
Taux d'unicité = nombre de valeurs distinctes / nombre total de lignes
```

### 11.3 Plusieurs colonnes candidates

Si plusieurs colonnes satisfont les critères, l'application doit :

- les présenter à l'utilisateur ;
- afficher leur taux d'unicité ;
- permettre à l'utilisateur de choisir la colonne à utiliser.

L'application ne doit pas sélectionner arbitrairement une colonne en cas d'égalité ou de forte similarité.

### 11.4 Contrôle des doublons

Le contrôle des doublons est réalisé sur la clé primaire potentielle sélectionnée.

L'application doit afficher :

- nombre de valeurs dupliquées ;
- nombre de lignes concernées ;
- taux de doublons ;
- exemples de valeurs dupliquées.

### 11.5 Actions proposées

L'application pourra proposer :

- conserver toutes les lignes ;
- conserver la première occurrence ;
- conserver la dernière occurrence ;
- supprimer toutes les occurrences dupliquées ;
- filtrer les doublons dans l'aperçu.

La suppression doit être précédée d'un aperçu de l'impact.

---

## 12. Actions de nettoyage

### 12.1 Principe général

Chaque anomalie détectée doit être associée à des actions pertinentes.

Aucune action ne doit être appliquée automatiquement sans validation explicite.

Flux attendu :

```text
Anomalie détectée
        ↓
Action proposée
        ↓
Prévisualisation de l'impact
        ↓
Validation par l'utilisateur
        ↓
Application de l'opération
        ↓
Mise à jour des indicateurs
```

### 12.2 Prévisualisation

Avant validation, l'application doit afficher :

- nombre de cellules concernées ;
- nombre de lignes concernées ;
- nombre de lignes supprimées ;
- nombre de valeurs modifiées ;
- aperçu avant ;
- aperçu après ;
- avertissement en cas d'opération destructive.

### 12.3 Opérations destructives

Les opérations suivantes doivent être considérées comme destructives :

- suppression de lignes ;
- suppression de colonnes ;
- remplacement irréversible ;
- suppression de doublons ;
- conversion de type entraînant une perte d'information.

Elles doivent être visuellement signalées.

---

## 13. Historique des opérations

### 13.1 Capacité

L'application doit conserver les cinq dernières opérations validées.

L'utilisateur doit pouvoir :

- consulter les cinq dernières opérations ;
- annuler la dernière opération ;
- revenir successivement jusqu'à cinq opérations en arrière.

### 13.2 Limite

Lorsque l'utilisateur valide une sixième opération :

- la plus ancienne opération sort de l'historique ;
- elle ne peut plus être annulée depuis l'interface.

### 13.3 Contraintes techniques

L'historique ne doit pas reposer sur cinq copies complètes du fichier en mémoire.

Il devra être implémenté en privilégiant :

- une liste d'opérations ;
- des requêtes SQL ou vues successives ;
- des tables temporaires maîtrisées ;
- une reconstruction de l'état lorsque cela reste performant.

---

## 14. Mise à jour de l'analyse

Après chaque opération validée, l'application doit recalculer les indicateurs concernés.

Exemples :

- après conversion d'un type, recalcul du taux de compatibilité ;
- après suppression de lignes vides, recalcul du nombre de lignes ;
- après suppression de doublons, recalcul du taux d'unicité ;
- après traitement des valeurs aberrantes, recalcul des bornes et statistiques.

L'application doit éviter de relancer inutilement toutes les analyses lorsque seule une partie des résultats doit être actualisée.

---

## 15. Gestion des erreurs

### 15.1 Erreurs d'import

L'application doit gérer :

- fichier absent ;
- fichier vide ;
- extension non prise en charge ;
- fichier supérieur à 300 Mo ;
- fichier corrompu ;
- fichier illisible ;
- encodage non interprétable ;
- séparateur non détectable ;
- nombre incohérent de colonnes selon les lignes ;
- absence d'en-tête ;
- noms de colonnes vides ;
- noms de colonnes dupliqués.

### 15.2 Erreurs de structure

L'application doit gérer :

- table sans colonne ;
- table sans ligne exploitable ;
- colonne entièrement vide ;
- ligne entièrement vide ;
- type impossible à déterminer ;
- colonne comportant uniquement des valeurs manquantes.

### 15.3 Erreurs de traitement

L'application doit gérer :

- échec d'une requête DuckDB ;
- mémoire navigateur insuffisante ;
- traitement interrompu ;
- erreur lors d'une conversion de type ;
- opération impossible sur le type de colonne ;
- absence de clé primaire potentielle ;
- annulation d'une opération non disponible ;
- fermeture ou rechargement de la page pendant un traitement.

### 15.4 Messages utilisateur

Chaque message d'erreur doit :

- expliquer clairement le problème ;
- éviter le jargon technique inutile ;
- proposer une action corrective ;
- indiquer si les données déjà chargées restent disponibles ;
- permettre de revenir à une étape stable.

Exemple :

```text
Le fichier dépasse la limite de 300 Mo.

Découpez-le en plusieurs fichiers CSV plus petits, puis importez-les séparément.
Aucune donnée n'a été chargée.
```

---

## 16. Performance et expérience utilisateur

### 16.1 Traitements en arrière-plan

Les traitements lourds doivent être exécutés dans un Web Worker lorsque cela est possible afin de ne pas bloquer l'interface.

### 16.2 Progression

Pour les opérations longues, l'application doit afficher :

- étape en cours ;
- indicateur de progression lorsque disponible ;
- durée écoulée ;
- possibilité d'annuler le traitement.

### 16.3 Aperçu limité

L'application ne doit jamais afficher toutes les lignes.

L'aperçu doit être :

- limité ;
- paginé ou virtualisé ;
- recalculé depuis DuckDB ;
- indépendant du volume total du fichier.

### 16.4 Prévention des blocages

Avant le traitement, l'application doit vérifier :

- taille du fichier ;
- compatibilité du format ;
- capacité à lire les premières lignes ;
- cohérence générale de la structure.

En cas de risque élevé, elle doit interrompre le traitement proprement et expliquer la cause.

---

## 17. Confidentialité

L'application traite les données exclusivement dans le navigateur.

Le cahier des charges impose que :

- le fichier ne soit jamais envoyé à un serveur ;
- aucune donnée du fichier ne soit stockée sur GitHub Pages ;
- aucun contenu de cellule ne soit envoyé à un service tiers ;
- les noms de colonnes ne soient pas transmis à un outil d'analyse externe ;
- les données soient libérées lors de la fermeture ou du rechargement de la page ;
- les journaux techniques n'enregistrent pas le contenu des données.

Un message visible doit informer l'utilisateur :

> Vos données sont traitées localement dans votre navigateur et ne sont jamais envoyées vers un serveur.

---

## 18. Critères d'acceptation de la V1

La V1 est considérée comme fonctionnelle lorsque l'utilisateur peut :

1. importer un fichier CSV inférieur ou égal à 300 Mo ;
2. obtenir une détection automatique du séparateur ;
3. afficher le nombre de lignes et de colonnes ;
4. consulter un aperçu limité des données ;
5. obtenir le type majoritaire de chaque colonne ;
6. obtenir le taux de valeurs compatibles avec ce type ;
7. identifier les valeurs manquantes ;
8. identifier les lignes et colonnes vides à plus de 80 % ;
9. détecter une clé primaire potentielle selon les règles définies ;
10. identifier les doublons sur cette clé ;
11. détecter les valeurs aberrantes numériques selon les déciles ;
12. consulter des actions de nettoyage adaptées ;
13. prévisualiser l'impact d'une action ;
14. valider manuellement une action ;
15. annuler jusqu'à cinq opérations ;
16. obtenir des messages compréhensibles en cas d'erreur ;
17. utiliser l'application sans que le fichier soit transmis à un serveur.

---

## 19. Évolutions prévues

Les évolutions envisagées après la première version sont :

- import Parquet ;
- import XLSX ;
- import JSON et NDJSON ;
- analyse des patterns ;
- analyse des valeurs aberrantes temporelles ;
- export CSV ;
- export Parquet ;
- export JSON ;
- export XLSX pour les volumes compatibles ;
- export d'un rapport HTML ;
- export d'un rapport JSON ;
- analyse de doublons sur plusieurs colonnes ;
- clés composites ;
- cohérence entre colonnes ;
- sauvegarde d'un pipeline de nettoyage ;
- réapplication d'un pipeline ;
- version desktop ;
- moteur Python et DuckDB natif pour les gros volumes.

---

## 20. Résumé du périmètre

La première version de Super Cleaner est un utilitaire web statique permettant d'analyser et de nettoyer localement un fichier CSV tabulaire.

Elle se concentre sur :

- le typage ;
- la complétude ;
- les doublons sur une clé potentielle ;
- les valeurs aberrantes numériques ;
- les actions de nettoyage validées manuellement ;
- un historique limité à cinq opérations ;
- la confidentialité des données ;
- la robustesse de l'import et de la gestion des erreurs.

Elle exclut volontairement les analyses métier, les relations inter-colonnes, les patterns avancés, les autres formats de fichiers et les traitements serveur.

