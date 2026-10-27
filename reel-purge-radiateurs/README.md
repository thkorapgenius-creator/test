# Reel « Comment purger ses radiateurs ? »

Vidéo verticale 1080×1920, 30 i/s, 59,5 s, H.264 avec piste son vide. Aux couleurs et à la police de la charte Soltys, sans logo.
La fin garde le bas de l'écran vide pour y poser un logo.

## Fichiers produits

| Fichier | Contenu |
|---|---|
| `renders/purger-radiateurs.mp4` | la vidéo finale |
| `renders/couverture.png` | la couverture 1080×1920 « Purger ses radiateurs en 6 étapes » |
| `renders/apercu/` | une image par scène et une planche contact (`planche.png`) |

## Modifier un texte ou une durée

Tout se trouve dans **`contenu.js`** :
- `textes` : chaque texte, sa scène (1 à 9), sa zone (`titre`, `haut`, `bas`, `liste`) et ses temps d'entrée et de sortie,
  en secondes depuis le début de la scène.
- `scenes` : le début de chaque scène. Les animations 3D suivent ces débuts.
- `duration` : la durée totale. Si vous la changez, changez aussi `data-duration` dans `index.html`.
- `couverture` : le titre de la couverture et l'instant du film pris comme image de fond.

## Relancer le rendu

Prérequis : Node 22+, ffmpeg et Playwright avec Chromium (déjà installés dans l'environnement de travail).

```bash
cd reel-purge-radiateurs
npm install && npm run setup    # une seule fois : copie three.js et la police Poppins dans assets/
npm run preview                 # une image par scène → renders/apercu/
npm run cover                   # la couverture → renders/couverture.png
npm run render                  # la vidéo → renders/purger-radiateurs.mp4 (quelques minutes)
node scripts/render.mjs --at 27.2   # une seule image à 27,2 s → renders/image-27.2.png
```

La page `index.html` suit aussi le format d'une composition HyperFrames (attributs `data-*`, événement `hf-seek`).
Le rendu livré a été fait avec `scripts/render.mjs` ; le rendu par HyperFrames n'a pas été testé.

## Ajouter le logo

La dernière scène (de 55 s à la fin) laisse vide la bande située entre 1 300 et 1 620 px de hauteur. Posez-y le logo
dans votre logiciel de montage, ou ajoutez un `<img>` dans `index.html`.

## Style

Il s'inspire des deux vidéos de référence : maquettes 3D isométriques mates qui se construisent pièce par pièce, avec
un rebond, des ombres douces et un fond uni. Chaque décor se replie en cube puis le suivant s'en déplie.
Couleurs et police de la charte Soltys : jaune `#F9B533` (numéros d'étape, soulignés, repères), bleu nuit `#303642`
(textes), sur un fond crème chaud. Police : Poppins (la Bariol Light est sous licence payante, elle n'est pas
incluse). Aucun logo : à ajouter vous-même, sur fond clair en version couleur, avec la baseline « par Logista Hometech ».
