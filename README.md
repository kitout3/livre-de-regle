# Livre de règle

Site statique présentant le livret complet des règles du jeu.

## Fichiers

- `index.html` : contenu complet
- `styles.css` : design responsive
- `script.js` : menu mobile et impression
- `.nojekyll` : publication GitHub Pages sans traitement Jekyll

## Mise en ligne avec GitHub Pages

1. Ouvrir **Settings** dans le dépôt.
2. Aller dans **Pages**.
3. Dans **Build and deployment**, choisir **Deploy from a branch**.
4. Sélectionner la branche `main` et le dossier `/ (root)`.
5. Enregistrer.

Le site sera ensuite disponible à l'adresse :

`https://kitout3.github.io/livre-de-regle/`

## Modification

Le texte des règles se modifie directement dans `index.html`.

## Application de tirage

Ouvrir [la table des tirages](https://kitout3.github.io/livre-de-regle/tirage/) ou utiliser le bouton **Tirage des cartes** dans le livre de règles.

- Tirage des Quêtes de charité et de chasse, avec coûts, difficultés et récompenses du chapitre 8.
- Tirage des Anomalies positives et négatives du chapitre 13, avec cible actuelle, suivante ou précédente.
- Altération du chapitre 12 : une anomalie révélée par joueur, choix successifs depuis le déclencheur, et option collective contre 2 PV placés dans la chambre forte.
- Un seul paquet Anomalie pour les tirages individuels et l’Altération, tirages sans remise et reconstitution explicite des paquets.
- Noms et ordre des joueurs, journal et sauvegarde locale dans le navigateur. Aucune donnée n’est envoyée à un serveur.

### Conventions de l’application

Le livret source ne précise pas le nombre d’exemplaires des cartes. Le catalogue utilise donc un exemplaire de chaque combinaison : 48 Anomalies (16 effets × 3 cibles) et 24 Quêtes (4 ressources × 3 paliers de charité + 4 biomes × 3 difficultés de chasse). Toutes les cartes d’un paquet sont équiprobables.

Les joueurs sont saisis dans l’ordre de jeu ; les cibles relatives sont calculées depuis celui qui pioche ou choisit. Le livret actuel ne donne pas de valeur chiffrée aux paliers de la fresque : le déclenchement reste manuel. L’application ne compte ni les ressources ni les PV et n’automatise pas les pouvoirs de personnage. Le coût de l’effet collectif doit être payé sur le plateau. Les indications de Tour de garde sont reproduites telles qu’elles figurent au chapitre 8.

Les données proviennent de `index.html` à la révision `fa0b3f6062b680fd73b447af3642576746ec080a`. Les modifications ultérieures du livret ne mettent pas automatiquement le catalogue à jour.

### Structure et vérification

- `tirage/index.html` : interface de l’application.
- `tirage/style.css` : présentation responsive.
- `tirage/cartes.mjs` : catalogue explicite des cartes et référence du livret.
- `tirage/moteur.mjs` : mélange Fisher–Yates avec `crypto.getRandomValues`, pioche, Altération et validation de sauvegarde.
- `tirage/app.mjs` : interactions, affichage et sauvegarde locale.
- `tirage/moteur.test.mjs` : vérification des invariants des paquets et de l’Altération.

Aucune installation de dépendances et aucune compilation ne sont nécessaires. Servir le dépôt par HTTP (par exemple `python -m http.server 8765`), puis ouvrir `/tirage/`. Les modules JavaScript nécessitent HTTP/HTTPS.

Tests du moteur : `node --test tirage/moteur.test.mjs`.
