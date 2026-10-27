// Copie les dépendances du navigateur (three.js, police Nunito) dans assets/, pour que la page n'ait besoin d'aucun réseau.
import fs from 'node:fs';
import path from 'node:path';
const copy = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
copy('node_modules/three/build/three.module.min.js', 'assets/vendor/three.module.js');
copy('node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js', 'assets/vendor/addons/geometries/RoundedBoxGeometry.js');
for (const w of [700, 800]) copy(`node_modules/@fontsource/nunito/files/nunito-latin-${w}-normal.woff2`, `assets/fonts/nunito-${w}.woff2`);
console.log('ok: assets/vendor, assets/fonts');
