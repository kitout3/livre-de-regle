import { CARDS, CATALOG, TARGETS } from './cartes.mjs';
import { newGame, validState, draw, startAlteration, chooseAnomaly, rebuildDeck, resizePlayers, targetIndex, eventActive } from './moteur.mjs';

const STORAGE = 'livre-regles-tirages-v1';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let state = newGame();
let mode = 'quete';
let storageAvailable = true;
let recovered = false;
try {
  const raw = localStorage.getItem(STORAGE);
  if (raw) {
    const stored = JSON.parse(raw);
    if (validState(stored)) { state = stored; if (eventActive(state)) mode = 'alteration'; }
    else recovered = true;
  }
} catch { storageAvailable = false; }

let toastTimeout;
function notify(message) {
  clearTimeout(toastTimeout);
  $('#status').textContent = message;
  $('#status').classList.add('show');
  toastTimeout = setTimeout(() => $('#status').classList.remove('show'), 5500);
}

function persist() {
  try { localStorage.setItem(STORAGE, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('#save-state').textContent = storageAvailable ? 'Partie sauvegardée sur cet appareil' : 'Sauvegarde indisponible : gardez cette page ouverte';
}

function transact(fn, message, animate = false) {
  try { fn(); persist(); render(); if (animate) $('.single-card')?.classList.add('revealed'); if (message) notify(typeof message === 'function' ? message() : message); }
  catch (error) { notify(error.message); }
}

const targetLabel = card => TARGETS.find(t => t.id === card.target)?.label ?? '';
const player = index => escape(state.players[index]);

function cardBody(card, chooser, options = {}) {
  if (card.kind === 'quete') {
    const charity = card.family === 'charite';
    return `<div class="card-head"><span>Quête de ${charity ? 'charité' : 'chasse'}</span><span class="card-number">Palier ${card.tier}</span></div>
      <h3>${escape(card.title)}</h3><p class="card-description">${charity ? `Donner <strong>${card.cost} ${escape(card.resource)}</strong>.` : `Vaincre un monstre de difficulté <strong>${card.difficulty}</strong> dans le biome <strong>${escape(card.biome)}</strong>.`}</p>
      <div class="card-value">${card.reward} <span style="font-size:.45em;letter-spacing:0">PV</span></div><p class="card-value-label">Récompense</p>
      <div class="card-bottom"><div class="target-caption">Quête attribuée à</div><strong class="recipient">${player(chooser)}</strong></div>
      <p class="card-footer-note">Tour de garde : 2 Or = 0 PV · 4 Or = 1 PV · 6 Or = 1 PV.</p>`;
  }
  const global = !!options.global;
  const actualTarget = global ? 'Tous les joueurs' : player(targetIndex(state, card, chooser));
  return `<div class="card-head"><span>Anomalie ${card.polarity === 'positive' ? 'positive' : 'négative'}</span><span class="card-number">${card.polarity === 'positive' ? '+' : '−'}</span></div>
    <h3>${escape(card.title)}</h3>
    ${card.value ? `<div class="card-value">${card.value}</div><p class="card-value-label">${escape(card.resource)}</p>` : `<div class="card-glyph" aria-hidden="true">${card.polarity === 'positive' ? '✧' : '◇'}</div><p class="card-description">Appliquez cet effet sur le plateau.</p>`}
    <div class="card-bottom"><div class="target-caption">${global ? 'Effet collectif · 2 PV' : escape(targetLabel(card))}</div><strong class="recipient">${actualTarget}</strong>${global ? '<span>Le joueur qui choisit est inclus.</span>' : `<span>Depuis ${player(chooser)}</span>`}</div>`;
}

function drawView() {
  const quest = mode === 'quete';
  const remaining = state.decks[mode].length;
  const total = CATALOG[mode].length;
  const latest = state.last[mode];
  const blocked = eventActive(state);
  return `<div class="draw-layout">
    <div class="draw-console"><h2 class="console-title">${quest ? 'Le paquet Quête' : 'Le paquet Anomalie'}</h2><p class="console-description">${quest ? 'Charité ou chasse : découvrez le prochain objectif de votre aventure.' : 'Un effet positif ou une malédiction, pour vous ou un autre joueur.'}</p>
      <div class="deck-icon" aria-hidden="true"><span>${quest ? '◇' : '✧'}</span></div>
      <div class="deck-state"><span>Cartes restantes</span><b>${remaining} / ${total}</b></div><div class="deck-track" aria-hidden="true"><i style="width:${remaining / total * 100}%"></i></div>
      <button class="primary-button" data-action="draw" ${!remaining || blocked ? 'disabled' : ''}>${!remaining ? 'Paquet épuisé' : `Tirer une ${quest ? 'quête' : 'anomalie'}`}</button>
      <button class="text-button" data-action="shuffle" data-kind="${mode}" ${blocked ? 'disabled' : ''}>Reconstituer le paquet</button>
    </div>
    <div class="draw-stage"><p class="stage-label">${latest ? 'Dernière carte révélée' : 'Votre prochaine carte'}</p>
      ${latest ? `<article class="game-card single-card ${CARDS[latest.id].polarity || ''}">${cardBody(CARDS[latest.id], latest.chooser)}</article>` : `<div class="empty-card"><span class="empty-symbol" aria-hidden="true">${quest ? '◇' : '✧'}</span><h3>À vous de tirer</h3><p>Sélectionnez le joueur, puis révélez une carte du paquet.</p></div>`}
    </div></div>
    ${blocked ? '<p class="rule-footnote"><b>Une Altération est en cours.</b> Retrouvez les cartes dans l’onglet Altération pour terminer les choix.</p>' : ''}`;
}

function alterationView() {
  const event = state.event;
  const count = state.players.length;
  const remaining = state.decks.anomalie.length;
  const active = eventActive(state);
  const enough = remaining >= count;
  const chooser = event ? (event.starter + event.choices.length) % count : state.current;
  const introduction = `<div class="event-intro"><div><h2>L’Altération</h2><p>Un palier de la fresque est atteint. Révélez <strong>${count} cartes</strong>, puis choisissez à tour de rôle en commençant par <strong>${player(event && active ? event.starter : state.current)}</strong>.</p></div>
    ${!active ? `<button class="primary-button" data-action="event" ${!enough ? 'disabled' : ''}>${event ? 'Nouvelle Altération' : `Révéler ${count} anomalies`}</button>` : ''}</div>`;
  let grid;
  if (!event) {
    grid = `<div class="event-empty"><div class="deck-icon" aria-hidden="true"><span>◈</span></div><div><h3>${count} joueurs, ${count} cartes</h3><p>Une carte par joueur. Toutes les anomalies sont visibles avant le premier choix.</p></div></div>`;
  } else {
    grid = `<div class="event-progress" role="status"><div><strong>${active ? `Au tour de ${player(chooser)}` : `Altération n° ${event.number} terminée`}</strong><p>${active ? 'Choisissez une carte disponible. Son effet s’applique immédiatement.' : 'Toutes les cartes ont été attribuées. Reprenez votre partie.'}</p></div><span>${event.choices.length} / ${count} choix</span></div>
      <div class="event-grid">${event.cards.map(id => {
        const card = CARDS[id];
        const choice = event.choices.find(c => c.id === id);
        return `<article class="game-card ${card.polarity} ${choice ? 'claimed' : ''}">${cardBody(card, choice ? choice.chooser : chooser, { global: choice?.global })}
          ${choice ? `<div class="claimed-badge">Choisie par <b>${player(choice.chooser)}</b>${choice.global ? '2 PV à placer dans la chambre forte.' : 'Effet attribué.'}</div>` : `<button class="choose-button" data-action="choose" data-id="${id}">Choisir cette anomalie</button><button class="global-button" data-action="global" data-id="${id}">Appliquer à tous · 2 PV</button>`}</article>`;
      }).join('')}</div>`;
  }
  return `${introduction}${grid}
    <p class="rule-footnote"><b>Effet collectif :</b> le joueur qui choisit peut déposer <b>2 Points de Victoire dans la chambre forte</b> pour appliquer l’effet à toute la table, lui compris.</p>
    <div class="event-tools"><p>${remaining} anomalies dans la pioche.${!active && !enough ? ` Il en faut ${count} pour lancer une Altération.` : ''}</p><button class="text-button" data-action="shuffle" data-kind="anomalie" ${active ? 'disabled' : ''}>Reconstituer le paquet</button></div>`;
}

function renderHistory() {
  const draws = state.history.filter(h => h.type !== 'shuffle');
  $('#history-count').textContent = `${draws.length}${state.history.length === 200 ? '+' : ''} tirage${draws.length > 1 ? 's' : ''}`;
  $('#history-list').innerHTML = state.history.length ? state.history.map(h => {
    const label = h.type === 'quete' ? 'Quête' : h.type === 'anomalie' ? 'Anomalie' : h.type === 'alteration' ? `Altération ${h.number}` : 'Paquet';
    const title = h.type === 'shuffle' ? `Paquet ${h.kind === 'quete' ? 'Quête' : 'Anomalie'} reconstitué` : CARDS[h.id].title;
    let detail = '';
    if (h.type !== 'shuffle') detail = `<p>${escape(h.chooserName)} · Cible : ${escape(h.targetName)}${h.global ? ' · 2 PV dans la chambre forte' : ''}</p>`;
    return `<div class="history-item"><span class="history-type">${label}</span><div><h3>${escape(title)}</h3>${detail}</div><time datetime="${new Date(h.at).toISOString()}">${new Date(h.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time></div>`;
  }).join('') : '<p class="history-empty">Les cartes tirées et les choix d’Altération apparaîtront ici.</p>';
}

function render() {
  const active = eventActive(state);
  $('#player-count').value = state.players.length;
  $('#player-count').disabled = active;
  $('#minus-player').disabled = active || state.players.length <= 2;
  $('#plus-player').disabled = active || state.players.length >= 48;
  $('#edit-players').disabled = active;
  $('#active-player').disabled = active;
  $('#active-player').innerHTML = state.players.map((name, i) => `<option value="${i}" ${state.current === i ? 'selected' : ''}>${escape(name)}</option>`).join('');
  $('#active-label').textContent = mode === 'alteration' ? 'Joueur déclencheur' : 'Joueur qui pioche';
  $('#quest-count').textContent = state.decks.quete.length;
  $('#anomaly-count').textContent = state.decks.anomalie.length;
  $('#event-count').textContent = active ? `${state.event.choices.length}/${state.players.length}` : `${state.players.length} cartes`;
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
  dialogAction = null;
  if (dialogReturnFocus?.isConnected) dialogReturnFocus.focus();
  else $(`#tab-${mode}`).focus();
});
$('#dialog-confirm').addEventListener('click', () => {
  const action = dialogAction;
  $('#action-dialog').close();
  if (action) action();
});

$('#new-game').addEventListener('click', () => showDialog({
  title: 'Commencer une nouvelle partie ?',
  body: '<p>Les deux paquets seront complets et mélangés. Les tirages, l’Altération en cours et le journal seront effacés. Les noms et l’ordre des joueurs seront conservés.</p>',
  confirm: 'Nouvelle partie',
  onConfirm: () => transact(() => { const names = [...state.players]; state = newGame(names.length); state.players = names; }, 'Les paquets sont prêts pour une nouvelle partie.'),
}));

function updatePlayerCount(value) {
  if (value === state.players.length) return;
  transact(() => resizePlayers(state, value), 'Nombre de joueurs mis à jour.');
  $('#player-count').value = state.players.length;
}
$('#player-count').addEventListener('change', e => updatePlayerCount(Number(e.target.value)));
$('#minus-player').addEventListener('click', () => updatePlayerCount(state.players.length - 1));
$('#plus-player').addEventListener('click', () => updatePlayerCount(state.players.length + 1));
$('#active-player').addEventListener('change', e => transact(() => { state.current = Number(e.target.value); }));
$('#edit-players').addEventListener('click', () => showDialog({
  title: 'Les joueurs, dans l’ordre de jeu',
  body: `<p>Le joueur suivant est le nom suivant dans cette liste. Après le dernier, on revient au premier.</p><div class="names-list">${state.players.map((name, i) => `<label>Place ${i + 1}<input data-player-name="${i}" type="text" maxlength="32" value="${escape(name)}" autocomplete="off"></label>`).join('')}</div>`,
  confirm: 'Enregistrer',
  onConfirm: () => {
    const names = [...document.querySelectorAll('[data-player-name]')].map((input, i) => input.value.trim() || `Joueur ${i + 1}`);
    transact(() => { state.players = names; }, 'Noms et ordre de jeu enregistrés.');
  },
}));

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

$('#play-area').addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'draw') {
    transact(() => draw(state, mode), () => `${CARDS[state.last[mode].id].title}. ${mode === 'quete' ? 'Quête pour' : 'Cible :'} ${state.players[state.last[mode].target]}.`, true);
    $('[data-action="draw"]')?.focus();
  }
  if (action === 'event') {
    transact(() => startAlteration(state), `${state.players.length} anomalies révélées. ${state.players[state.current]} choisit en premier.`);
    $('[data-action="choose"]')?.focus();
  }
  if (action === 'shuffle') {
    const kind = button.dataset.kind;
    showDialog({ title: `Reconstituer le paquet ${kind === 'quete' ? 'Quête' : 'Anomalie'} ?`,
      body: `<p>Les ${CATALOG[kind].length} cartes de ce paquet seront remises en pioche et mélangées, y compris celles déjà tirées.</p><p class="warning">Vérifiez que les cartes encore en jeu peuvent être remises dans le paquet.</p>`,
      confirm: 'Reconstituer et mélanger', onConfirm: () => transact(() => rebuildDeck(state, kind), 'Le paquet a été reconstitué et mélangé.'),
    });
  }
  if (action === 'choose' || action === 'global') {
    const id = button.dataset.id;
    const card = CARDS[id];
    if (!eventActive(state) || !card) return;
    const global = action === 'global';
    const chooser = (state.event.starter + state.event.choices.length) % state.players.length;
    const recipient = global ? 'tous les joueurs, y compris le joueur qui choisit' : player(targetIndex(state, card, chooser));
    showDialog({ title: global ? 'Appliquer l’effet à toute la table ?' : 'Confirmer ce choix ?',
      body: `<p><strong>${player(chooser)}</strong> choisit cette carte.</p><div class="dialog-card-summary"><p><strong>${escape(card.title)}</strong></p><p>Cible : ${recipient}.</p></div>${global ? `<p class="warning">${player(chooser)} doit placer <strong>2 Points de Victoire dans la chambre forte</strong>. Confirmez après avoir vérifié qu’il peut payer ce coût.</p>` : '<p>L’effet s’applique immédiatement sur le plateau, puis le joueur suivant choisit.</p>'}`,
      confirm: global ? 'Payer 2 PV et appliquer' : 'Confirmer et appliquer',
      onConfirm: () => {
        transact(() => chooseAnomaly(state, id, global), () => eventActive(state) ? 'Carte attribuée. Au joueur suivant de choisir.' : 'Altération terminée. Toutes les cartes ont été attribuées.');
      },
    });
  }
});

// Keep multiple tabs on the same device aligned with the most recent local save.
window.addEventListener('storage', event => {
  if (event.key !== STORAGE || !event.newValue) return;
  try {
    const incoming = JSON.parse(event.newValue);
    if (validState(incoming)) {
      $('#action-dialog').close(); state = incoming;
      if (eventActive(state)) mode = 'alteration';
      render(); notify('La partie a été mise à jour depuis un autre onglet.');
    }
  } catch { /* Ignore malformed external changes. */ }
});

persist(); render();
if (recovered) notify('L’ancienne sauvegarde était incompatible. Une nouvelle partie a été préparée.');
if (!storageAvailable) notify('La sauvegarde est indisponible. Gardez cette page ouverte pour conserver vos tirages.');
