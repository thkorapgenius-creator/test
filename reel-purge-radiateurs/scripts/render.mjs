// render.mjs — rendu local avec Chromium (Playwright) et ffmpeg, sans réseau.
//   node scripts/render.mjs --preview   une image par scène + planche contact  → renders/apercu/
//   node scripts/render.mjs --cover     la couverture 1080×1920                → renders/couverture.png
//   node scripts/render.mjs             la vidéo complète, H.264 + piste son vide → renders/purger-radiateurs.mp4
//   options : --at 12.5 (une seule image à cet instant), --fps 30
// Rendu de secours équivalent à `npx hyperframes render` : la page expose renderAt(t), image par image.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'renders');
const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
page.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); });
page.on('pageerror', e => console.error('[page]', e.message));
await page.goto(url);
await page.waitForFunction(() => window.__hf && window.__hf.buildReady.reel && window.renderAt, null, { timeout: 60000 });
await page.evaluate(() => window.__hf.buildReady.reel);
const REEL = await page.evaluate(() => window.REEL);
fs.mkdirSync(OUT, { recursive: true });

const shot = async (t, file) => {
  await page.evaluate(tt => window.renderAt(tt), t);
  return page.screenshot({ path: file, type: 'png' });
};

try {
  if (opt('--at')) {
    const t = Number(opt('--at'));
    await shot(t, path.join(OUT, `image-${t}.png`));
    console.log(`ok: renders/image-${t}.png`);
  } else if (flag('--cover')) {
    await page.evaluate(() => window.renderCover());
    await page.screenshot({ path: path.join(OUT, 'couverture.png'), type: 'png' });
    console.log('ok: renders/couverture.png');
  } else if (flag('--preview')) {
    // une image par scène, au moment où son texte principal est entièrement affiché
    const dir = path.join(OUT, 'apercu'); fs.mkdirSync(dir, { recursive: true });
    const S = REEL.scenes, ends = [...S.slice(1), REEL.duration];
    const picks = opt('--times') ? opt('--times').split(',').map(Number) : null;
    const times = picks || S.map((a, i) => {
      const subs = REEL.textes.filter(x => x.scene === i + 1);
      const last = subs[subs.length - 1];
      return Math.min(ends[i] - .2, a + Math.max(...subs.map(x => x.in)) + (last.lignes ? 4.4 : 1.6));
    });
    const files = [];
    for (const [i, t] of times.entries()) {
      const f = path.join(dir, `scene-${String(i + 1).padStart(2, '0')}.png`);
      await shot(t, f); files.push(f);
    }
    const inputs = files.flatMap(f => ['-i', f]);
    const n = files.length, cols = Math.min(5, n), rows = Math.ceil(n / cols);
    const lay = files.map((_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|');
    execFileSync('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex',
      files.map((_, i) => `[${i}:v]scale=360:640[v${i}]`).join(';') + ';' + files.map((_, i) => `[v${i}]`).join('') + `xstack=inputs=${n}:layout=${lay}:fill=white`,
      '-frames:v', '1', path.join(dir, 'planche.png')]);
    console.log('ok: renders/apercu/ (' + times.map(t => t.toFixed(1) + ' s').join(', ') + ')');
  } else {
    const fps = Number(opt('--fps', REEL.fps)), n = Math.round(REEL.duration * fps);
    const file = path.join(OUT, 'purger-radiateurs.mp4');
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
      '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-shortest',
      '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(fps),
      '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate(tt => window.renderAt(tt), i / fps);
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`image ${i}/${n} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', c => c === 0 ? r() : j(new Error('ffmpeg ' + c))));
    console.log('ok: renders/purger-radiateurs.mp4');
  }
} finally {
  await browser.close();
  server.close();
}
