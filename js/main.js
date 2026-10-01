/* =========================================================
   PORTFOLIO — rendu du contenu & animations
   Aucune dépendance : tout est en JavaScript natif.
   ========================================================= */
(() => {
  const D = window.PORTFOLIO;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  /* ---------- Couleurs de marque ---------- */
  const brandColor = (name) => (D.brands.find((b) => b.name === name) || {}).color || "#ff5a1f";
  const luma = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
  };
  const isDark = (hex) => luma(hex) < 150;
  const brandVars = (name) => {
    const c = brandColor(name);
    return `--brand:${c};--brand-fg:${isDark(c) ? "#f3efe7" : "#111110"}`;
  };

  /* =========================================================
     1. RENDU DU CONTENU
     ========================================================= */
  const p = D.profile;
  const fullName = `${p.firstName} ${p.lastName}`;
  $$("[data-name-full]").forEach((el) => (el.textContent = fullName));
  $$("[data-name-initials]").forEach((el) => (el.textContent = `${p.firstName[0]}${p.lastName[0]}.`));
  $$("[data-role]").forEach((el) => (el.textContent = `${p.role} @ ${p.company}`));
  $$("[data-company]").forEach((el) => (el.textContent = p.company));
  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
  $("[data-email]").textContent = p.email;
  $("[data-email-link]").href = `mailto:${p.email}`;
  $("[data-linkedin]").href = p.linkedin;

  // Photo ou monogramme
  $("[data-photo]").innerHTML = p.photo
    ? `<img src="${esc(p.photo)}" alt="${esc(fullName)}" />`
    : `<div class="monogram-bg"></div><span class="monogram">${esc(p.firstName[0])}<span class="serif">${esc(p.lastName[0])}</span></span>`;

  // Marquees
  const brandNames = D.brands.map((b) => b.name);
  const marqueeHTML = (items, serifEvery) =>
    items
      .map((t, i) => `<span class="marquee__item">${serifEvery && i % 2 ? `<span class="serif">${esc(t)}</span>` : esc(t)}<span class="marquee__star">✺</span></span>`)
      .join("");
  const mb = $("[data-marquee-brands]");
  const ms = $("[data-marquee-skills]");
  mb.innerHTML = marqueeHTML(brandNames, true).repeat(4);
  ms.innerHTML = marqueeHTML(["Réseaux sociaux", "Print", "Sites web", "SEO", "YouTube", "Identité visuelle", "Contenus"], false).repeat(4);

  // Intro (texte révélé mot à mot)
  const highlight = new Set(["marketing", "communication", "réseaux", "sociaux", "print", "référencement", "naturel", "rapporte."]);
  $("[data-intro]").innerHTML = p.intro
    .split(/\s+/)
    .map((w) => `<span class="w${highlight.has(w.toLowerCase().replace(/[,]/g, "")) ? " hl" : ""}">${esc(w)}</span>`)
    .join(" ");

  // Chiffres clés
  $("[data-stats]").innerHTML = D.stats
    .map((s) => `<div class="stat reveal-up"><div class="stat__value"><span data-count="${s.value}">0</span></div><div class="stat__label">${esc(s.label)}</div></div>`)
    .join("");

  $("[data-skills]").innerHTML = p.skills.map((s) => `<li>${esc(s)}</li>`).join("");
  $("[data-tools]").innerHTML = p.tools.map((s) => `<li>${esc(s)}</li>`).join("");

  // Liste des marques
  $("[data-brands]").innerHTML = D.brands
    .map(
      (b, i) => `
      <li class="brand-row" style="${brandVars(b.name)}" data-brand="${esc(b.name)}">
        <div class="brand-row__link">
          <span class="brand-row__idx">${String(i + 1).padStart(2, "0")}</span>
          <span class="brand-row__name">${esc(b.name)}</span>
          <span class="brand-row__meta">
            <span>${esc(b.tagline)}</span>
            <span class="brand-row__tags">${b.channels.map((c) => `<span>${esc(c)}</span>`).join("")}</span>
          </span>
        </div>
      </li>`
    )
    .join("");

  // Réseaux sociaux
  const icons = {
    Facebook: '<svg viewBox="0 0 24 24"><path d="M14 8V6c0-.9.6-1 1-1h3V1h-4C10.3 1 9.5 3.7 9.5 5.5V8H7v4h2.5v11h4.5V12h3.4l.6-4z"/></svg>',
    LinkedIn: '<svg viewBox="0 0 24 24"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.3 0-2.9-1.8-2.9s-2 1.4-2 2.8V21h-4z"/></svg>',
    YouTube: '<svg viewBox="0 0 24 24"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-4.8.5-4.8s0-3.2-.5-4.8zM9.7 15.1V8.9l5.8 3.1z"/></svg>',
  };
  $("[data-socials]").innerHTML = D.socials
    .map(
      (s) => `
      <a class="social reveal-up" href="${esc(s.url)}" target="_blank" rel="noopener" style="${brandVars(s.brand)}" data-hover data-tilt>
        <span class="social__icon">${icons[s.platform] || ""}</span>
        <span class="social__arrow">↗</span>
        <span><span class="social__brand">${esc(s.brand)}</span><br /><span class="social__platform">${esc(s.platform)}</span></span>
      </a>`
    )
    .join("");

  // Maquette générée pour un projet sans image
  const catLabel = { social: "Réseaux sociaux", print: "Print", video: "Vidéo" };
  const mockHTML = (w) => {
    const words = w.title.split(" ");
    const last = words.pop();
    const title = `${esc(words.join(" "))} <span class="serif">${esc(last)}</span>`;
    if (w.category === "video")
      return `<div class="mock mock--video" style="${brandVars(w.brand)}"><span class="mock__deco mock__deco--a"></span>
        <div class="mock__head"><span class="mock__avatar"></span>${esc(w.brand)}</div><span class="mock__play"></span>
        <div class="mock__title">${title}</div><div class="mock__foot"><span>YouTube</span><span>${w.year}</span></div></div>`;
    if (w.category === "print")
      return `<div class="mock mock--print" style="${brandVars(w.brand)}"><span class="mock__deco mock__deco--a"></span>
        <div class="mock__head">${esc(w.brand)}</div>
        <div class="mock__title">${title}</div><div class="mock__lines"><span></span><span></span><span></span></div>
        <div class="mock__foot"><span>Print</span><span>${w.year}</span></div></div>`;
    return `<div class="mock" style="${brandVars(w.brand)}"><span class="mock__deco mock__deco--a"></span><span class="mock__deco mock__deco--b"></span>
      <div class="mock__head"><span class="mock__avatar"></span>${esc(w.brand)}</div>
      <div class="mock__title">${title}</div><div class="mock__foot"><span>♥ ↻ ✉</span><span>${w.year}</span></div></div>`;
  };
  const mediaHTML = (w) => (w.image ? `<img src="${esc(w.image)}" alt="${esc(w.title)} — ${esc(w.brand)}" loading="lazy" />` : mockHTML(w));

  // Grille des réalisations
  $("[data-works]").innerHTML = D.projects
    .map(
      (w, i) => `
      <article class="work work--${w.format}" data-cat="${w.category}" data-index="${i}">
        <button class="work__media" data-cursor="Voir" data-tilt aria-label="Voir ${esc(w.title)}">${mediaHTML(w)}</button>
        <div class="work__info">
          <span class="work__title">${esc(w.title)}</span>
          <span class="work__meta">${esc(w.brand)} · ${catLabel[w.category] || ""}</span>
        </div>
      </article>`
    )
    .join("");
  $$("[data-filter-count]").forEach((el) => {
    const f = el.dataset.filterCount;
    el.textContent = f === "all" ? D.projects.length : D.projects.filter((w) => w.category === f).length;
  });

  // SEO
  $("[data-seo-tabs]").innerHTML = D.seo
    .map((s, i) => `<button class="seo-tab${i ? "" : " is-active"}" role="tab" style="${brandVars(s.brand)}" data-seo="${i}" data-hover><i></i>${esc(s.site)}</button>`)
    .join("");
  $("[data-seo-method]").innerHTML = D.seoMethod.map((m) => `<li class="reveal-up"><h3>${esc(m.title)}</h3><p>${esc(m.text)}</p></li>`).join("");

  const monthNames = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const now = new Date();
  $("[data-seo-months]").innerHTML = Array.from({ length: 12 }, (_, i) => `<span>${monthNames[(now.getMonth() + 1 + i) % 12]}</span>`).join("");

  /* =========================================================
     2. ANIMATIONS
     ========================================================= */

  // Compteurs
  const countUp = (el, dur = 1600) => {
    const target = parseFloat(el.dataset.count);
    if (reduced) return void (el.textContent = target);
    const t0 = performance.now();
    const tick = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Révélations au scroll
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add("is-in");
        if (el.dataset.count) countUp(el);
        if (el.matches("[data-seo-chart-wrap]")) drawChart();
        io.unobserve(el);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  const observeAll = () =>
    $$(".section .line, .contact .line, .reveal-up:not(.hero *), .reveal-scale, .work, [data-count]").forEach((el) => io.observe(el));

  // Décalage en cascade des cartes
  $$(".work").forEach((el, i) => (el.style.transitionDelay = `${(i % 3) * 0.08}s`));
  $$(".stat").forEach((el, i) => (el.style.transitionDelay = `${i * 0.08}s`));
  $$(".social").forEach((el, i) => (el.style.transitionDelay = `${i * 0.06}s`));
  $$(".seo__method li").forEach((el, i) => (el.style.transitionDelay = `${i * 0.08}s`));

  /* ---------- Préchargement ---------- */
  const loader = $(".loader");
  const startSite = () => {
    document.body.classList.remove("is-loading");
    loader.classList.add("is-done");
    setTimeout(() => {
      $(".hero").classList.add("is-in");
      $$(".hero .line, .hero .reveal-up").forEach((el, i) => setTimeout(() => el.classList.add("is-in"), i * 90));
    }, reduced ? 0 : 450);
    observeAll();
  };
  if (reduced) {
    startSite();
  } else {
    const words = $$(".loader__words span");
    const countEl = $("[data-loader-count]");
    const dur = 2000;
    const t0 = performance.now();
    let wi = -1;
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1);
      countEl.textContent = Math.round(100 * (1 - Math.pow(1 - k, 3)));
      const idx = Math.min(words.length - 1, Math.floor(k * words.length));
      if (idx !== wi) {
        words.forEach((w) => w.classList.remove("is-on"));
        void words[idx].offsetWidth;
        words[idx].classList.add("is-on");
        wi = idx;
      }
      if (k < 1) requestAnimationFrame(step);
      else setTimeout(startSite, 250);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Mot qui tourne (hero) ---------- */
  const rot = $("[data-rotator]");
  let ri = 0;
  rot.textContent = brandNames[0];
  if (!reduced)
    setInterval(() => {
      rot.classList.add("is-out");
      setTimeout(() => {
        ri = (ri + 1) % brandNames.length;
        rot.textContent = brandNames[ri];
        rot.classList.remove("is-out");
        rot.classList.add("is-pre");
        void rot.offsetWidth;
        rot.classList.remove("is-pre");
      }, 450);
    }, 2200);

  /* ---------- Horloge ---------- */
  const clock = $("[data-clock]");
  const fmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const updateClock = () => (clock.textContent = `${fmt.format(new Date())} — Paris`);
  updateClock();
  setInterval(updateClock, 15000);

  /* ---------- Souris ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Curseur personnalisé
  const cursor = $(".cursor");
  const cursorLabel = $(".cursor__label");
  const cur = { x: mouse.x, y: mouse.y };
  if (finePointer && !reduced) {
    document.body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor], [data-hover], a, button");
      const label = t && t.dataset.cursor;
      cursor.classList.toggle("is-hover", !!t && !label);
      cursor.classList.toggle("has-label", !!label);
      if (label) cursorLabel.textContent = label;
    });
    document.addEventListener("pointerleave", () => (cursor.style.opacity = 0));
    document.addEventListener("pointerenter", () => (cursor.style.opacity = 1));
  } else {
    cursor.style.display = "none";
  }

  // Aperçu flottant sur la liste des marques
  const preview = $(".float-preview");
  const previewInner = $(".float-preview__inner");
  const prev = { x: mouse.x, y: mouse.y };
  if (finePointer && !reduced) {
    $$(".brand-row").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        const name = row.dataset.brand;
        const proj = D.projects.find((w) => w.brand === name && w.image) || D.projects.find((w) => w.brand === name);
        previewInner.innerHTML = proj ? mediaHTML(proj) : mockHTML({ title: name, brand: name, category: "social", year: "" });
        preview.style.setProperty("--rot", `${Math.random() * 10 - 5}deg`);
        preview.classList.add("is-on");
      });
      row.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
    });
  }

  // Effet magnétique
  const magnets = $$("[data-magnetic]").map((el) => ({ el, x: 0, y: 0, tx: 0, ty: 0 }));
  if (finePointer && !reduced) {
    magnets.forEach((m) => {
      m.el.addEventListener("pointermove", (e) => {
        const r = m.el.getBoundingClientRect();
        m.tx = (e.clientX - (r.left + r.width / 2)) * 0.35;
        m.ty = (e.clientY - (r.top + r.height / 2)) * 0.45;
      });
      m.el.addEventListener("pointerleave", () => (m.tx = m.ty = 0));
    });
  }

  // Inclinaison 3D des cartes
  if (finePointer && !reduced) {
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty("--ry", `${px * 10}deg`);
        el.style.setProperty("--rx", `${-py * 10}deg`);
        if (el.classList.contains("social")) el.style.transform = `perspective(700px) rotateX(${-py * 10}deg) rotateY(${px * 10}deg)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
        if (el.classList.contains("social")) el.style.transform = "";
      });
    });
  }

  /* ---------- Filtres des réalisations ---------- */
  $$(".filter").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$(".filter").forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      $$(".work").forEach((w, i) => {
        const show = f === "all" || w.dataset.cat === f;
        w.classList.remove("is-in");
        w.classList.toggle("is-hidden", !show);
        if (show) setTimeout(() => w.classList.add("is-in"), 40 + i * 30);
      });
    })
  );

  /* ---------- Lightbox ---------- */
  const lb = $(".lightbox");
  const ratios = { square: 1, portrait: 3 / 4, story: 9 / 14, landscape: 16 / 9 };
  let lastFocus = null;
  const openLb = (w) => {
    lastFocus = document.activeElement;
    const media = $("[data-lb-media]");
    media.style.setProperty("--ratio", ratios[w.format] || 1);
    media.innerHTML = mediaHTML(w);
    $("[data-lb-meta]").textContent = `${w.brand} — ${catLabel[w.category] || ""} — ${w.year}`;
    $("[data-lb-title]").textContent = w.title;
    $("[data-lb-desc]").textContent = w.description || "";
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    $(".lightbox__close").focus();
  };
  const closeLb = () => {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus();
  };
  $$(".work__media").forEach((b) => b.addEventListener("click", () => openLb(D.projects[+b.closest(".work").dataset.index])));
  $(".lightbox__close").addEventListener("click", closeLb);
  lb.addEventListener("click", (e) => e.target === lb && closeLb());
  document.addEventListener("keydown", (e) => e.key === "Escape" && lb.classList.contains("is-open") && closeLb());

  /* ---------- Graphique SEO ---------- */
  const chartWrap = $(".seo__chart");
  chartWrap.setAttribute("data-seo-chart-wrap", "");
  io.observe(chartWrap);
  const svg = $("[data-seo-chart]");
  const W = 600, H = 260, PAD = 14;
  svg.querySelector(".grid-lines").innerHTML = [0, 1, 2, 3, 4].map((i) => `<line x1="0" x2="${W}" y1="${PAD + (i * (H - PAD * 2)) / 4}" y2="${PAD + (i * (H - PAD * 2)) / 4}" />`).join("");
  let seoIndex = 0;
  let chartVisible = false;

  const renderSeo = (i, animate) => {
    const s = D.seo[i];
    const color = brandColor(s.brand);
    $("#seo").style.setProperty("--chart", luma(color) < 40 ? "#ff5a1f" : color); // couleur trop sombre sur fond noir → orange
    $("[data-seo-site]").textContent = `${s.site} · ${s.period}`;
    $("[data-seo-metrics]").innerHTML = s.metrics
      .map(
        (m) => `<div class="metric"><span class="metric__value">${esc(m.prefix)}<span data-n="${m.value}">${animate ? 0 : m.value}</span>${esc(m.suffix)}</span><span class="metric__label">${esc(m.label)}</span></div>`
      )
      .join("");
    if (animate) $$("[data-n]").forEach((el) => ((el.dataset.count = el.dataset.n), countUp(el, 1400)));

    const max = Math.max(...s.traffic) * 1.12;
    const pts = s.traffic.map((v, k) => [(k / (s.traffic.length - 1)) * W, H - PAD - (v / max) * (H - PAD * 2)]);
    // Courbe lissée (Catmull-Rom → Bézier)
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let k = 0; k < pts.length - 1; k++) {
      const p0 = pts[k - 1] || pts[k], p1 = pts[k], p2 = pts[k + 1], p3 = pts[k + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
    }
    svg.querySelector(".line").setAttribute("d", d);
    svg.querySelector(".area").setAttribute("d", `${d} L${W},${H} L0,${H} Z`);
    svg.querySelector(".points").innerHTML = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" />`).join("");

    if (animate) {
      chartWrap.classList.add("no-anim");
      chartWrap.classList.remove("is-drawn");
      void chartWrap.offsetWidth;
      chartWrap.classList.remove("no-anim");
      chartWrap.classList.add("is-drawn");
    }
  };
  function drawChart() {
    chartVisible = true;
    renderSeo(seoIndex, true);
  }
  renderSeo(0, false);
  $$(".seo-tab").forEach((t) =>
    t.addEventListener("click", () => {
      seoIndex = +t.dataset.seo;
      $$(".seo-tab").forEach((b) => b.classList.toggle("is-active", b === t));
      renderSeo(seoIndex, chartVisible);
    })
  );

  /* ---------- Boucle principale (scroll + rAF) ---------- */
  const nav = $(".nav");
  const heroShapes = $$(".hero .shape");
  const scrub = $(".scrub-text");
  const scrubWords = $$(".w", scrub);
  const photo = $(".profil__photo-inner");
  const themed = $$("[data-theme]:not(body)");
  const marquees = $$("[data-marquee]").map((el) => ({ el, track: $(".marquee__track", el), dir: +el.dataset.marquee, x: 0 }));

  let lastY = scrollY;
  let velocity = 0;
  let currentTheme = "";

  const loop = () => {
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    velocity = lerp(velocity, dy, 0.1);

    // Curseur & aperçu
    cur.x = lerp(cur.x, mouse.x, 0.2);
    cur.y = lerp(cur.y, mouse.y, 0.2);
    cursor.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
    const vx = mouse.x - prev.x;
    prev.x = lerp(prev.x, mouse.x, 0.12);
    prev.y = lerp(prev.y, mouse.y, 0.12);
    preview.style.transform = `translate3d(${prev.x}px, ${prev.y}px, 0) rotate(${clamp(vx * 0.08, -12, 12)}deg)`;

    // Aimants
    magnets.forEach((m) => {
      m.x = lerp(m.x, m.tx, 0.15);
      m.y = lerp(m.y, m.ty, 0.15);
      m.el.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
    });

    if (!reduced) {
      // Formes du hero : parallaxe souris + scroll
      const mx = mouse.x - innerWidth / 2;
      const my = mouse.y - innerHeight / 2;
      heroShapes.forEach((s, i) => {
        const depth = parseFloat(s.dataset.depth);
        s.style.transform = `translate3d(${mx * depth}px, ${my * depth - y * (0.15 + i * 0.12)}px, 0) rotate(${y * 0.05 * (i % 2 ? -1 : 1)}deg)`;
      });

      // Marquees : vitesse liée au scroll
      marquees.forEach((m) => {
        const half = m.track.scrollWidth / 2;
        m.x -= (0.6 + Math.abs(velocity) * 0.5) * m.dir * (velocity < 0 ? -1 : 1);
        if (m.x <= -half) m.x += half;
        if (m.x > 0) m.x -= half;
        m.track.style.transform = `translate3d(${m.x}px, 0, 0)`;
      });

      // Photo : parallaxe
      const pr = photo.parentElement.getBoundingClientRect();
      photo.style.transform = `translate3d(0, ${((pr.top + pr.height / 2 - innerHeight / 2) / innerHeight) * -40}px, 0)`;

      // Texte révélé mot à mot
      const sr = scrub.getBoundingClientRect();
      const prog = clamp((innerHeight * 0.85 - sr.top) / (sr.height + innerHeight * 0.35), 0, 1);
      const on = Math.round(prog * scrubWords.length);
      scrubWords.forEach((w, i) => w.classList.toggle("on", i < on));
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // Thème de fond selon la section au centre de l'écran + nav qui se cache
  let navY = scrollY;
  const onScroll = () => {
    const mid = innerHeight * 0.5;
    const sec = themed.find((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= mid && r.bottom >= mid;
    });
    const theme = sec ? sec.dataset.theme : currentTheme;
    if (theme && theme !== currentTheme) {
      currentTheme = theme;
      document.body.dataset.theme = theme;
    }
    const y = scrollY;
    if (Math.abs(y - navY) > 8) {
      nav.classList.toggle("is-hidden", y > navY && y > 200 && !lb.classList.contains("is-open"));
      navY = y;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
