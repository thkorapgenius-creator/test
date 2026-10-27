// scene.js — les maquettes 3D isométriques, dans le style des vidéos de référence : de petits décors mats posés sur un
// fond uni, qui se construisent pièce par pièce (chaque objet arrive avec un rebond), et qui se replient en cube pour
// passer d'un décor à l'autre. Tout est une fonction pure du temps : renderAt(t) peint l'image t.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// La police sert aussi aux textures dessinées (manomètre, pastilles) : on l'attend avant de construire la scène.
await Promise.all([document.fonts.load('700 64px Poppins'), document.fonts.load('600 50px Poppins')]);

const R = window.REEL, S = R.scenes;
const W = 1080, H = 1920;

// ---------- temps ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ioc = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const outc = k => 1 - Math.pow(1 - clamp(k), 3);
const backOut = (k, s = 1.9) => { k = clamp(k) - 1; return 1 + (s + 1) * k * k * k + s * k * k; };
const backIn = (k, s = 1.7) => { k = clamp(k); return (s + 1) * k * k * k - s * k * k; };
const seg = (t, a, b) => clamp((t - a) / (b - a));
// Échelle d'un objet sur ses intervalles de vie : il arrive avec un rebond, repart en se rétractant.
function life(t, ivs, off = 0, d = .5) {
  let s = 0;
  for (const [a, b] of ivs) {
    const x = t - (a + off);
    if (x < 0 || t > b + .35) continue;
    s = Math.max(s, backOut(x / d) * (1 - backIn((t - b) / .32)));
  }
  return s;
}

// ---------- rendu ----------
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gl'), antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 200);
const DIR = new THREE.Vector3(1, .86, 1).normalize();
const PX = 72;            // pixels par unité, zoom 1
const ANCHOR = 960;       // hauteur à l'écran du point visé par la caméra

scene.add(new THREE.HemisphereLight(0xfff4e6, 0xa8907a, 1.5));
const sun = new THREE.DirectionalLight(0xffe6c8, 2.4);
sun.position.set(7, 13, 3.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: 1, far: 40 });
sun.shadow.radius = 5;
sun.shadow.bias = -.0004;
sun.shadow.normalBias = .02;
scene.add(sun, sun.target);
const fill = new THREE.DirectionalLight(0xffe9d6, .5);
fill.position.set(-4, 5, 9);
scene.add(fill);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x5a3a22, opacity: .22 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -.6;
ground.receiveShadow = true;
scene.add(ground);

// ---------- matières et formes ----------
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, metalness: 0, ...o });
const C = {
  wall: mat(0xfaf2e8), wallTop: mat(0xfdf8f1), floor: mat(0xb88b66), glass: mat(0xb9cddd, { roughness: .2, emissive: 0x9fb6c9, emissiveIntensity: .25 }),
  frame: mat(0xfaf5ee), white: mat(0xfaf6f0), steel: mat(0xb8bdc4, { roughness: .45, metalness: .35 }), dark: mat(0x303642),
  brass: mat(0xcaa03a, { roughness: .4, metalness: .45 }), bowl: mat(0x5aa2d6, { side: THREE.DoubleSide, roughness: .6 }),
  water: mat(0x3d97df, { roughness: .15, transparent: true, opacity: .88 }), crate: mat(0xdcc7a8), crateDk: mat(0xc6ad8a),
  grass: mat(0x9fd36a), grassDk: mat(0x8cc45a), dirt: mat(0x5b3f2c), roof: mat(0xf9b533), wood: mat(0xd2ad80), tree: mat(0x47a447),
  trunk: mat(0x7a5236), bush: mat(0xe2c35a), pot: mat(0xc96f4a), leaf: mat(0x4f9e4b), red: mat(0x303642),
  blue: mat(0x3d8fd6),
};
function box(w, h, d, r, m, x = 0, y = 0, z = 0) {
  const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001));
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  return o;
}
function cyl(rt, rb, h, m, seg = 32, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  return o;
}
function ball(r, m, x, y, z) {
  const o = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), m);
  o.position.set(x, y, z);
  o.castShadow = o.receiveShadow = true;
  return o;
}
const grp = (x = 0, y = 0, z = 0, ...kids) => { const g = new THREE.Group(); g.position.set(x, y, z); kids.forEach(k => g.add(k)); return g; };
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
  return tx;
}
const softDot = canvasTex(128, 128, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});

// Tout ce qui s'anime est enregistré ici : chaque image recalcule son échelle (et sa position quand elle bouge).
const actors = [];
const actor = (obj, ivs, off = 0, base = 1, d = .5) => { scene.add(obj); const a = { obj, ivs, off, base, d }; actors.push(a); return a; };

// ---------- la pièce ----------
const ROOM = [[S[0] + .45, S[6] + .35], [S[7] + .75, 1e9]];
actor(grp(0, 0, 0, box(6, .36, 6, .06, C.floor, 0, -.18, 0)), ROOM, 0, 1, .45);
actor(grp(-3, 0, 0, box(.26, 4.2, 6.26, .04, C.wall, 0, 2.1, -.13), box(.3, .1, 6.3, .04, C.wallTop, 0, 4.22, -.13)), ROOM, .1);
actor(grp(0, 0, -3, box(6, 4.2, .26, .04, C.wall, 0, 2.1, 0), box(6.1, .1, .3, .04, C.wallTop, 0, 4.22, 0)), ROOM, .18);

// fenêtre 3 × 3 carreaux sur le mur de gauche, comme dans la référence
{
  const g = grp(-2.86, 2.35, -.35);
  g.add(box(.05, 2.5, 2.7, .02, C.glass, 0, 0, 0));
  for (const z of [-1.35, -.45, .45, 1.35]) g.add(box(.12, 2.6, .1, .03, C.frame, .03, 0, z));
  for (const y of [-1.25, -.42, .42, 1.25]) g.add(box(.12, .1, 2.8, .03, C.frame, .03, y, 0));
  g.add(box(.3, .08, 2.9, .03, C.frame, .12, -1.32, 0));
  actor(g, ROOM, .3);
}

// radiateur : colonnes, robinet thermostatique en bas à gauche, vis de purge en haut à droite (à l'opposé)
function makeRadiator() {
  const m = mat(0xf6f5f1);
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) g.add(box(.24, 1.45, .32, .08, m, -1.2 + i * .3, 1.2, 0));
  g.add(box(2.64, .12, .2, .05, m, 0, 1.83, 0), box(2.64, .12, .2, .05, m, 0, .57, 0));
  g.add(cyl(.05, .05, .5, C.steel, 16, -1.0, .25, -.06), cyl(.05, .05, .5, C.steel, 16, 1.0, .25, -.06));
  // robinet thermostatique
  const pipe = cyl(.05, .05, .3, C.steel, 16, -1.45, .62, 0); pipe.rotation.z = Math.PI / 2; g.add(pipe);
  g.add(cyl(.05, .05, .62, C.steel, 16, -1.6, .31, 0), cyl(.085, .085, .16, C.steel, 24, -1.6, .62, 0));
  const head = grp(-1.6, .7, 0);
  head.add(cyl(.13, .13, .3, C.white, 32, 0, .15, 0), cyl(.135, .135, .04, C.dark, 32, 0, .08, 0), cyl(.1, .13, .05, C.white, 32, 0, .32, 0));
  head.add(box(.06, .22, .05, .02, C.red, 0, .16, .13));
  g.add(head);
  // vis de purge
  const screw = cyl(.06, .06, .1, C.brass, 6, 1.37, 1.83, 0); screw.rotation.z = Math.PI / 2; g.add(screw);
  return { g, m, head, screw };
}
const rad = makeRadiator();
rad.g.position.set(.5, 0, -2.6);
actor(rad.g, ROOM, .42);
const SCREW = new THREE.Vector3(.5 + 1.43, 1.83, -2.6);   // bout de la vis, en coordonnées du monde
const VALVE = new THREE.Vector3(.5 - 1.6, .86, -2.6);

// vagues de chaleur au-dessus du radiateur
const heat = [-.75, 0, .75].map((x, i) => {
  const pts = []; for (let k = 0; k <= 12; k++) pts.push(new THREE.Vector3(Math.sin(k / 12 * Math.PI * 2) * .09, k / 12 * .75, 0));
  const m = mat(0xf08a5d, { transparent: true, opacity: 0, depthWrite: false, emissive: 0xf08a5d, emissiveIntensity: .5 });
  const o = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, .035, 8), m);
  scene.add(o);
  return { o, m, x: .5 + x, i };
});
function hot(t) {
  if (t < S[2] + 1.6) return 1;
  if (t < S[8]) return 1 - outc(seg(t, S[2] + 1.6, S[2] + 4.0));
  return ioc(seg(t, S[8] + .2, S[8] + 1.3));
}

// chaudière murale : écran (flamme / soleil = position été), manomètre, robinet de remplissage dessous
const flameTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#303642'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff9a3c'; g.beginPath(); g.moveTo(128, 18); g.bezierCurveTo(170, 60, 160, 110, 128, 112); g.bezierCurveTo(96, 110, 86, 60, 128, 18); g.fill();
  g.fillStyle = '#ffd36a'; g.beginPath(); g.moveTo(128, 60); g.bezierCurveTo(146, 82, 142, 106, 128, 106); g.bezierCurveTo(114, 106, 110, 82, 128, 60); g.fill();
});
const sunTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#303642'; g.fillRect(0, 0, w, h);
  g.strokeStyle = g.fillStyle = '#ffd24a'; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.arc(128, 64, 24, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(128 + Math.cos(a) * 36, 64 + Math.sin(a) * 36); g.lineTo(128 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); g.stroke(); }
});
const gaugeTex = canvasTex(512, 512, (g, w) => {
  const c = w / 2;
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
  const ang = v => (135 + v / 4 * 270) * Math.PI / 180;   // 0 bar en bas à gauche, 4 bars en bas à droite (sens horaire)
  const arc = (a, b, col) => { g.strokeStyle = col; g.lineWidth = 46; g.beginPath(); g.arc(c, c, c - 60, ang(a), ang(b)); g.stroke(); };
  arc(0, 1, '#e8806f'); arc(1, 1.5, '#3fae5a'); arc(1.5, 2, '#9ad27b'); arc(2, 4, '#e3e5e8');
  g.fillStyle = '#303642'; g.font = '700 64px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let v = 0; v <= 4; v++) g.fillText(String(v), c + Math.cos(ang(v)) * (c - 140), c + Math.sin(ang(v)) * (c - 140));
  g.font = '700 46px Poppins, sans-serif'; g.fillText('bar', c, c + 150);
});
const boiler = grp(-1.85, 3.0, -2.5);
{
  boiler.add(box(1.3, 1.8, .7, .1, C.white, 0, 0, 0), box(1.3, .16, .72, .06, C.dark, 0, -.8, 0));
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(.62, .31), new THREE.MeshBasicMaterial({ map: flameTex, toneMapped: false }));
  disp.position.set(0, .45, .352); boiler.add(disp); boiler.userData.disp = disp;
  const face = new THREE.Mesh(new THREE.CircleGeometry(.3, 48), new THREE.MeshStandardMaterial({ map: gaugeTex, roughness: .5 }));
  face.position.set(0, -.25, .356); boiler.add(face);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(.31, .035, 12, 48), C.steel); bezel.position.set(0, -.25, .355); boiler.add(bezel);
  const needle = grp(0, -.25, .37, box(.03, .22, .012, .006, C.red, 0, .09, 0)); boiler.add(needle); boiler.userData.needle = needle;
  for (const x of [-.4, -.15, .15, .4]) boiler.add(cyl(.045, .045, 2.15, C.steel, 16, x, -1.95, -.1));
  const knob = grp(.15, -1.25, .03, cyl(.075, .075, .1, C.blue, 24, 0, 0, 0), box(.26, .06, .06, .02, C.blue, 0, 0, .05));
  knob.children[0].rotation.x = Math.PI / 2;
  boiler.add(knob); boiler.userData.knob = knob;
}
actor(boiler, ROOM, .52);
const ang3 = v => -(135 + v / 4 * 270 - 270) * Math.PI / 180;   // même graduation, en rotation 3D (aiguille au repos = vers le haut)

// tapis à chevrons et plante (dernière scène : la pièce redevient confortable)
const rugTex = canvasTex(512, 320, (g, w, h) => {
  g.fillStyle = '#f2eee6'; g.fillRect(0, 0, w, h);
  const cols = ['#86b6c9', '#c9a35e', '#f2eee6', '#9fc4d1', '#b98f52', '#f2eee6'];
  for (let r = -2; r < 18; r++) {
    g.strokeStyle = cols[(r + 12) % cols.length]; g.lineWidth = 16; g.beginPath();
    for (let x = 0; x <= w; x += 40) g.lineTo(x, r * 22 + ((x / 40) % 2 ? 16 : 0));
    g.stroke();
  }
});
actor(grp(.9, 0, .7, box(3.0, .05, 2.0, .02, mat(0xffffff, { map: rugTex }), 0, .025, 0)), [[S[8] + .5, 1e9]]);
actor(grp(-2.2, 0, 1.9,
  cyl(.3, .22, .5, C.pot, 24, 0, .25, 0),
  ball(.42, C.leaf, 0, .85, 0),
  ball(.3, C.leaf, .2, 1.25, .1),
), [[S[8] + .8, 1e9]]);

// ---------- le matériel ----------
const ITEMS_END = S[6] + .35;
const key = grp();
key.add(box(.14, .14, .14, .02, C.brass, .07, 0, 0));
{ const sh = cyl(.04, .04, .3, C.brass, 16, .27, 0, 0); sh.rotation.z = Math.PI / 2; key.add(sh); }
key.add(box(.07, .46, .3, .05, C.brass, .44, 0, 0));
// la clé quitte le cadre pendant le gros plan de l'étape 2, puis revient se poser sur la vis à l'étape 3
const keyA = actor(key, [[S[1] + .6, S[3] + .2], [S[4] + .25, ITEMS_END]]);

const bowl = new THREE.Group();
{
  const prof = [[0, 0], [.32, 0], [.38, .03], [.46, .27], [.5, .3], [.47, .31], [.43, .29], [.36, .07], [0, .06]].map(p => new THREE.Vector2(p[0], p[1]));
  const m = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), C.bowl); m.castShadow = m.receiveShadow = true; bowl.add(m);
  const wl = new THREE.Mesh(new THREE.CircleGeometry(.4, 40), C.water); wl.rotation.x = -Math.PI / 2; wl.visible = false; bowl.add(wl); bowl.userData.water = wl;
}
const bowlA = actor(bowl, [[S[1] + 2.1, ITEMS_END]]);

const towelTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f1e7d4'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#7fb2c9'; for (const y of [30, 70, 186, 226]) g.fillRect(0, y, w, 16);
});
const towel = grp(0, 0, 0, box(1.0, .07, .9, .03, mat(0xffffff, { map: towelTex }), 0, .035, 0));
const towelA = actor(towel, [[S[1] + 3.6, ITEMS_END]]);

// flèche « sens inverse des aiguilles d'une montre », vue face à la vis
const ccwTex = canvasTex(256, 256, (g, w) => {
  const c = w / 2; g.strokeStyle = '#f2a516'; g.fillStyle = '#f2a516'; g.lineWidth = 22; g.lineCap = 'round';
  g.beginPath(); g.arc(c, c, 86, -Math.PI * .15, Math.PI * 1.25); g.stroke();
  const a = -Math.PI * .15, x = c + Math.cos(a) * 86, y = c + Math.sin(a) * 86;
  g.beginPath(); g.moveTo(x + 34, y + 8); g.lineTo(x - 26, y - 4); g.lineTo(x + 6, y - 46); g.closePath(); g.fill();
});
const ccw = new THREE.Sprite(new THREE.SpriteMaterial({ map: ccwTex, transparent: true, depthTest: false }));
scene.add(ccw);

// repère pulsant (vis de purge, robinet)
const ring = new THREE.Mesh(new THREE.TorusGeometry(.2, .03, 12, 48), new THREE.MeshBasicMaterial({ color: 0xf2a516, transparent: true, depthTest: false }));
ring.renderOrder = 5; scene.add(ring);

// air et eau
const puffs = Array.from({ length: 14 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, transparent: true, depthWrite: false })); scene.add(s); return s; });
const dropG = new THREE.SphereGeometry(.055, 14, 10);
const drops = Array.from({ length: 70 }, () => { const m = new THREE.Mesh(dropG, C.water); m.castShadow = true; scene.add(m); return m; });
const bubbles = Array.from({ length: 12 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot, transparent: true, depthWrite: false })); scene.add(s); return s; });

// ---------- la maison (étape 5) ----------
const HOUSE = [[S[6] + 1.0, S[7]]];
actor(grp(0, 0, 0, box(6, .3, 6, .06, C.grass, 0, -.15, 0), box(6, .24, 6, .05, C.dirt, 0, -.42, 0)), HOUSE, 0, 1, .45);
actor(grp(-.1, 0, -.4,
  box(3.6, .12, 2.8, .03, C.wood, 0, .06, 0),
  box(3.6, 3.4, .18, .03, C.white, 0, 1.7, -1.4), box(.18, 3.4, 2.8, .03, C.white, -1.8, 1.7, 0),
  box(3.6, .14, 2.8, .03, C.wood, 0, 1.72, 0),
), HOUSE, .12);
{
  // toit : le versant arrière et le pignon de gauche (maison en coupe, comme une maison de poupée)
  const roof = grp(-.1, 3.4, -.4);
  const slab = box(4.0, .14, 1.9, .04, C.roof, 0, .55, -.85); slab.rotation.x = .62; roof.add(slab);
  const tri = new THREE.Shape([new THREE.Vector2(-1.4, 0), new THREE.Vector2(1.4, 0), new THREE.Vector2(.2, 1.15)]);
  const gab = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: .18, bevelEnabled: false }), C.white);
  gab.rotation.y = Math.PI / 2; gab.position.set(-1.89, 0, 0); gab.castShadow = true; roof.add(gab);
  actor(roof, HOUSE, .3);
}
const hb = grp(-1.62, 1.0, -.9, box(.3, .7, .55, .05, C.white, 0, 0, 0), box(.32, .1, .57, .03, C.dark, 0, -.3, 0));
actor(hb, HOUSE, .38);
const hrads = [[-.75, .12, -1.55], [.85, .12, -1.55], [.1, 1.79, -1.55]].map(([x, y, z], i) => {
  const r = makeRadiator(); r.g.scale.setScalar(.42);
  const g = grp(x, y, z, r.g);
  const a = actor(g, HOUSE, .45 + i * .06);
  return { r, a };
});
for (const [x, z, s] of [[2.3, -2.2, 1.1], [2.55, -.9, .8], [2.4, 2.3, .9], [-2.4, 2.3, 1.0], [1.0, 2.4, .7]]) {
  actor(grp(x, 0, z, cyl(.06, .08, .3, C.trunk, 10, 0, .15, 0), cyl(0, .42 * s, 1.5 * s, C.tree, 16, 0, .3 + .75 * s, 0)), HOUSE, .5 + Math.abs(x + z) * .03);
}
actor(grp(-1.0, 0, 2.2, ball(.38, C.bush, 0, .34, 0)), HOUSE, .6);
const badgeTex = n => canvasTex(160, 160, (g, w) => {
  g.fillStyle = '#f9b533'; g.beginPath(); g.arc(80, 80, 74, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#303642'; g.font = '700 96px Poppins, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 80, 86);
});
const badges = hrads.map((h, i) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTex(i + 1), transparent: true, depthTest: false }));
  s.renderOrder = 6; scene.add(s);
  return { s, at: S[6] + 2.6 + i * 1.1, pos: h.a.obj.position.clone().add(new THREE.Vector3(0, 1.25, .2)) };
});

// ---------- le cube : chaque décor se replie en cube puis le suivant s'en déplie ----------
const cube = grp(0, 0, 0, box(1.7, 1.7, 1.7, .1, C.crate, 0, .85, 0), box(1.72, .06, 1.72, .02, C.crateDk, 0, 1.7, 0), box(.06, .02, 1.74, .01, C.crateDk, 0, 1.72, 0));
const CUBE = [[S[0], S[0] + .5], [S[6] + .25, S[6] + 1.05], [S[7] - .05, S[7] + .75]];
actor(cube, CUBE, 0, 1, .4);

// ---------- caméra ----------
const CAM0 = { zoom: 1, tx: .2, ty: 1.55, tz: .2 };
const MOVES = [
  [S[1], S[1] + .6, { zoom: .98, tx: .5, ty: .9, tz: .5 }],                     // le matériel au premier plan
  [S[2], S[2] + .6, CAM0],
  [S[3], S[3] + .9, { zoom: 1.6, tx: 1.93, ty: 2.25, tz: -2.6 }],               // gros plan sur la vis de purge
  [S[6], S[6] + .6, CAM0],
  [S[6] + 1.0, S[6] + 1.8, { zoom: 1.3, tx: .1, ty: 1.4, tz: .1 }],              // la maison, un peu plus près
  [S[7], S[7] + .6, CAM0],
  [S[7] + 1.1, S[7] + 1.9, { zoom: 2.35, tx: -1.55, ty: 2.55, tz: -2.2 }],      // gros plan sur la chaudière
  [S[8], S[8] + .8, CAM0],
];
function camAt(t) {
  let cur = CAM0;
  for (const [a, b, to] of MOVES) {
    if (t >= b) { cur = to; continue; }
    if (t > a) { const k = ioc((t - a) / (b - a)); cur = Object.fromEntries(Object.keys(to).map(n => [n, lerp(cur[n], to[n], k)])); }
    break;
  }
  return cur;
}
function placeCamera(t, cam) {
  const c = cam || camAt(t), u = PX * c.zoom;
  const tg = new THREE.Vector3(c.tx, c.ty, c.tz);
  camera.position.copy(tg).addScaledVector(DIR, 40);
  camera.lookAt(tg);
  camera.left = -W / 2 / u; camera.right = W / 2 / u; camera.top = ANCHOR / u; camera.bottom = -(H - ANCHOR) / u;
  camera.updateProjectionMatrix();
}

// ---------- jauge agrandie (étape 6) ----------
const gaugeEl = document.getElementById('gauge');
{
  const ang = v => (135 + v / 4 * 270) * Math.PI / 180, c = 200, r = 150;
  const pt = (v, rr) => `${(c + Math.cos(ang(v)) * rr).toFixed(1)} ${(c + Math.sin(ang(v)) * rr).toFixed(1)}`;
  const arc = (a, b, col) => `<path d="M ${pt(a, r)} A ${r} ${r} 0 ${(b - a) / 4 * 270 > 180 ? 1 : 0} 1 ${pt(b, r)}" stroke="${col}" stroke-width="30" fill="none"/>`;
  let s = `<circle cx="200" cy="200" r="196" fill="#fff" stroke="#b8bdc4" stroke-width="8"/>`;
  s += arc(0, 1, '#e8806f') + arc(1, 1.5, '#3fae5a') + arc(1.5, 2, '#9ad27b') + arc(2, 4, '#e3e5e8');
  for (let v = 0; v <= 4; v++) s += `<text x="${pt(v, 104).split(' ')[0]}" y="${pt(v, 104).split(' ')[1]}" font-family="Poppins" font-weight="700" font-size="40" text-anchor="middle" dominant-baseline="central" fill="#303642">${v}</text>`;
  s += `<text x="200" y="296" font-family="Poppins" font-weight="700" font-size="34" text-anchor="middle" fill="#303642">bar</text>`;
  s += `<g id="gneedle"><path d="M 192 200 L 200 70 L 208 200 Z" fill="#303642"/></g><circle cx="200" cy="200" r="18" fill="#303642"/>`;
  gaugeEl.innerHTML = s;
}
const gneedle = gaugeEl.querySelector('#gneedle');
function pressure(t) {
  const a = S[7];
  if (t < a + 1.7) return 0;
  if (t < a + 5.6) return lerp(0, 1.3, backOut(seg(t, a + 1.7, a + 2.6), 1.2));
  if (t < a + 6.6) return lerp(1.3, .6, ioc(seg(t, a + 5.6, a + 6.0)));
  return lerp(.6, 1.3, ioc(seg(t, a + 6.6, a + 8.0)));
}

// ---------- une image ----------
const tmpQ = new THREE.Quaternion(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), qR = new THREE.Quaternion();
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);

function renderAt(t, opts = {}) {
  placeCamera(t, opts.cam);

  for (const a of actors) {
    const s = life(t, a.ivs, a.off, a.d);
    a.obj.visible = s > .002;
    a.obj.scale.setScalar(Math.max(s, .002) * a.base);
  }

  // radiateur : chaud → froid → chaud
  const h = hot(t);
  rad.m.color.set(0xf6f5f1).lerp(new THREE.Color(0xf5b49c), h * .75);
  const roomS = life(t, ROOM, .42);
  for (const w of heat) {
    const ph = ((t * .55 + w.i / 3) % 1 + 1) % 1;
    w.o.position.set(w.x, 2.05 + ph * .8, -2.5);
    w.m.opacity = h * Math.sin(Math.PI * ph) * .8 * clamp(roomS);
    w.o.visible = w.m.opacity > .01;
  }

  // chaudière : écran flamme / soleil, manomètre, robinet de remplissage
  const summer = t >= S[2] + .7 && t < S[8] + .2;
  const disp = boiler.userData.disp;
  disp.material.map = summer ? sunTex : flameTex;
  const flip = Math.min(Math.abs(t - (S[2] + .7)), Math.abs(t - (S[8] + .2)));
  disp.scale.setScalar(flip < .35 ? lerp(.6, 1, backOut(flip / .35)) : 1);
  boiler.userData.needle.rotation.z = ang3(t < S[7] ? 1.3 : pressure(t));
  boiler.userData.knob.rotation.z = -Math.PI / 2 * ioc(seg(t, S[7] + 6.4, S[7] + 7.4));

  // robinet thermostatique ouvert au maximum (étape 1)
  rad.head.rotation.y = -Math.PI * 1.5 * ioc(seg(t, S[2] + 5.2, S[2] + 6.6));

  // matériel : posé au premier plan, puis amené sous la vis
  const kS = keyA.obj.scale.x, bS = bowlA.obj.scale.x, tS = towelA.obj.scale.x;
  const restK = new THREE.Vector3(.0, .0, 2.4), restB = new THREE.Vector3(1.25, 0, 1.25), restT = new THREE.Vector3(2.4, 0, 0);
  const dropIn = a => (1 - outc(seg(t, a, a + .45))) * 1.6;    // chute depuis le haut quand l'objet apparaît
  // serviette puis bassine glissent sous la vis (étape 2)
  const mT = ioc(seg(t, S[3] + .5, S[3] + 1.3)), mB = ioc(seg(t, S[3] + .8, S[3] + 1.6));
  const underT = new THREE.Vector3(2.2, 0, -2.2), underB = new THREE.Vector3(2.25, .07, -2.3);
  towelA.obj.position.copy(restT).lerp(underT, mT).add(new THREE.Vector3(0, Math.sin(Math.PI * mT) * .6 + dropIn(S[1] + 3.6), 0));
  towelA.obj.scale.setScalar(tS * lerp(1.35, 1, mT));
  bowlA.obj.position.copy(restB).lerp(underB, mB).add(new THREE.Vector3(0, Math.sin(Math.PI * mB) * .9 + dropIn(S[1] + 2.1), 0));
  bowlA.obj.scale.setScalar(bS * lerp(1.5, 1, mB));
  // clé : posée au sol, puis engagée sur la vis, tournée d'un demi-tour à gauche, puis refermée
  const mK = ioc(seg(t, S[4] + .4, S[4] + 1.2));
  const restScale = 2.0, atScale = 1.15;
  const keyRestPos = t < S[4]
    ? restK.clone().add(new THREE.Vector3(0, .23 * restScale + dropIn(S[1] + .6), 0))
    : SCREW.clone().add(new THREE.Vector3(.9, .9, .9));
  keyA.obj.position.copy(keyRestPos).lerp(SCREW, mK).add(new THREE.Vector3(0, Math.sin(Math.PI * mK) * .5, 0));
  qA.setFromAxisAngle(Y, Math.PI * .75); qB.identity();
  const turn = Math.PI * .5 * (ioc(seg(t, S[4] + 1.4, S[4] + 2.0)) + ioc(seg(t, S[4] + 2.3, S[4] + 2.9)))
             - Math.PI * ioc(seg(t, S[5] + 3.4, S[5] + 4.4));
  qR.setFromAxisAngle(X, turn);
  keyA.obj.quaternion.copy(qA).slerp(qB, mK).multiply(qR);
  keyA.obj.scale.setScalar(kS / 1 * lerp(restScale, atScale, mK));

  // flèche de rotation
  const ccwOn = t > S[4] + 1.2 && t < S[4] + 3.3;
  ccw.visible = ccwOn;
  if (ccwOn) {
    const k = backOut(seg(t, S[4] + 1.2, S[4] + 1.6)) * (1 - seg(t, S[4] + 3.0, S[4] + 3.3));
    ccw.position.copy(SCREW).add(new THREE.Vector3(.55, .1, .35));
    ccw.scale.setScalar(.75 * k);
    ccw.material.rotation = (t - S[4]) * 1.4;
    ccw.material.opacity = clamp(k);
  }

  // repère pulsant : robinet (étape 1), vis de purge (étape 2)
  const ringAt = (a, b, p, axis) => {
    if (t < a || t > b) return false;
    const ph = ((t - a) / .9) % 1;
    ring.position.copy(p);
    ring.rotation.set(axis === 'x' ? 0 : Math.PI / 2, axis === 'x' ? Math.PI / 2 : 0, 0);
    ring.scale.setScalar(1 + ph * .9);
    ring.material.opacity = (1 - ph) * clamp((t - a) / .2) * clamp((b - t) / .2);
    return true;
  };
  ring.visible = ringAt(S[2] + 4.8, S[2] + 8.2, VALVE.clone().add(new THREE.Vector3(0, .02, .05)), 'y')
              || ringAt(S[3] + 2.3, S[3] + 5.8, SCREW, 'x');

  // l'air s'échappe en petites bouffées
  puffs.forEach((p, i) => {
    const a = S[4] + 2.7 + i * .25, x = t - a;
    p.visible = x > 0 && x < 1.1 && t < S[4] + 6.4;
    if (!p.visible) return;
    const k = x / 1.1;
    p.position.copy(SCREW).add(new THREE.Vector3(.15 + k * 1.1, k * .7 + Math.sin(i * 2.1) * .12 * k, Math.cos(i * 1.7) * .25 * k));
    p.scale.setScalar(.12 + k * .45);
    p.material.opacity = (1 - k) * .9;
  });

  // l'eau : des gouttes avec des bulles, puis un jet continu, qui s'arrête quand on referme
  const w0 = S[5] + .4, wJet = S[5] + 1.8, wEnd = S[5] + 3.7;
  drops.forEach((d, i) => {
    const jet = i >= 20;
    const a = jet ? wJet + (i - 20) * .038 : w0 + i * .07 + (i % 3) * .03;
    const x = t - a;
    const fall = .62;
    d.visible = x > 0 && x < fall && a < wEnd && !(jet === false && a > wJet);
    if (!d.visible) return;
    d.position.copy(SCREW).add(new THREE.Vector3(.08 + x * .62, -4.4 * x * x, .02));
    d.scale.setScalar(jet ? 1.15 : .9);
  });
  bubbles.forEach((b, i) => {
    const a = w0 + .05 + i * .11, x = t - a;
    b.visible = x > 0 && x < .5 && a < wJet;
    if (!b.visible) return;
    b.position.copy(SCREW).add(new THREE.Vector3(.12 + x * .5, -3.8 * x * x + .05, .05));
    b.scale.setScalar(.12);
    b.material.opacity = .95;
  });
  const wl = bowl.userData.water;
  const lvl = seg(t, w0 + .5, wEnd + .4);
  wl.visible = lvl > 0 && t < ITEMS_END;
  wl.position.y = .07 + lvl * .14;
  wl.scale.setScalar(.82 + lvl * .14);

  // maison : les radiateurs se font l'un après l'autre (pastilles 1, 2, 3)
  badges.forEach((b, i) => {
    const s = life(t, [[b.at, S[7]]], 0, .45);
    b.s.visible = s > .01;
    b.s.position.copy(b.pos);
    b.s.scale.setScalar(.85 * s);
    hrads[i].r.m.color.set(0xf6f5f1).lerp(new THREE.Color(0xf5b49c), .75 * seg(t, b.at + .2, b.at + .8));
  });

  // jauge agrandie
  const gs = life(t, [[S[7] + 1.6, S[7] + 9.55]], 0, .5);
  gaugeEl.style.display = gs > .01 && !opts.noOverlay ? 'block' : 'none';
  gaugeEl.style.transform = `translate(620px, 760px) scale(${(gs * .9).toFixed(4)})`;
  gneedle.setAttribute('transform', `rotate(${((135 + pressure(t) / 4 * 270) - 270).toFixed(2)} 200 200)`);

  renderer.render(scene, camera);
  window.renderText && window.renderText(t, !!opts.noText);
}
window.renderAt = renderAt;

// Couverture : une image du film, sans les textes du film, avec le titre de couverture.
window.renderCover = function () {
  // cadrage propre à la couverture : la pièce entière, sous le titre
  renderAt(R.couverture.instant, { noText: true, noOverlay: true, cam: { zoom: 1.1, tx: .5, ty: 4.0, tz: .5 } });
  const cv = document.getElementById('cover');
  cv.style.display = 'block';
  cv.querySelector('.ct').textContent = R.couverture.texte;
};

document.fonts.ready.then(() => {
  renderAt(window.__seekTime || 0);
  window.__reelReady();
});
