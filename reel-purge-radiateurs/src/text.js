// text.js — les textes à l'écran. Tout est fonction du temps t : aucune animation CSS, pour que chaque image soit
// identique quel que soit l'ordre dans lequel le moteur de rendu les demande.
(function () {
  const R = window.REEL;
  const root = document.getElementById('txt');

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const backOut = (k, s = 1.6) => { k = clamp(k) - 1; return 1 + (s + 1) * k * k * k + s * k * k; };
  const cubicOut = k => 1 - Math.pow(1 - clamp(k), 3);

  // Coupe un texte en mots animés ; « 1. » en tête d'étape prend la couleur d'accent, le texte reste identique.
  function words(el, text) {
    const parts = text.split(' ');
    const out = [];
    parts.forEach((p, i) => {
      const s = document.createElement('span');
      s.className = 'w' + (i === 0 && /^\d\.$/.test(p) ? ' num' : '');
      s.textContent = p;
      el.appendChild(s);
      if (i < parts.length - 1) el.appendChild(document.createTextNode(' '));
      out.push(s);
    });
    return out;
  }

  const blocks = R.textes.map(d => {
    const t0 = R.scenes[d.scene - 1];
    const el = document.createElement('div');
    el.className = 'blk ' + d.zone;
    root.appendChild(el);
    const b = { d, el, a: t0 + d.in, z: t0 + d.out, ws: [], rows: [] };
    if (d.zone === 'titre' || d.zone === 'haut') b.ws = words(el, d.texte);
    else {
      const card = document.createElement('div');
      card.className = 'card';
      el.appendChild(card);
      b.card = card;
      if (d.zone === 'bas') b.ws = words(card, d.texte);
      else d.lignes.forEach(l => {
        const row = document.createElement('div');
        row.className = 'row';
        const dot = document.createElement('span'); dot.className = 'dot';
        const tx = document.createElement('span');
        row.appendChild(dot); row.appendChild(tx);
        card.appendChild(row);
        b.rows.push({ el: row, a: t0 + l.in, ws: words(tx, l.texte) });
      });
    }
    return b;
  });

  // Entrée : chaque mot monte et se pose avec un léger rebond (comme les objets des maquettes). Sortie : fondu vers le haut.
  function wordAt(w, t, a, i, big) {
    const x = t - (a + i * 0.035);
    const k = backOut(x / 0.5, 1.4);
    const op = clamp(x / 0.22);
    const dy = (1 - k) * (big ? 60 : 38);
    w.style.opacity = op;
    w.style.transform = `translateY(${dy.toFixed(2)}px) scale(${(0.86 + 0.14 * k).toFixed(4)})`;
  }

  window.renderText = function (t, hidden) {
    for (const b of blocks) {
      const on = !hidden && t >= b.a && t < b.z;
      b.el.style.display = on ? 'block' : 'none';
      if (!on) continue;
      const exit = clamp((t - (b.z - 0.3)) / 0.3);
      b.el.style.opacity = 1 - cubicOut(exit);
      b.el.style.transform = `translateY(${(-26 * cubicOut(exit)).toFixed(2)}px)`;
      if (b.card) {
        const k = backOut((t - b.a) / 0.45, 1.5);
        b.card.style.opacity = clamp((t - b.a) / 0.18);
        b.card.style.transform = `scale(${(0.6 + 0.4 * k).toFixed(4)})`;
      }
      b.ws.forEach((w, i) => wordAt(w, t, b.a + (b.card ? 0.08 : 0), i, b.d.zone === 'titre'));
      for (const r of b.rows) {
        const x = t - r.a;
        r.el.style.visibility = x >= 0 ? 'visible' : 'hidden';
        r.el.style.opacity = clamp(x / 0.2);
        r.el.style.transform = `translateX(${((1 - backOut(x / 0.45, 1.3)) * -40).toFixed(2)}px)`;
      }
    }
  };
})();
