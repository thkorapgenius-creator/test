/* Mon Budget — application de gestion de budget 100 % locale (données dans le navigateur). */
'use strict';

const STORAGE_KEY = 'mon-budget-v1';
const COLORS = ['#4f7cff', '#ff8a4c', '#1f9d61', '#e5484d', '#a259ff', '#f5b70a', '#13a8a8', '#ff5fa2', '#7a8699', '#8d6e63'];
const GOAL_EMOJIS = ['🏖️', '🛟', '🚗', '🏠', '🎁', '💻', '🎓', '💍', '👶', '🐶', '✈️', '💰'];

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const currentYM = () => todayISO().slice(0, 7);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const parseAmount = v => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return isFinite(n) ? Math.round(n * 100) / 100 : NaN; };
const sum = (arr, f = x => x) => arr.reduce((a, x) => a + f(x), 0);

function addMonths(ym, delta) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function monthsBetween(fromYM, toYM) {
  const [y1, m1] = fromYM.split('-').map(Number);
  const [y2, m2] = toYM.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}
function daysInMonth(ym) { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); }
function monthLabel(ym, short = false) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', short ? { month: 'short' } : { month: 'long', year: 'numeric' });
}
function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/* ---------- État ---------- */
function defaultState() {
  const cat = (name, type, budget, color, icon) => ({ id: uid(), name, type, budget, color, icon });
  return {
    version: 1,
    settings: { currency: 'EUR' },
    categories: [
      cat('Salaire', 'income', 0, '#1f9d61', '💼'),
      cat('Autres revenus', 'income', 0, '#13a8a8', '➕'),
      cat('Logement', 'expense', 0, '#4f7cff', '🏠'),
      cat('Courses', 'expense', 0, '#ff8a4c', '🛒'),
      cat('Transport', 'expense', 0, '#f5b70a', '🚗'),
      cat('Factures & abonnements', 'expense', 0, '#7a8699', '📄'),
      cat('Santé', 'expense', 0, '#e5484d', '💊'),
      cat('Loisirs', 'expense', 0, '#a259ff', '🎉'),
      cat('Restaurants', 'expense', 0, '#ff5fa2', '🍽️'),
      cat('Shopping', 'expense', 0, '#8d6e63', '🛍️'),
      cat('Divers', 'expense', 0, '#13a8a8', '📦'),
    ],
    transactions: [],
    recurring: [],
    goals: [
      { id: uid(), name: 'Épargne de précaution', emoji: '🛟', target: 3000, deadline: '', monthly: 0, color: '#1f9d61' },
      { id: uid(), name: 'Vacances', emoji: '🏖️', target: 1500, deadline: '', monthly: 0, color: '#4f7cff' },
    ],
    savings: [],
    dismissedRecurring: {},
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn(e); }
  return defaultState();
}
function normalize(s) {
  const d = defaultState();
  return {
    ...d, ...s,
    settings: { ...d.settings, ...(s.settings || {}) },
    categories: Array.isArray(s.categories) ? s.categories : d.categories,
    transactions: Array.isArray(s.transactions) ? s.transactions : [],
    recurring: Array.isArray(s.recurring) ? s.recurring : [],
    goals: Array.isArray(s.goals) ? s.goals : [],
    savings: Array.isArray(s.savings) ? s.savings : [],
    dismissedRecurring: s.dismissedRecurring || {},
  };
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { toast('⚠️ Impossible d’enregistrer (stockage du navigateur indisponible)'); }
}

let state = load();
const ui = { tab: 'dashboard', month: currentYM(), search: '', typeFilter: 'all', catFilter: 'all' };

const money = v => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: state.settings.currency || 'EUR' }).format(v || 0);
const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + money(Math.abs(v));
const catById = id => state.categories.find(c => c.id === id);
const goalById = id => state.goals.find(g => g.id === id);

/* ---------- Calculs ---------- */
const txOfMonth = ym => state.transactions.filter(t => t.date.startsWith(ym));
const savingsOfMonth = ym => state.savings.filter(s => s.date.startsWith(ym));
const goalBalance = id => sum(state.savings.filter(s => s.goalId === id), s => s.amount);

function monthSummary(ym) {
  const tx = txOfMonth(ym);
  const income = sum(tx.filter(t => t.type === 'income'), t => t.amount);
  const expense = sum(tx.filter(t => t.type === 'expense'), t => t.amount);
  const saved = sum(savingsOfMonth(ym), s => s.amount);
  return { income, expense, saved, rest: income - expense - saved };
}
function spentByCategory(ym) {
  const map = {};
  txOfMonth(ym).filter(t => t.type === 'expense').forEach(t => { map[t.categoryId] = (map[t.categoryId] || 0) + t.amount; });
  return map;
}
function goalPlan(g) {
  const balance = goalBalance(g.id);
  const remaining = Math.max(0, (g.target || 0) - balance);
  let monthsLeft = null, suggested = g.monthly || 0;
  if (g.deadline) {
    monthsLeft = Math.max(1, monthsBetween(currentYM(), g.deadline) + 1);
    suggested = remaining / monthsLeft;
  }
  const pct = g.target > 0 ? Math.min(100, (balance / g.target) * 100) : 0;
  let eta = null;
  if (!g.deadline && g.monthly > 0 && remaining > 0) eta = addMonths(currentYM(), Math.ceil(remaining / g.monthly) - 1);
  return { balance, remaining, monthsLeft, suggested, pct, eta, done: g.target > 0 && balance >= g.target };
}
function pendingRecurring(ym) {
  return state.recurring.filter(r => {
    if (r.active === false) return false;
    if (r.start && ym < r.start) return false;
    if (r.end && ym > r.end) return false;
    if ((state.dismissedRecurring[ym] || []).includes(r.id)) return false;
    if (r.kind === 'saving') return !state.savings.some(s => s.recurringId === r.id && s.date.startsWith(ym));
    return !state.transactions.some(t => t.recurringId === r.id && t.date.startsWith(ym));
  });
}
function applyRecurring(ym, list) {
  list.forEach(r => {
    const date = `${ym}-${pad(Math.min(r.day || 1, daysInMonth(ym)))}`;
    if (r.kind === 'saving') {
      state.savings.push({ id: uid(), goalId: r.goalId, date, amount: r.amount, note: r.label, recurringId: r.id });
    } else {
      state.transactions.push({ id: uid(), date, label: r.label, amount: r.amount, type: r.kind, categoryId: r.categoryId, recurringId: r.id });
    }
  });
  save();
}

/* ---------- Rendu ---------- */
const view = document.getElementById('view');

function render() {
  document.getElementById('monthLabel').textContent = monthLabel(ui.month);
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === ui.tab));
  const renderers = { dashboard: renderDashboard, transactions: renderTransactions, budgets: renderBudgets, savings: renderSavings, recurring: renderRecurring, settings: renderSettings };
  view.innerHTML = renderers[ui.tab]();
  if (ui.tab === 'transactions') {
    const s = document.getElementById('search');
    if (s && document.activeElement !== s && ui._focusSearch) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); ui._focusSearch = false; }
  }
}

function progressBar(value, max, color) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const cls = max > 0 && value > max ? 'over' : pct >= 85 ? 'warn' : '';
  return `<div class="progress ${cls}"><div style="width:${pct}%;${color && !cls ? `background:${color}` : ''}"></div></div>`;
}

function recurringBanner() {
  const pending = pendingRecurring(ui.month);
  if (!pending.length) return '';
  const total = sum(pending, r => (r.kind === 'income' ? r.amount : -r.amount));
  return `<div class="banner">
    <span>🔁 <strong>${pending.length}</strong> opération${pending.length > 1 ? 's' : ''} fixe${pending.length > 1 ? 's' : ''} pas encore ajoutée${pending.length > 1 ? 's' : ''} pour ${esc(monthLabel(ui.month))} (${signed(total)}).</span>
    <span class="spacer"></span>
    <button class="btn small" data-action="review-recurring">Voir</button>
    <button class="btn small primary" data-action="apply-recurring">Tout ajouter</button>
  </div>`;
}

function renderDashboard() {
  const s = monthSummary(ui.month);
  const spent = spentByCategory(ui.month);
  const expCats = state.categories.filter(c => c.type === 'expense');
  const totalBudget = sum(expCats, c => c.budget || 0);
  const day = ui.month === currentYM() ? new Date().getDate() : daysInMonth(ui.month);
  const daysLeft = ui.month === currentYM() ? daysInMonth(ui.month) - day + 1 : 0;
  const totalSaved = sum(state.goals, g => goalBalance(g.id));

  const budgetLines = expCats.filter(c => c.budget > 0 || spent[c.id]).sort((a, b) => (spent[b.id] || 0) - (spent[a.id] || 0)).slice(0, 6);

  return `
  ${recurringBanner()}
  <div class="grid kpis" style="margin-top:12px">
    <div class="card kpi"><div class="label">Revenus</div><div class="value income">${money(s.income)}</div></div>
    <div class="card kpi"><div class="label">Dépenses</div><div class="value expense">${money(s.expense)}</div>
      <div class="sub">${totalBudget ? `sur ${money(totalBudget)} budgétés` : '&nbsp;'}</div></div>
    <div class="card kpi"><div class="label">Mis de côté</div><div class="value saving">${money(s.saved)}</div>
      <div class="sub">${s.income ? Math.round((s.saved / s.income) * 100) + ' % des revenus' : '&nbsp;'}</div></div>
    <div class="card kpi highlight"><div class="label">Reste à vivre</div><div class="value">${money(s.rest)}</div>
      <div class="sub">${daysLeft > 0 && s.rest > 0 ? `soit ${money(s.rest / daysLeft)} / jour (${daysLeft} j)` : '&nbsp;'}</div></div>
  </div>

  <div class="grid two" style="margin-top:12px">
    <div class="card">
      <h2 class="section" style="margin-top:0">Budgets du mois <button class="btn small ghost" data-tab-link="budgets">Gérer</button></h2>
      ${budgetLines.length ? `<div class="stack">${budgetLines.map(c => budgetLine(c, spent[c.id] || 0)).join('')}</div>`
      : `<div class="empty">Aucun budget défini.<br><button class="btn small" data-tab-link="budgets" style="margin-top:8px">Définir mes budgets</button></div>`}
    </div>
    <div class="card chart">
      <h2 class="section" style="margin-top:0">Répartition des dépenses</h2>
      ${donutChart(spent)}
    </div>
  </div>

  <h2 class="section">Mes objectifs d’épargne <span class="muted small">Total : <strong class="saving">${money(totalSaved)}</strong></span></h2>
  ${state.goals.length ? `<div class="grid cards">${state.goals.map(goalCard).join('')}</div>`
    : `<div class="card empty">Pas encore d’objectif. <button class="btn small" data-action="add-goal">Créer un objectif</button></div>`}

  <div class="card chart" style="margin-top:12px">
    <h2 class="section" style="margin-top:0">Évolution sur 6 mois</h2>
    ${barChart()}
  </div>

  <h2 class="section">Dernières opérations <button class="btn small ghost" data-tab-link="transactions">Tout voir</button></h2>
  <div class="card">${txList(txOfMonth(ui.month).sort(sortTx).slice(0, 6), false)}</div>`;
}

function budgetLine(c, spent) {
  const left = (c.budget || 0) - spent;
  return `<div class="budget-line">
    <div class="top">
      <div class="name"><span class="dot" style="background:${c.color}"></span>${esc(c.icon || '')} ${esc(c.name)}</div>
      <div class="small">${money(spent)}${c.budget ? ` <span class="muted">/ ${money(c.budget)}</span>` : ''}</div>
    </div>
    ${c.budget ? progressBar(spent, c.budget, c.color) : ''}
    ${c.budget ? `<div class="small ${left < 0 ? 'expense' : 'muted'}" style="margin-top:3px">${left < 0 ? `Dépassé de ${money(-left)}` : `Reste ${money(left)}`}</div>` : ''}
  </div>`;
}

function donutChart(spent) {
  const entries = Object.entries(spent).map(([id, v]) => ({ c: catById(id) || { name: 'Sans catégorie', color: '#999' }, v })).sort((a, b) => b.v - a.v);
  const total = sum(entries, e => e.v);
  if (!total) return '<div class="empty">Aucune dépense ce mois-ci.</div>';
  const r = 60, C = 2 * Math.PI * r;
  let off = 0;
  const arcs = entries.map(e => {
    const len = (e.v / total) * C;
    const a = `<circle r="${r}" cx="80" cy="80" fill="none" stroke="${e.c.color}" stroke-width="26" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"><title>${esc(e.c.name)} : ${money(e.v)}</title></circle>`;
    off += len; return a;
  }).join('');
  return `<div class="donut-wrap">
    <svg viewBox="0 0 160 160">${arcs}
      <text x="80" y="76" text-anchor="middle" font-size="11" fill="currentColor" opacity=".6">Total</text>
      <text x="80" y="94" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">${esc(money(total))}</text></svg>
    <div class="legend">${entries.map(e => `<span><span class="row" style="gap:6px"><span class="dot" style="background:${e.c.color}"></span>${esc(e.c.name)}</span><strong>${Math.round((e.v / total) * 100)} %</strong></span>`).join('')}</div>
  </div>`;
}

function barChart() {
  const months = Array.from({ length: 6 }, (_, i) => addMonths(ui.month, i - 5));
  const data = months.map(m => ({ m, ...monthSummary(m) }));
  const max = Math.max(1, ...data.map(d => Math.max(d.income, d.expense, d.saved)));
  const W = 600, H = 220, top = 10, bottom = 30, left = 10, gw = (W - left * 2) / 6, bw = Math.min(22, gw / 4.5);
  const y = v => top + (H - top - bottom) * (1 - Math.max(0, v) / max);
  const bars = data.map((d, i) => {
    const x0 = left + i * gw + gw / 2 - bw * 1.5 - 3;
    const bar = (v, k, color, label) => `<rect x="${x0 + k * (bw + 3)}" y="${y(v)}" width="${bw}" height="${H - bottom - y(v)}" rx="4" fill="${color}"><title>${label} ${esc(monthLabel(d.m))} : ${money(v)}</title></rect>`;
    return bar(d.income, 0, 'var(--income)', 'Revenus') + bar(d.expense, 1, 'var(--expense)', 'Dépenses') + bar(d.saved, 2, 'var(--saving)', 'Épargne') +
      `<text x="${left + i * gw + gw / 2}" y="${H - 10}" text-anchor="middle" font-size="16" fill="currentColor" opacity="${d.m === ui.month ? 1 : .6}" font-weight="${d.m === ui.month ? 700 : 400}">${esc(monthLabel(d.m, true))}</text>`;
  }).join('');
  return `<svg class="bars" viewBox="0 0 ${W} ${H}"><line x1="0" x2="${W}" y1="${H - bottom}" y2="${H - bottom}" stroke="var(--border)"/>${bars}</svg>
    <div class="legend"><span><span class="dot" style="background:var(--income)"></span>Revenus</span><span><span class="dot" style="background:var(--expense)"></span>Dépenses</span><span><span class="dot" style="background:var(--saving)"></span>Mis de côté</span></div>`;
}

function goalCard(g) {
  const p = goalPlan(g);
  const thisMonth = sum(savingsOfMonth(ui.month).filter(s => s.goalId === g.id), s => s.amount);
  let hint = '';
  if (p.done) hint = '🎉 Objectif atteint !';
  else if (g.deadline) hint = `Pour atteindre ${money(g.target)} en ${monthLabel(g.deadline)} : <strong>${money(p.suggested)} / mois</strong> pendant ${p.monthsLeft} mois.`;
  else if (p.eta) hint = `À ${money(g.monthly)} / mois, objectif atteint en <strong>${monthLabel(p.eta)}</strong>.`;
  else if (g.target) hint = `Reste ${money(p.remaining)} à mettre de côté.`;
  const badge = p.done ? '<span class="badge ok">Atteint</span>'
    : g.deadline && monthsBetween(currentYM(), g.deadline) < 0 ? '<span class="badge late">Échéance passée</span>'
    : g.deadline ? `<span class="badge">${esc(monthLabel(g.deadline))}</span>` : '';
  return `<div class="card goal">
    <div class="head">
      <div class="emoji" style="background:${g.color}22">${esc(g.emoji || '💰')}</div>
      <div style="flex:1;min-width:0"><div class="name">${esc(g.name)}</div><div class="small muted">${thisMonth ? `${signed(thisMonth)} ce mois-ci` : 'Rien ce mois-ci'}</div></div>
      ${badge}
    </div>
    <div class="amounts"><strong class="saving">${money(p.balance)}</strong><span class="muted small">${g.target ? `sur ${money(g.target)}` : 'sans montant cible'}</span></div>
    ${g.target ? progressBar(p.balance, g.target, g.color).replace('progress over', 'progress') : ''}
    <div class="hint">${hint}</div>
    <div class="actions">
      <button class="btn small saving" data-action="deposit" data-id="${g.id}">+ Mettre de côté</button>
      <button class="btn small" data-action="withdraw" data-id="${g.id}">− Retirer</button>
      <span class="spacer"></span>
      <button class="btn small ghost" data-action="edit-goal" data-id="${g.id}">Modifier</button>
    </div>
  </div>`;
}

const sortTx = (a, b) => b.date.localeCompare(a.date) || (b.created || 0) - (a.created || 0);

function txList(list, grouped = true) {
  if (!list.length) return '<div class="empty">Aucune opération.</div>';
  let html = '', lastDay = null;
  if (!grouped) html += '<ul class="list">';
  list.forEach(t => {
    if (grouped && t.date !== lastDay) {
      if (lastDay) html += '</ul>';
      html += `<div class="day-header">${esc(dayLabel(t.date))}</div><ul class="list">`;
      lastDay = t.date;
    }
    html += txItem(t);
  });
  return html + '</ul>';
}
function txItem(t) {
  if (t.kind === 'saving') {
    const g = goalById(t.goalId) || { name: 'Objectif supprimé', emoji: '💰', color: '#999' };
    return `<li data-action="edit-saving" data-id="${t.id}">
      <div class="avatar" style="background:${g.color}">${esc(g.emoji)}</div>
      <div class="main"><div class="title">${esc(t.note || (t.amount >= 0 ? 'Mise de côté' : 'Retrait'))}</div><div class="meta">🐷 ${esc(g.name)}${t.recurringId ? ' · 🔁' : ''}</div></div>
      <div class="amount saving">${t.amount >= 0 ? '→ ' : '← '}${money(Math.abs(t.amount))}</div></li>`;
  }
  const c = catById(t.categoryId) || { name: 'Sans catégorie', color: '#999', icon: '•' };
  return `<li data-action="edit-transaction" data-id="${t.id}">
    <div class="avatar" style="background:${c.color}">${esc(c.icon || c.name[0])}</div>
    <div class="main"><div class="title">${esc(t.label || c.name)}</div><div class="meta">${esc(c.name)}${t.recurringId ? ' · 🔁 fixe' : ''}${t.note ? ' · ' + esc(t.note) : ''}</div></div>
    <div class="amount ${t.type}">${t.type === 'income' ? '+' : '−'}${money(t.amount)}</div></li>`;
}

function renderTransactions() {
  const s = monthSummary(ui.month);
  let list = [
    ...txOfMonth(ui.month),
    ...savingsOfMonth(ui.month).map(x => ({ ...x, kind: 'saving' })),
  ];
  const q = ui.search.trim().toLowerCase();
  if (ui.typeFilter !== 'all') list = list.filter(t => ui.typeFilter === 'saving' ? t.kind === 'saving' : t.type === ui.typeFilter);
  if (ui.catFilter !== 'all') list = list.filter(t => t.categoryId === ui.catFilter);
  if (q) list = list.filter(t => [t.label, t.note, catById(t.categoryId)?.name, goalById(t.goalId)?.name].some(v => v && v.toLowerCase().includes(q)));
  list.sort(sortTx);
  const shownTotal = sum(list, t => t.kind === 'saving' ? -t.amount : t.type === 'income' ? t.amount : -t.amount);

  return `
  ${recurringBanner()}
  <h2 class="section">Opérations de ${esc(monthLabel(ui.month))}
    <span class="row"><button class="btn small saving" data-action="quick-saving">🐷 Mettre de côté</button><button class="btn small primary" data-action="add-transaction">+ Opération</button></span></h2>
  <div class="row small muted" style="flex-wrap:wrap;gap:14px">
    <span>Revenus <strong class="income">${money(s.income)}</strong></span>
    <span>Dépenses <strong class="expense">${money(s.expense)}</strong></span>
    <span>Épargne <strong class="saving">${money(s.saved)}</strong></span>
    <span>Solde <strong>${signed(s.rest)}</strong></span>
  </div>
  <div class="filters">
    <input id="search" type="search" placeholder="🔍 Rechercher…" value="${esc(ui.search)}">
    <select id="typeFilter">
      ${[['all', 'Tous les types'], ['expense', 'Dépenses'], ['income', 'Revenus'], ['saving', 'Épargne']].map(([v, l]) => `<option value="${v}" ${ui.typeFilter === v ? 'selected' : ''}>${l}</option>`).join('')}
    </select>
    <select id="catFilter">
      <option value="all">Toutes les catégories</option>
      ${state.categories.map(c => `<option value="${c.id}" ${ui.catFilter === c.id ? 'selected' : ''}>${esc(c.icon || '')} ${esc(c.name)}</option>`).join('')}
    </select>
  </div>
  ${(q || ui.typeFilter !== 'all' || ui.catFilter !== 'all') ? `<div class="small muted" style="margin-top:8px">${list.length} résultat(s) · total ${signed(shownTotal)}</div>` : ''}
  <div class="card" style="margin-top:12px">${txList(list)}</div>`;
}

function renderBudgets() {
  const spent = spentByCategory(ui.month);
  const exp = state.categories.filter(c => c.type === 'expense');
  const inc = state.categories.filter(c => c.type === 'income');
  const s = monthSummary(ui.month);
  const totalBudget = sum(exp, c => c.budget || 0);
  const fixedIncome = sum(state.recurring.filter(r => r.active !== false && r.kind === 'income'), r => r.amount);
  const plannedSavings = sum(state.goals, g => { const p = goalPlan(g); return p.done ? 0 : p.suggested; });
  const refIncome = s.income || fixedIncome;
  const free = refIncome - totalBudget - plannedSavings;

  return `
  <h2 class="section">Plan du mois <span class="muted small">${esc(monthLabel(ui.month))}</span></h2>
  <div class="card">
    <table class="simple">
      <tr><td>Revenus ${s.income ? 'du mois' : 'fixes prévus'}</td><td class="num income">${money(refIncome)}</td></tr>
      <tr><td>− Budgets de dépenses</td><td class="num expense">${money(totalBudget)}</td></tr>
      <tr><td>− Épargne prévue (objectifs)</td><td class="num saving">${money(plannedSavings)}</td></tr>
      <tr><td><strong>= Non attribué</strong></td><td class="num"><strong class="${free < 0 ? 'expense' : ''}">${money(free)}</strong></td></tr>
    </table>
    <div class="small muted" style="margin-top:8px">${free < 0 ? '⚠️ Vos budgets et votre épargne dépassent vos revenus : réduisez un budget ou un objectif.' : free > 0 ? '💡 Astuce : attribuez ce reste à une catégorie ou à un objectif d’épargne pour que chaque euro ait un rôle.' : '✅ Chaque euro a un rôle.'}</div>
  </div>

  <h2 class="section">Catégories de dépenses <button class="btn small" data-action="add-category" data-type="expense">+ Catégorie</button></h2>
  <div class="card"><div class="stack">
    ${exp.map(c => `<div class="row" style="align-items:flex-start">
      <div style="flex:1;min-width:0">${budgetLine(c, spent[c.id] || 0)}</div>
      <button class="btn small ghost" data-action="edit-category" data-id="${c.id}">✏️</button>
    </div>`).join('') || '<div class="empty">Aucune catégorie.</div>'}
  </div>
  <div class="row between" style="margin-top:14px;border-top:1px solid var(--border);padding-top:10px">
    <strong>Total</strong><span>${money(sum(exp, c => spent[c.id] || 0))} <span class="muted">/ ${money(totalBudget)}</span></span>
  </div></div>

  <h2 class="section">Catégories de revenus <button class="btn small" data-action="add-category" data-type="income">+ Catégorie</button></h2>
  <div class="card"><ul class="list">
    ${inc.map(c => {
      const v = sum(txOfMonth(ui.month).filter(t => t.categoryId === c.id), t => t.amount);
      return `<li data-action="edit-category" data-id="${c.id}"><div class="avatar" style="background:${c.color}">${esc(c.icon || c.name[0])}</div>
      <div class="main"><div class="title">${esc(c.name)}</div></div><div class="amount income">${money(v)}</div></li>`;
    }).join('')}
  </ul></div>`;
}

function renderSavings() {
  const total = sum(state.goals, g => goalBalance(g.id));
  const plan = sum(state.goals, g => { const p = goalPlan(g); return p.done ? 0 : p.suggested; });
  const s = monthSummary(ui.month);
  const moves = state.savings.slice().sort(sortTx).slice(0, 30).map(x => ({ ...x, kind: 'saving' }));
  return `
  <div class="grid kpis" style="margin-top:12px">
    <div class="card kpi"><div class="label">Total épargné</div><div class="value saving">${money(total)}</div></div>
    <div class="card kpi"><div class="label">Mis de côté ce mois</div><div class="value">${money(s.saved)}</div></div>
    <div class="card kpi"><div class="label">Effort conseillé / mois</div><div class="value">${money(plan)}</div><div class="sub">pour tenir vos échéances</div></div>
    <div class="card kpi"><div class="label">Taux d’épargne</div><div class="value">${s.income ? Math.round((s.saved / s.income) * 100) : 0} %</div><div class="sub">des revenus du mois</div></div>
  </div>
  <h2 class="section">Mes objectifs <button class="btn small primary" data-action="add-goal">+ Nouvel objectif</button></h2>
  ${state.goals.length ? `<div class="grid cards">${state.goals.map(goalCard).join('')}</div>` : '<div class="card empty">Créez un objectif : vacances, épargne de précaution, voiture…</div>'}
  ${plan > 0 && s.saved < plan && ui.month === currentYM() ? `<div class="banner"><span>💡 Il vous reste <strong>${money(plan - s.saved)}</strong> à mettre de côté ce mois-ci pour suivre votre plan.</span><span class="spacer"></span><button class="btn small saving" data-action="apply-plan">Répartir le plan</button></div>` : ''}
  <h2 class="section">Derniers mouvements</h2>
  <div class="card">${txList(moves)}</div>`;
}

function renderRecurring() {
  const active = state.recurring.filter(r => r.active !== false);
  const inc = sum(active.filter(r => r.kind === 'income'), r => r.amount);
  const exp = sum(active.filter(r => r.kind === 'expense'), r => r.amount);
  const sav = sum(active.filter(r => r.kind === 'saving'), r => r.amount);
  const sorted = state.recurring.slice().sort((a, b) => (a.day || 1) - (b.day || 1));
  const item = r => {
    const isSav = r.kind === 'saving';
    const c = isSav ? goalById(r.goalId) : catById(r.categoryId);
    const color = c?.color || '#999', icon = isSav ? (c?.emoji || '🐷') : (c?.icon || '•');
    return `<li data-action="edit-recurring" data-id="${r.id}" style="${r.active === false ? 'opacity:.5' : ''}">
      <div class="avatar" style="background:${color}">${esc(icon)}</div>
      <div class="main"><div class="title">${esc(r.label)}</div><div class="meta">Le ${r.day || 1} du mois · ${esc(c?.name || '—')}${r.active === false ? ' · en pause' : ''}${r.end ? ' · jusqu’à ' + esc(monthLabel(r.end)) : ''}</div></div>
      <div class="amount ${isSav ? 'saving' : r.kind}">${r.kind === 'income' ? '+' : isSav ? '→ ' : '−'}${money(r.amount)}</div></li>`;
  };
  return `
  ${recurringBanner()}
  <div class="grid kpis" style="margin-top:12px">
    <div class="card kpi"><div class="label">Revenus fixes</div><div class="value income">${money(inc)}</div></div>
    <div class="card kpi"><div class="label">Charges fixes</div><div class="value expense">${money(exp)}</div></div>
    <div class="card kpi"><div class="label">Épargne automatique</div><div class="value saving">${money(sav)}</div></div>
    <div class="card kpi highlight"><div class="label">Reste après les fixes</div><div class="value">${money(inc - exp - sav)}</div></div>
  </div>
  <h2 class="section">Opérations récurrentes (chaque mois) <button class="btn small primary" data-action="add-recurring">+ Ajouter</button></h2>
  <div class="card">
    ${sorted.length ? `<ul class="list">${sorted.map(item).join('')}</ul>` : '<div class="empty">Ajoutez votre salaire, loyer, abonnements, virement épargne… Ils seront proposés automatiquement chaque mois.</div>'}
  </div>`;
}

function renderSettings() {
  const currencies = ['EUR', 'CHF', 'CAD', 'USD', 'GBP', 'XOF', 'MAD'];
  return `
  <h2 class="section">Réglages</h2>
  <div class="card stack">
    <div class="field"><label class="lbl">Devise</label>
      <select id="currency">${currencies.map(c => `<option ${state.settings.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
  </div>
  <h2 class="section">Sauvegarde de mes données</h2>
  <div class="card stack">
    <p class="small muted" style="margin:0">Vos données restent uniquement sur cet appareil, dans ce navigateur. Exportez-les régulièrement pour ne rien perdre, ou pour les transférer sur un autre appareil.</p>
    <div class="row" style="flex-wrap:wrap">
      <button class="btn primary" data-action="export-json">⬇️ Exporter la sauvegarde (.json)</button>
      <button class="btn" data-action="import-json">⬆️ Importer une sauvegarde</button>
      <button class="btn" data-action="export-csv">📊 Exporter le mois en CSV (Excel)</button>
    </div>
  </div>
  <h2 class="section">Zone sensible</h2>
  <div class="card stack">
    <div class="row" style="flex-wrap:wrap">
      <button class="btn" data-action="demo">✨ Charger des données d’exemple</button>
      <button class="btn danger" data-action="reset">🗑️ Tout effacer</button>
    </div>
  </div>
  <p class="small muted" style="text-align:center;margin-top:24px">
    ${state.transactions.length} opérations · ${state.savings.length} mouvements d’épargne · ${state.goals.length} objectifs
  </p>`;
}

/* ---------- Formulaires (modale) ---------- */
const modal = document.getElementById('modal');
const modalForm = document.getElementById('modalForm');
let modalHandlers = null;

function field(f) {
  const id = 'f_' + f.name;
  const req = f.required ? 'required' : '';
  let input;
  switch (f.type) {
    case 'select':
      input = `<select id="${id}" name="${f.name}" ${req}>${f.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(f.value) ? 'selected' : ''}>${esc(o.label)}</option>`).join('')}</select>`; break;
    case 'seg':
      input = `<div class="seg">${f.options.map(o => `<label class="${o.cls || ''}"><input type="radio" name="${f.name}" value="${o.value}" ${o.value === f.value ? 'checked' : ''}><span>${esc(o.label)}</span></label>`).join('')}</div>`; break;
    case 'colors':
      input = `<div class="color-row">${COLORS.map(c => `<label><input type="radio" name="${f.name}" value="${c}" ${c === f.value ? 'checked' : ''}><span style="background:${c}"></span></label>`).join('')}</div>`; break;
    case 'emojis':
      input = `<div class="color-row">${GOAL_EMOJIS.map(e => `<label><input type="radio" name="${f.name}" value="${e}" ${e === f.value ? 'checked' : ''}><span style="display:grid;place-items:center;font-size:1.1rem;background:var(--bg)">${e}</span></label>`).join('')}</div>`; break;
    case 'checkbox':
      return `<div class="field check"><label><input type="checkbox" name="${f.name}" ${f.value ? 'checked' : ''}> ${esc(f.label)}</label></div>`;
    case 'amount':
      input = `<input id="${id}" name="${f.name}" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${f.value != null && f.value !== '' ? esc(String(f.value).replace('.', ',')) : ''}" ${req}>`; break;
    default:
      input = `<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${esc(f.value ?? '')}" ${f.placeholder ? `placeholder="${esc(f.placeholder)}"` : ''} ${f.min ? `min="${f.min}"` : ''} ${f.max ? `max="${f.max}"` : ''} ${req}>`;
  }
  return `<div class="field" data-field="${f.name}"><label class="lbl" for="${id}">${esc(f.label)}</label>${input}${f.help ? `<div class="help">${f.help}</div>` : ''}</div>`;
}

function openForm({ title, fields, onSubmit, onDelete, submitLabel = 'Enregistrer', onChange }) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = fields.map(field).join('');
  document.getElementById('modalSubmit').textContent = submitLabel;
  const del = document.getElementById('modalDelete');
  del.hidden = !onDelete;
  modalHandlers = { onSubmit, onDelete, onChange };
  modal.showModal();
  if (onChange) onChange(readForm());
  const first = modalForm.querySelector('input[inputmode="decimal"], input[type="text"]');
  if (first && window.matchMedia('(pointer:fine)').matches) first.focus();
}
function readForm() {
  const data = {};
  new FormData(modalForm).forEach((v, k) => { data[k] = v; });
  modalForm.querySelectorAll('input[type="checkbox"]').forEach(c => { data[c.name] = c.checked; });
  return data;
}
function closeModal() { modal.close(); modalHandlers = null; }

modalForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!modalHandlers) return;
  const ok = modalHandlers.onSubmit(readForm());
  if (ok !== false) { closeModal(); save(); render(); }
});
modalForm.addEventListener('change', () => modalHandlers?.onChange?.(readForm()));
document.getElementById('modalCancel').onclick = closeModal;
document.getElementById('modalDelete').onclick = () => {
  if (modalHandlers?.onDelete && confirm('Supprimer définitivement ?')) { modalHandlers.onDelete(); closeModal(); save(); render(); }
};
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function requireAmount(v, allowZero = false) {
  const n = parseAmount(v);
  if (isNaN(n) || n < 0 || (!allowZero && n === 0)) { toast('Montant invalide'); return null; }
  return n;
}
const catOptions = type => state.categories.filter(c => c.type === type).map(c => ({ value: c.id, label: `${c.icon || ''} ${c.name}` }));
const goalOptions = () => state.goals.map(g => ({ value: g.id, label: `${g.emoji} ${g.name}` }));
const defaultDate = () => ui.month === currentYM() ? todayISO() : `${ui.month}-01`;

function transactionForm(t) {
  const isNew = !t;
  t = t || { type: 'expense', date: defaultDate(), amount: '', label: '', categoryId: catOptions('expense')[0]?.value };
  let currentType = t.type;
  openForm({
    title: isNew ? 'Nouvelle opération' : 'Modifier l’opération',
    fields: [
      { name: 'type', type: 'seg', value: t.type, options: [{ value: 'expense', label: 'Dépense', cls: 'exp' }, { value: 'income', label: 'Revenu', cls: 'inc' }] },
      { name: 'amount', label: 'Montant', type: 'amount', value: t.amount, required: true },
      { name: 'label', label: 'Libellé', value: t.label, placeholder: 'ex. Carrefour, Loyer…' },
      { name: 'categoryId', label: 'Catégorie', type: 'select', value: t.categoryId, options: catOptions(t.type) },
      { name: 'date', label: 'Date', type: 'date', value: t.date, required: true },
      { name: 'note', label: 'Note (facultatif)', value: t.note || '' },
    ],
    onChange: d => {
      if (d.type !== currentType) {
        currentType = d.type;
        const sel = modalForm.querySelector('select[name="categoryId"]');
        sel.innerHTML = catOptions(d.type).map(o => `<option value="${o.value}">${esc(o.label)}</option>`).join('');
      }
    },
    onSubmit: d => {
      const amount = requireAmount(d.amount); if (amount == null) return false;
      const obj = { ...t, type: d.type, amount, label: d.label.trim(), categoryId: d.categoryId, date: d.date, note: d.note.trim() };
      if (isNew) { obj.id = uid(); obj.created = Date.now(); state.transactions.push(obj); }
      else Object.assign(state.transactions.find(x => x.id === t.id), obj);
      if (!d.date.startsWith(ui.month)) ui.month = d.date.slice(0, 7);
      toast(isNew ? 'Opération ajoutée' : 'Opération modifiée');
    },
    onDelete: isNew ? null : () => { state.transactions = state.transactions.filter(x => x.id !== t.id); toast('Opération supprimée'); },
  });
}

function savingForm(goalId, direction = 1, existing = null) {
  if (!state.goals.length) { toast('Créez d’abord un objectif d’épargne'); return goalForm(); }
  const isNew = !existing;
  const s = existing || { goalId: goalId || state.goals[0].id, amount: '', date: defaultDate(), note: '' };
  const g = goalById(s.goalId);
  const plan = g ? goalPlan(g) : null;
  const dir = existing ? (existing.amount >= 0 ? 1 : -1) : direction;
  const rest = monthSummary(ui.month).rest;
  openForm({
    title: isNew ? (dir > 0 ? '🐷 Mettre de côté' : 'Retirer de l’épargne') : 'Modifier le mouvement',
    fields: [
      { name: 'dir', type: 'seg', value: dir > 0 ? 'in' : 'out', options: [{ value: 'in', label: 'Mettre de côté', cls: 'inc' }, { value: 'out', label: 'Retirer', cls: 'exp' }] },
      { name: 'goalId', label: 'Objectif', type: 'select', value: s.goalId, options: goalOptions() },
      { name: 'amount', label: 'Montant', type: 'amount', value: existing ? Math.abs(existing.amount) : '', required: true,
        help: isNew && plan && !plan.done && plan.suggested > 0 ? `Conseillé : ${money(plan.suggested)} / mois · Reste à vivre actuel : ${money(rest)}` : `Reste à vivre actuel : ${money(rest)}` },
      { name: 'date', label: 'Date', type: 'date', value: s.date, required: true },
      { name: 'note', label: 'Note (facultatif)', value: s.note || '' },
    ],
    onSubmit: d => {
      const amount = requireAmount(d.amount); if (amount == null) return false;
      const signedAmount = d.dir === 'out' ? -amount : amount;
      if (d.dir === 'out' && amount > goalBalance(d.goalId) + (existing && existing.goalId === d.goalId ? -existing.amount : 0) + 0.001) {
        if (!confirm('Le montant retiré est supérieur au solde de cet objectif. Continuer ?')) return false;
      }
      const obj = { ...s, goalId: d.goalId, amount: signedAmount, date: d.date, note: d.note.trim() };
      if (isNew) { obj.id = uid(); obj.created = Date.now(); state.savings.push(obj); }
      else Object.assign(state.savings.find(x => x.id === s.id), obj);
      if (!d.date.startsWith(ui.month)) ui.month = d.date.slice(0, 7);
      toast(d.dir === 'out' ? 'Retrait enregistré' : `${money(amount)} mis de côté 🎉`);
    },
    onDelete: isNew ? null : () => { state.savings = state.savings.filter(x => x.id !== s.id); toast('Mouvement supprimé'); },
  });
}

function goalForm(g) {
  const isNew = !g;
  g = g || { name: '', emoji: '🏖️', target: '', deadline: '', monthly: '', color: COLORS[state.goals.length % COLORS.length] };
  openForm({
    title: isNew ? 'Nouvel objectif d’épargne' : 'Modifier l’objectif',
    fields: [
      { name: 'name', label: 'Nom', value: g.name, required: true, placeholder: 'ex. Vacances en Grèce' },
      { name: 'emoji', label: 'Icône', type: 'emojis', value: g.emoji },
      { name: 'target', label: 'Montant à atteindre', type: 'amount', value: g.target, help: 'Laissez vide pour une épargne sans plafond.' },
      { name: 'deadline', label: 'Pour quand ? (facultatif)', type: 'month', value: g.deadline, help: 'L’appli calcule combien mettre de côté chaque mois.' },
      { name: 'monthly', label: 'Ou : montant mensuel prévu (si pas d’échéance)', type: 'amount', value: g.monthly || '' },
      { name: 'color', label: 'Couleur', type: 'colors', value: g.color },
      ...(isNew ? [{ name: 'initial', label: 'Déjà épargné (facultatif)', type: 'amount', value: '' }] : []),
    ],
    onSubmit: d => {
      if (!d.name.trim()) { toast('Donnez un nom à l’objectif'); return false; }
      const target = d.target ? requireAmount(d.target, true) : 0; if (target == null) return false;
      const monthly = d.monthly ? requireAmount(d.monthly, true) : 0; if (monthly == null) return false;
      const obj = { ...g, name: d.name.trim(), emoji: d.emoji || '💰', target, deadline: d.deadline || '', monthly, color: d.color || g.color };
      if (isNew) {
        obj.id = uid(); state.goals.push(obj);
        const init = d.initial ? parseAmount(d.initial) : 0;
        if (init > 0) state.savings.push({ id: uid(), goalId: obj.id, amount: init, date: `${currentYM()}-01`, note: 'Solde initial', initial: true, created: Date.now() });
        toast('Objectif créé');
      } else { Object.assign(state.goals.find(x => x.id === g.id), obj); toast('Objectif modifié'); }
    },
    onDelete: isNew ? null : () => {
      state.goals = state.goals.filter(x => x.id !== g.id);
      state.savings = state.savings.filter(x => x.goalId !== g.id);
      state.recurring = state.recurring.filter(r => !(r.kind === 'saving' && r.goalId === g.id));
      toast('Objectif supprimé');
    },
  });
}

function categoryForm(c, type) {
  const isNew = !c;
  c = c || { name: '', type, budget: '', color: COLORS[state.categories.length % COLORS.length], icon: '' };
  openForm({
    title: isNew ? 'Nouvelle catégorie' : 'Modifier la catégorie',
    fields: [
      { name: 'name', label: 'Nom', value: c.name, required: true },
      { name: 'icon', label: 'Emoji (facultatif)', value: c.icon, placeholder: 'ex. 🛒' },
      ...(c.type === 'expense' ? [{ name: 'budget', label: 'Budget mensuel', type: 'amount', value: c.budget || '', help: 'Laissez vide pour suivre sans plafond.' }] : []),
      { name: 'color', label: 'Couleur', type: 'colors', value: c.color },
    ],
    onSubmit: d => {
      if (!d.name.trim()) return false;
      const budget = d.budget ? requireAmount(d.budget, true) : 0; if (budget == null) return false;
      const obj = { ...c, name: d.name.trim(), icon: d.icon.trim(), budget, color: d.color || c.color };
      if (isNew) { obj.id = uid(); state.categories.push(obj); } else Object.assign(state.categories.find(x => x.id === c.id), obj);
    },
    onDelete: isNew ? null : () => {
      const used = state.transactions.filter(t => t.categoryId === c.id).length;
      const fallback = state.categories.find(x => x.type === c.type && x.id !== c.id);
      if (used && fallback) state.transactions.forEach(t => { if (t.categoryId === c.id) t.categoryId = fallback.id; });
      state.recurring.forEach(r => { if (r.categoryId === c.id && fallback) r.categoryId = fallback.id; });
      state.categories = state.categories.filter(x => x.id !== c.id);
      if (used && fallback) toast(`${used} opération(s) déplacée(s) vers « ${fallback.name} »`);
    },
  });
}

function recurringForm(r) {
  const isNew = !r;
  r = r || { kind: 'expense', label: '', amount: '', day: 1, categoryId: catOptions('expense')[0]?.value, goalId: state.goals[0]?.id, active: true, start: currentYM(), end: '' };
  const fields = [
    { name: 'kind', type: 'seg', value: r.kind, options: [{ value: 'expense', label: 'Charge', cls: 'exp' }, { value: 'income', label: 'Revenu', cls: 'inc' }, { value: 'saving', label: 'Épargne' }] },
    { name: 'label', label: 'Libellé', value: r.label, required: true, placeholder: 'ex. Loyer, Netflix, Salaire…' },
    { name: 'amount', label: 'Montant mensuel', type: 'amount', value: r.amount, required: true },
    { name: 'day', label: 'Jour du mois', type: 'number', value: r.day, min: 1, max: 31 },
    { name: 'categoryId', label: 'Catégorie', type: 'select', value: r.categoryId, options: catOptions(r.kind === 'income' ? 'income' : 'expense') },
    { name: 'goalId', label: 'Objectif d’épargne', type: 'select', value: r.goalId, options: goalOptions() },
    { name: 'start', label: 'À partir de', type: 'month', value: r.start || '' },
    { name: 'end', label: 'Jusqu’à (facultatif)', type: 'month', value: r.end || '', help: 'Pour un crédit ou un abonnement qui s’arrête.' },
    { name: 'active', label: 'Active', type: 'checkbox', value: r.active !== false },
  ];
  let lastKind = r.kind;
  openForm({
    title: isNew ? 'Nouvelle opération fixe' : 'Modifier l’opération fixe',
    fields,
    onChange: d => {
      const isSav = d.kind === 'saving';
      modalForm.querySelector('[data-field="categoryId"]').hidden = isSav;
      modalForm.querySelector('[data-field="goalId"]').hidden = !isSav;
      if (d.kind !== lastKind && !isSav) {
        const sel = modalForm.querySelector('select[name="categoryId"]');
        sel.innerHTML = catOptions(d.kind).map(o => `<option value="${o.value}">${esc(o.label)}</option>`).join('');
      }
      lastKind = d.kind;
    },
    onSubmit: d => {
      const amount = requireAmount(d.amount); if (amount == null) return false;
      if (d.kind === 'saving' && !d.goalId) { toast('Créez d’abord un objectif d’épargne'); return false; }
      const obj = { ...r, kind: d.kind, label: d.label.trim(), amount, day: Math.min(31, Math.max(1, parseInt(d.day) || 1)),
        categoryId: d.kind === 'saving' ? null : d.categoryId, goalId: d.kind === 'saving' ? d.goalId : null,
        start: d.start || '', end: d.end || '', active: d.active };
      if (isNew) { obj.id = uid(); state.recurring.push(obj); } else Object.assign(state.recurring.find(x => x.id === r.id), obj);
      toast('Opération fixe enregistrée');
    },
    onDelete: isNew ? null : () => { state.recurring = state.recurring.filter(x => x.id !== r.id); toast('Opération fixe supprimée (l’historique est conservé)'); },
  });
}

function reviewRecurring() {
  const pending = pendingRecurring(ui.month);
  openForm({
    title: `Opérations fixes — ${monthLabel(ui.month)}`,
    submitLabel: 'Ajouter la sélection',
    fields: pending.map(r => ({ name: r.id, type: 'checkbox', value: true,
      label: `${r.label} · ${r.kind === 'income' ? '+' : r.kind === 'saving' ? '→ ' : '−'}${money(r.amount)} (le ${r.day || 1})` })),
    onSubmit: d => {
      const chosen = pending.filter(r => d[r.id]);
      const skipped = pending.filter(r => !d[r.id]).map(r => r.id);
      applyRecurring(ui.month, chosen);
      if (skipped.length) state.dismissedRecurring[ui.month] = [...(state.dismissedRecurring[ui.month] || []), ...skipped];
      toast(`${chosen.length} opération(s) ajoutée(s)`);
    },
  });
}

function applyPlan() {
  const lines = state.goals.map(g => ({ g, p: goalPlan(g) })).filter(x => !x.p.done && x.p.suggested > 0).map(x => {
    const already = sum(savingsOfMonth(ui.month).filter(s => s.goalId === x.g.id), s => s.amount);
    return { ...x, todo: Math.max(0, Math.round((x.p.suggested - already) * 100) / 100) };
  }).filter(x => x.todo > 0);
  if (!lines.length) return toast('Plan déjà suivi ce mois-ci 👍');
  openForm({
    title: 'Répartir l’épargne du mois',
    submitLabel: 'Mettre de côté',
    fields: lines.map(x => ({ name: x.g.id, label: `${x.g.emoji} ${x.g.name}`, type: 'amount', value: x.todo })),
    onSubmit: d => {
      let total = 0;
      lines.forEach(x => { const a = parseAmount(d[x.g.id]); if (a > 0) { total += a; state.savings.push({ id: uid(), goalId: x.g.id, amount: a, date: defaultDate(), note: 'Plan mensuel', created: Date.now() }); } });
      toast(`${money(total)} mis de côté 🎉`);
    },
  });
}

/* ---------- Import / export ---------- */
function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function exportCSV() {
  const rows = [['Date', 'Type', 'Catégorie / Objectif', 'Libellé', 'Montant', 'Note']];
  txOfMonth(ui.month).sort((a, b) => a.date.localeCompare(b.date)).forEach(t =>
    rows.push([t.date, t.type === 'income' ? 'Revenu' : 'Dépense', catById(t.categoryId)?.name || '', t.label, (t.type === 'income' ? t.amount : -t.amount).toFixed(2).replace('.', ','), t.note || '']));
  savingsOfMonth(ui.month).forEach(s => rows.push([s.date, s.amount >= 0 ? 'Mise de côté' : 'Retrait épargne', goalById(s.goalId)?.name || '', s.note || '', (-s.amount).toFixed(2).replace('.', ','), '']));
  const csv = '﻿' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  download(`budget-${ui.month}.csv`, csv, 'text/csv;charset=utf-8');
}
document.getElementById('importFile').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || !Array.isArray(data.transactions)) throw new Error('format');
    if (!confirm('Remplacer toutes les données actuelles par cette sauvegarde ?')) return;
    state = normalize(data); save(); render(); toast('Sauvegarde importée ✅');
  } catch { toast('Fichier invalide'); }
});

function loadDemo() {
  const s = defaultState();
  const cat = n => s.categories.find(c => c.name === n).id;
  const budgets = { Logement: 750, Courses: 350, Transport: 120, 'Factures & abonnements': 110, Santé: 40, Loisirs: 80, Restaurants: 80, Shopping: 60, Divers: 40 };
  s.categories.forEach(c => { if (budgets[c.name]) c.budget = budgets[c.name]; });
  const [precaution, vacances] = s.goals;
  vacances.deadline = addMonths(currentYM(), 7); vacances.target = 1800;
  precaution.monthly = 100;
  s.recurring = [
    { id: uid(), kind: 'income', label: 'Salaire', amount: 2150, day: 1, categoryId: cat('Salaire'), active: true },
    { id: uid(), kind: 'expense', label: 'Loyer', amount: 720, day: 5, categoryId: cat('Logement'), active: true },
    { id: uid(), kind: 'expense', label: 'Électricité', amount: 55, day: 10, categoryId: cat('Factures & abonnements'), active: true },
    { id: uid(), kind: 'expense', label: 'Forfait téléphone', amount: 15, day: 12, categoryId: cat('Factures & abonnements'), active: true },
    { id: uid(), kind: 'expense', label: 'Pass Navigo', amount: 86.4, day: 2, categoryId: cat('Transport'), active: true },
    { id: uid(), kind: 'saving', label: 'Virement épargne précaution', amount: 100, day: 2, goalId: precaution.id, active: true },
  ];
  state = s;
  const variable = [['Courses', 'Supermarché', 60, 95], ['Courses', 'Marché', 15, 30], ['Restaurants', 'Resto', 18, 40], ['Loisirs', 'Cinéma', 10, 25], ['Shopping', 'Vêtements', 20, 60], ['Santé', 'Pharmacie', 8, 25], ['Divers', 'Cadeau', 15, 35]];
  for (let i = 5; i >= 0; i--) {
    const ym = addMonths(currentYM(), -i);
    const maxDay = i === 0 ? new Date().getDate() : daysInMonth(ym);
    applyRecurring(ym, state.recurring.filter(r => r.day <= maxDay));
    variable.forEach(([c, label, lo, hi], k) => {
      const times = c === 'Courses' ? 4 : 1 + (k % 2);
      for (let n = 0; n < times; n++) {
        const day = 1 + Math.floor(Math.random() * maxDay);
        state.transactions.push({ id: uid(), date: `${ym}-${pad(day)}`, label, amount: Math.round((lo + Math.random() * (hi - lo)) * 100) / 100, type: 'expense', categoryId: cat(c) });
      }
    });
    if (i > 0) state.savings.push({ id: uid(), goalId: vacances.id, amount: 150 + (i % 2) * 50, date: `${ym}-25`, note: 'Pour les vacances' });
  }
  save();
}

/* ---------- Événements ---------- */
document.addEventListener('click', e => {
  const tabBtn = e.target.closest('[data-tab], [data-tab-link]');
  if (tabBtn) { ui.tab = tabBtn.dataset.tab || tabBtn.dataset.tabLink; render(); window.scrollTo({ top: 0 }); return; }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const id = el.dataset.id;
  switch (el.dataset.action) {
    case 'prev-month': ui.month = addMonths(ui.month, -1); render(); break;
    case 'next-month': ui.month = addMonths(ui.month, 1); render(); break;
    case 'today-month': ui.month = currentYM(); render(); break;
    case 'add-transaction': transactionForm(); break;
    case 'edit-transaction': transactionForm(state.transactions.find(t => t.id === id)); break;
    case 'quick-saving': savingForm(null, 1); break;
    case 'deposit': savingForm(id, 1); break;
    case 'withdraw': savingForm(id, -1); break;
    case 'edit-saving': savingForm(null, 1, state.savings.find(s => s.id === id)); break;
    case 'add-goal': goalForm(); break;
    case 'edit-goal': goalForm(goalById(id)); break;
    case 'add-category': categoryForm(null, el.dataset.type); break;
    case 'edit-category': categoryForm(catById(id)); break;
    case 'add-recurring': recurringForm(); break;
    case 'edit-recurring': recurringForm(state.recurring.find(r => r.id === id)); break;
    case 'review-recurring': reviewRecurring(); break;
    case 'apply-recurring': { const p = pendingRecurring(ui.month); applyRecurring(ui.month, p); toast(`${p.length} opération(s) fixe(s) ajoutée(s)`); render(); break; }
    case 'apply-plan': applyPlan(); break;
    case 'export-json': download(`mon-budget-${todayISO()}.json`, JSON.stringify(state, null, 2), 'application/json'); toast('Sauvegarde téléchargée'); break;
    case 'import-json': document.getElementById('importFile').click(); break;
    case 'export-csv': exportCSV(); break;
    case 'demo': if (confirm('Remplacer vos données par des données d’exemple ?')) { loadDemo(); ui.tab = 'dashboard'; render(); toast('Données d’exemple chargées'); } break;
    case 'reset': if (confirm('Effacer TOUTES vos données ? Pensez à exporter une sauvegarde avant.')) { state = defaultState(); save(); render(); toast('Données effacées'); } break;
  }
});
view.addEventListener('input', e => {
  if (e.target.id === 'search') { ui.search = e.target.value; ui._focusSearch = true; render(); }
});
view.addEventListener('change', e => {
  if (e.target.id === 'typeFilter') { ui.typeFilter = e.target.value; render(); }
  if (e.target.id === 'catFilter') { ui.catFilter = e.target.value; render(); }
  if (e.target.id === 'currency') { state.settings.currency = e.target.value; save(); render(); toast('Devise mise à jour'); }
});

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

render();
