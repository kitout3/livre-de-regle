import { CARDS, CATALOG, TARGETS } from './cartes.mjs';
import { newGame, restoreState, draw, startAlteration, rebuildDeck, setPlayerCount } from './moteur.mjs?v=2';

const STORAGE = 'livre-regles-tirages-v2';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let state = newGame();
let mode = 'quete';
let storageAvailable = true;
let recovered = false;
try {
  const raw = localStorage.getItem(STORAGE) ?? localStorage.getItem('livre-regles-tirages-v1');
  if (raw) {
    const saved = restoreState(JSON.parse(raw));
    if (saved) state = saved;
    else recovered = true;
  }
} catch { recovered = true; }

let toastTimeout;
function notify(message) {
  clearTimeout(toastTimeout);
  $('#status').textContent = message;
  $('#status').classList.add('show');
  toastTimeout = setTimeout(() => $('#status').classList.remove('show'), 4500);
}

function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('#save-state').textContent = storageAvailable ? 'Tirages sauvegardés sur cet appareil' : 'Sauvegarde indisponible : gardez cette page ouverte';
}

function transact(fn, message, animate = false) {
  try { fn(); persist(); render(); if (animate) $('.single-card')?.classList.add('revealed'); if (message) notify(typeof message === 'function' ? message() : message); }
  catch (error) { notify(error.message); }
}

const targetLabel = card => TARGETS.find(t => t.id === card.target)?.label ?? '';

function cardBody(card) {
  if (card.kind === 'quete') {
    const charity = card.family === 'charite';
    return `<div class="card-head"><span>Quête de ${charity ? 'charité' : 'chasse'}</span><span class="card-number">Palier ${card.tier}</span></div>
      <h3>${escape(card.title)}</h3><p class="card-description">${charity ? `Donner <strong>${card.cost} ${escape(card.resource)}</strong>.` : `Vaincre un monstre de difficulté <strong>${card.difficulty}</strong> dans le biome <strong>${escape(card.biome)}</strong>.`}</p>
      <div class="card-value">${card.reward} <span style="font-size:.45em;letter-spacing:0">PV</span></div><p class="card-value-label">Récompense</p>
      <div class="card-bottom"><p class="card-footer-note">Tour de garde : 2 Or = 0 PV · 4 Or = 1 PV · 6 Or = 1 PV.</p></div>`;
  }
  return `<div class="card-head"><span>Anomalie ${card.polarity === 'positive' ? 'positive' : 'négative'}</span><span class="card-number">${card.polarity === 'positive' ? '+' : '−'}</span></div>
    <h3>${escape(card.title)}</h3>
    ${card.value ? `<div class="card-value">${card.value}</div><p class="card-value-label">${escape(card.resource)}</p>` : `<div class="card-glyph" aria-hidden="true">${card.polarity === 'positive' ? '✧' : '◇'}</div><p class="card-description">Appliquez cet effet sur le plateau.</p>`}
    <div class="card-bottom"><div class="target-caption">Cible de la carte</div><strong class="recipient">${escape(targetLabel(card))}</strong></div>`;
}

function drawView() {
  const quest = mode === 'quete';
  const remaining = state.decks[mode].length;
  const total = CATALOG[mode].length;
  const latest = state.last[mode];
  return `<div class="draw-layout">
    <div class="draw-console"><h2 class="console-title">${quest ? 'Le paquet Quête' : 'Le paquet Anomalie'}</h2><p class="console-description">${quest ? 'Charité ou chasse : révélez une carte.' : 'Un effet positif ou une malédiction : révélez une carte.'}</p>
      <div class="deck-icon" aria-hidden="true"><span>${quest ? '◇' : '✧'}</span></div>
      <div class="deck-state"><span>Cartes restantes</span><b>${remaining} / ${total}</b></div><div class="deck-track" aria-hidden="true"><i style="width:${remaining / total * 100}%"></i></div>
      <button class="primary-button" data-action="draw" ${!remaining ? 'disabled' : ''}>${!remaining ? 'Paquet épuisé' : `Tirer une ${quest ? 'quête' : 'anomalie'}`}</button>
      <button class="text-button" data-action="shuffle" data-kind="${mode}">Reconstituer le paquet</button>
    </div>
    <div class="draw-stage"><p class="stage-label">${latest ? 'Dernière carte révélée' : 'Votre prochaine carte'}</p>
      ${latest ? `<article class="game-card single-card ${CARDS[latest].polarity || ''}">${cardBody(CARDS[latest])}</article>` : `<div class="empty-card"><span class="empty-symbol" aria-hidden="true">${quest ? '◇' : '✧'}</span><h3>À vous de tirer</h3><p>Cliquez sur « Tirer une ${quest ? 'quête' : 'anomalie'} » pour révéler une carte.</p></div>`}
    </div></div>`;
}

function alterationView() {
  const event = state.event;
  const count = state.playerCount;
  const remaining = state.decks.anomalie.length;
  return `<div class="event-intro"><div><h2>L’Altération</h2><p>Révélez autant de cartes Anomalie que de joueurs.</p></div></div>
    <div class="alteration-controls"><div class="setting"><label for="player-count">Nombre de joueurs</label><div class="stepper"><button data-action="minus-player" aria-label="Retirer un joueur" ${count <= 2 ? 'disabled' : ''}>−</button><input id="player-count" type="number" value="${count}" min="2" max="48" inputmode="numeric"><button data-action="plus-player" aria-label="Ajouter un joueur" ${count >= 48 ? 'disabled' : ''}>+</button></div></div><button class="primary-button" data-action="event" ${remaining < count ? 'disabled' : ''}>Tirer ${count} anomalies</button><p>${remaining} cartes restantes</p></div>
    ${event ? `<p class="batch-label">Tirage n° ${event.number} · ${event.cards.length} anomalies révélées</p><div class="event-grid">${event.cards.map(id => `<article class="game-card ${CARDS[id].polarity}">${cardBody(CARDS[id])}</article>`).join('')}</div>` : `<div class="event-empty"><div class="deck-icon" aria-hidden="true"><span>◈</span></div><div><h3>${count} joueurs, ${count} cartes</h3><p>Les anomalies seront révélées ensemble.</p></div></div>`}
    <div class="event-tools"><p>${remaining < count ? `Il faut ${count} cartes pour ce tirage ; il en reste ${remaining}.` : 'Pioche commune avec les tirages Anomalie individuels.'}</p><button class="text-button" data-action="shuffle" data-kind="anomalie">Reconstituer le paquet</button></div>`;
}

function renderHistory() {
  const draws = state.history.filter(h => h.type !== 'shuffle');
  $('#history-count').textContent = `${draws.length}${state.history.length === 200 ? '+' : ''} carte${draws.length > 1 ? 's' : ''}`;
  $('#history-list').innerHTML = state.history.length ? state.history.map(h => {
    const label = h.type === 'quete' ? 'Quête' : h.type === 'anomalie' ? 'Anomalie' : h.type === 'alteration' ? `Altération ${h.number}` : 'Paquet';
    const card = CARDS[h.id];
    const title = h.type === 'shuffle' ? `Paquet ${h.kind === 'quete' ? 'Quête' : 'Anomalie'} reconstitué` : card.title;
    const detail = card?.kind === 'anomalie' ? `<p>${escape(targetLabel(card))}</p>` : card?.kind === 'quete' ? `<p>Palier ${card.tier} · ${card.reward} PV</p>` : '';
    return `<div class="history-item"><span class="history-type">${escape(label)}</span><div><h3>${escape(title)}</h3>${detail}</div><time datetime="${new Date(h.at).toISOString()}">${new Date(h.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time></div>`;
  }).join('') : '<p class="history-empty">Les cartes tirées apparaîtront ici.</p>';
}

function render() {
  $('#quest-count').textContent = state.decks.quete.length;
  $('#anomaly-count').textContent = state.decks.anomalie.length;
  $('#event-count').textContent = `${state.playerCount} cartes`;
  document.querySelectorAll('[data-mode]').forEach(tab => { const selected = tab.dataset.mode === mode; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
  $('#play-area').setAttribute('aria-labelledby', `tab-${mode}`);
  $('#play-area').innerHTML = mode === 'alteration' ? alterationView() : drawView();
  renderHistory();
}

let dialogAction = null;
let dialogReturnFocus = null;
function showDialog({ title, body, confirm = 'Confirmer', onConfirm }) {
  dialogReturnFocus = document.activeElement;
  $('#dialog-title').textContent = title;
  $('#dialog-content').innerHTML = body;
  $('#dialog-confirm').textContent = confirm;
  dialogAction = onConfirm;
  $('#action-dialog').showModal();
  $('#dialog-cancel').focus();
}
$('#dialog-cancel').addEventListener('click', () => $('#action-dialog').close());
$('#action-dialog').addEventListener('close', () => {
  if ($('#action-dialog').open) return;
  dialogAction = null;
  if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus();
  else $(`#tab-${mode}`).focus();
});
$('#dialog-confirm').addEventListener('click', () => {
  const action = dialogAction;
  dialogAction = null;
  $('#action-dialog').close();
  if (action) action();
});
$('#restart-draws').addEventListener('click', () => showDialog({
  title: 'Recommencer tous les tirages ?',
  body: '<p>Les 24 cartes Quête et les 48 cartes Anomalie seront remises en pioche et mélangées. Les tirages précédents et le journal seront effacés.</p><p>Le nombre de joueurs utilisé pour l’Altération sera conservé.</p>',
  confirm: 'Recommencer les tirages',
  onConfirm: () => transact(() => { state = newGame(state.playerCount); }, 'Tirages réinitialisés : 24 quêtes et 48 anomalies prêtes à être piochées.'),
}));

function updatePlayerCount(value) {
  try { setPlayerCount(state, value); persist(); }
  catch (error) { notify(error.message); }
  const count = state.playerCount;
  const remaining = state.decks.anomalie.length;
  // Keep the controls mounted: changing the input must not swallow the next click.
  if ($('#player-count')) $('#player-count').value = count;
  $('#event-count').textContent = `${count} cartes`;
  $('[data-action="minus-player"]').disabled = count <= 2;
  $('[data-action="plus-player"]').disabled = count >= 48;
  $('[data-action="event"]').textContent = `Tirer ${count} anomalies`;
  $('[data-action="event"]').disabled = remaining < count;
  const emptyTitle = $('.event-empty h3');
  if (emptyTitle) emptyTitle.textContent = `${count} joueurs, ${count} cartes`;
  $('.event-tools p').textContent = remaining < count ? `Il faut ${count} cartes pour ce tirage ; il en reste ${remaining}.` : 'Pioche commune avec les tirages Anomalie individuels.';
}
function setMode(value) { mode = value; render(); }
document.querySelectorAll('[data-mode]').forEach(tab => {
  tab.addEventListener('click', () => setMode(tab.dataset.mode));
  tab.addEventListener('keydown', event => {
    const modes = ['quete', 'anomalie', 'alteration'];
    let index = modes.indexOf(mode);
    if (event.key === 'ArrowRight') index = (index + 1) % 3;
    else if (event.key === 'ArrowLeft') index = (index + 2) % 3;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = 2;
    else return;
    event.preventDefault(); setMode(modes[index]); $(`#tab-${mode}`).focus();
  });
});
$('#play-area').addEventListener('change', event => {
  if (event.target.id === 'player-count') updatePlayerCount(Number(event.target.value));
});
$('#play-area').addEventListener('input', event => {
  if (event.target.id !== 'player-count') return;
  const count = Number(event.target.value);
  if (Number.isInteger(count) && count >= 2 && count <= 48) updatePlayerCount(count);
});
$('#play-area').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'draw') {
    transact(() => draw(state, mode), () => CARDS[state.last[mode]].title, true);
    $('[data-action="draw"]')?.focus();
  } else if (action === 'event') {
    transact(() => {
      setPlayerCount(state, Number($('#player-count').value));
      startAlteration(state);
    }, () => `${state.playerCount} anomalies révélées.`);
    $('[data-action="event"]')?.focus();
  } else if (action === 'minus-player' || action === 'plus-player') {
    updatePlayerCount(state.playerCount + (action === 'plus-player' ? 1 : -1));
    $(`[data-action="${action}"]`)?.focus();
  } else if (action === 'shuffle') {
    const kind = button.dataset.kind;
    showDialog({ title: `Reconstituer le paquet ${kind === 'quete' ? 'Quête' : 'Anomalie'} ?`,
      body: `<p>Les ${CATALOG[kind].length} cartes de ce paquet seront remises en pioche et mélangées, y compris celles déjà tirées.</p><p class="warning">Vérifiez que les cartes encore en jeu peuvent être remises dans le paquet.</p>`,
      confirm: 'Reconstituer et mélanger', onConfirm: () => transact(() => rebuildDeck(state, kind), 'Le paquet a été reconstitué et mélangé.'),
    });
  }
});
window.addEventListener('storage', event => {
  if (event.key !== STORAGE || !event.newValue) return;
  try {
    const incoming = restoreState(JSON.parse(event.newValue));
    if (incoming) { $('#action-dialog').close(); state = incoming; render(); notify('Les tirages ont été mis à jour depuis un autre onglet.'); }
  } catch { /* Ignore malformed external changes. */ }
});

persist(); render();
if (recovered) notify('La sauvegarde était incompatible. De nouveaux paquets ont été préparés.');
if (!storageAvailable) notify('La sauvegarde est indisponible. Gardez cette page ouverte pour conserver vos tirages.');
