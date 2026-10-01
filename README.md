# Portfolio — Marketing, Communication & SEO

Site portfolio statique (HTML / CSS / JavaScript, sans aucune dépendance) pour présenter :

- **le profil** : présentation, chiffres clés, compétences et outils ;
- **les marques et les canaux** : Soltys, Nevyo, Airelys, Hygelys, les agences Logista Hybride et Logista Hometech ; 9 sites web, les pages Facebook, LinkedIn et YouTube ;
- **les réalisations graphiques** : réseaux sociaux, print, vidéo, avec des filtres et une visionneuse ;
- **les résultats SEO** : chiffres par site et graphique du trafic organique animé.

## Animations

Préchargement avec compteur · curseur personnalisé · titres révélés ligne par ligne · formes en parallaxe ·
marquees dont la vitesse suit le scroll · texte révélé mot à mot · fond qui change de couleur selon la section ·
aperçu flottant au survol des marques · cartes inclinées en 3D · boutons magnétiques · compteurs · courbe SEO dessinée.
Les animations sont désactivées automatiquement si le visiteur a activé « Réduire les animations ».

## Personnaliser le contenu

**Tout le texte se modifie dans un seul fichier : [`js/data.js`](js/data.js).**

1. **Profil** : remplacez `firstName`, `lastName`, `email`, `linkedin`. Pour la photo, ajoutez-la dans `assets/` puis indiquez `photo: "assets/photo.jpg"`.
2. **Réalisations** : déposez vos visuels dans `assets/realisations/` et renseignez `image: "assets/realisations/mon-visuel.jpg"`.
   Sans image, le site affiche une maquette aux couleurs de la marque.
   - `category` : `"social"`, `"print"` ou `"video"`
   - `format` : `"square"` (1:1), `"portrait"` (3:4), `"story"` (vertical) ou `"landscape"` (16:9)
3. **SEO** : ⚠️ les chiffres actuels sont **des exemples**. Remplacez-les par vos vraies données (Search Console / GA4) :
   noms de domaine, `metrics` et `traffic` (12 valeurs mensuelles, de la plus ancienne à la plus récente).
4. **Réseaux sociaux** : remplacez les `url: "#"` par les liens de vos pages.
5. **Couleurs des marques** : modifiez `color` dans `brands` pour reprendre les chartes graphiques réelles.

## Voir le site en local

Ouvrez `index.html` dans un navigateur, ou lancez un petit serveur :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Mettre en ligne

Le site est 100 % statique : il se publie tel quel sur **GitHub Pages** (Settings → Pages → branche à publier),
Netlify ou Vercel (glisser-déposer du dossier), ou n'importe quel hébergeur.

## Structure

```
index.html        Structure de la page
css/style.css     Styles et animations CSS
js/data.js        ← Contenu à personnaliser
js/main.js        Rendu du contenu et animations
assets/           Photo et visuels
```
