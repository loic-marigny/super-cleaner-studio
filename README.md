# Super Cleaner Studio

Conçois uniquement le front-end et le design system de Super Cleaner, une petite application web gratuite permettant de nettoyer et standardiser des fichiers Excel (.xlsx) et CSV.

Le but est exclusivement de créer une interface graphique cohérente et réutilisable. Ne développe aucune logique métier réelle et utilise uniquement des données simulées. Les fonctionnalités seront développées ultérieurement.

Philosophie du projet

Super Cleaner est un petit utilitaire, pas une plateforme SaaS.

L'utilisateur arrive avec un fichier, le fait analyser, le nettoie puis le télécharge.

L'application ne doit donner à aucun moment l'impression de vouloir retenir l'utilisateur.

Les principes fondamentaux sont :

 aucune création de compte ;

 aucune connexion ;

 aucun historique des traitements ;

 aucun stockage des fichiers ;

 aucune sauvegarde des données utilisateur ;

 aucune collaboration ;

 aucune métrique, gamification ou tableau de bord.

Les seuls éléments persistants pourront être quelques préférences enregistrées localement dans le navigateur (cookies ou stockage local), comme le thème ou certains paramètres d'affichage.

L'interface doit inspirer la confiance, la simplicité, la confidentialité et la fiabilité.

Conçois l'application comme un logiciel de bureau installé localement, même si elle fonctionne dans un navigateur.

Direction artistique

L'identité visuelle est inspirée des logiciels bureautiques des années 1995�?"2005 (Windows 95, Windows XP, Excel 2003), mais entièrement modernisée.

Il ne s'agit pas d'une parodie rétro.

L'objectif est de produire une interface :

 chaleureuse ;

 sobre ;

 très lisible ;

 professionnelle ;

 intemporelle.

Le ton rédactionnel reste sérieux, clair et direct.

La personnalité du produit s'exprime uniquement par les détails graphiques, les animations et la qualité des interactions.

Palette

Construis toute l'interface autour de cette palette.

Fond principal

#F4F1EA

Fond secondaire

#FCFBF8

Brun principal

#7A5C45

Brun foncé (titres)

#4D3B2D

Bleu accent

#4A7CFF

Vert succès

#63A86C

Orange avertissement

#D89A3D

Rouge erreur

#C85C5C

�?vite le noir pur autant que possible.

Typographie

Utilise une police moderne (Inter ou équivalent).

L'ensemble doit rester très lisible.

Les contrastes doivent être excellents.

Logo

Propose un logo simple, textuel et facilement identifiable.

Le logo doit être basé sur :

SP

 ou Super Cleaner

�?vite les logos complexes ou illustratifs.

Le logo peut utiliser les couleurs de la palette et rappeler discrètement l'univers des logiciels bureautiques, tout en restant moderne.

Mise en page générale

L'application est pensée avant tout pour ordinateur.

Le responsive mobile doit fonctionner correctement, mais l'expérience principale est desktop.

Sur mobile :

 les boutons restent lisibles ;

 les textes ne passent pas à la ligne inutilement ;

 l'interface reste utilisable.

Sur ordinateur :

 utilise une largeur très généreuse ;

 le contenu peut dépasser horizontalement lorsque les tableaux possèdent de nombreuses colonnes (50+) ;

 privilégie une scrollbar horizontale plutôt que de compresser les colonnes.

Ne limite pas artificiellement la largeur du contenu à 1200 px.

Structure du site

L'application comporte uniquement quatre pages principales.

1. Landing page

Interface très simple.

Elle contient :

 logo ;

 présentation du produit ;

 zone de dépôt de fichier ;

 quelques explications très courtes ;

 accès aux paramètres ;

 accès à la page About.

2. Workspace

C'est le c�"ur de l'application.

Après le chargement du fichier, l'utilisateur arrive directement ici.

Le tableur doit occuper la très grande majorité de l'écran.

La hiérarchie est simple :

 header discret ;

 éventuellement une petite barre d'outils contextuelle ;

 immense surface de travail.

�?vite les interfaces composées de nombreuses cartes, panneaux ou widgets.

Le tableur est toujours la priorité visuelle.

3. Settings

Préférences générales.

Par exemple :

 thème ;

 séparateur CSV ;

 formats de date ;

 préférences d'affichage.

4. About

Présentation du projet.

Licence.

Informations générales.

Workspace

Le Workspace est conçu autour d'un grand composant de type tableur.

Il ne s'agit pas d'une simple table HTML.

Conçois un véritable composant inspiré des logiciels bureautiques :

 en-têtes de colonnes ;

 numéros de lignes ;

 sélection de cellules ;

 défilement fluide ;

 colonnes redimensionnables (simulation) ;

 grands espaces de travail.

Même si ces interactions sont simulées.

Le tableau doit être agréable à utiliser sur de très gros fichiers.

Analyse des colonnes

Chaque colonne possède une petite barre de progression discrète indiquant l'état de son analyse.

Les contrôles simulés comprennent notamment :

 détection du type de données ;

 cohérence de la colonne ;

 valeurs aberrantes ;

 valeurs nulles ou vides.

La progression doit être immédiatement compréhensible.

Gestion des problèmes

Les problèmes détectés ne sont pas affichés dans une barre latérale permanente.

Prévois un bouton permettant d'ouvrir une fenêtre (modal ou panneau flottant) qui apparaît au-dessus du tableur.

Cette fenêtre liste les problèmes détectés pour chaque colonne.

Elle permet ensuite de choisir les actions à appliquer.

Une fois refermée, le tableur retrouve immédiatement toute la place disponible.

Règles de nettoyage

Les règles sont regroupées dans un panneau repliable situé sous le tableur ou dans une zone discrète du workspace.

Il reste fermé par défaut.

Les règles proposées sont génériques.

Par exemple :

 contrôle de type ;

 gestion des cellules vides ;

 suppression des erreurs de type ;

 contrôle de cohérence ;

 valeurs aberrantes.

L'utilisateur choisit simplement les comportements souhaités.

Les règles restent implicites et généralisées.

Il ne s'agit pas d'un éditeur de workflow complexe.

Animations

Les animations sont importantes mais toujours discrètes.

Elles servent uniquement à améliorer la compréhension.

Propose notamment :

 dépôt du fichier dans la zone d'upload ;

 lecture du fichier ;

 progression de l'analyse ;

 apparition progressive des contrôles effectués ;

 barres de progression des colonnes ;

 réalignement des cellules ;

 disparition des doublons ;

 correction visuelle des valeurs invalides ;

 redimensionnement fluide des colonnes ;

 transitions avant / après ;

 téléchargement prêt ;

 micro-interactions des boutons ;

 relief subtil des onglets ;

 notifications élégantes.

Toutes les animations doivent rester rapides, sobres et professionnelles.

Icônes

Utilise des icônes cohérentes avec l'esprit bureautique rétro modernisé.

�?vite les illustrations décoratives.

Composants

Construis un véritable design system réutilisable comprenant notamment :

Navigation

 Header

 Toolbar

 Tabs

 Breadcrumb

Actions

 Button

 IconButton

 Dropdown

 Toggle

 Checkbox

Formulaires

 TextField

 Select

 SearchField

Traitement

 FileDrop

 ProgressBar

 Stepper

 StatusBadge

Affichage

 Spreadsheet

 DataTable

 DiffViewer

 EmptyState

 Modal

 Dialog

 Toast

 Notification

 Tooltip

Tous les composants doivent prévoir leurs variantes :

 hover ;

 focus ;

 disabled ;

 loading ;

 succès ;

 avertissement ;

 erreur.

Design system

Documente entièrement le design system :

 palette ;

 typographie ;

 grille de 8 px ;

 espacements ;

 rayons ;

 ombres ;

 composants ;

 états interactifs ;

 animations ;

 iconographie ;

 règles de composition ;

 bonnes pratiques d'accessibilité.

L'objectif est de produire une base graphique cohérente, extensible et facilement réutilisable pour toutes les futures fonctionnalités.

Le résultat final doit donner l'impression d'un petit logiciel de bureau fiable, élégant, rassurant et durable, plutôt que d'une plateforme SaaS ou d'une démonstration de style.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8fde90c6-10fb-45b4-9ec2-5dfd65be3bdb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm �?" [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

