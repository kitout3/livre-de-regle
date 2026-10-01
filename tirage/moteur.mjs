import { CARDS, CATALOG, TARGETS } from './cartes.mjs';

export function randomIndex(size) {
  if (!Number.isInteger(size) || size < 1) throw new Error('Taille de tirage invalide.');
  const limit = 2 ** 32 - ((2 ** 32) % size);
  const value = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % size;
}

export function shuffle(values, pick = randomIndex) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function newGame(count = 4) {
  if (!Number.isInteger(count) || count < 2 || count > 48) throw new Error('Choisissez entre 2 et 48 joueurs.');
  return {
    version: 1,
    players: Array.from({ length: count }, (_, i) => `Joueur ${i + 1}`),
    current: 0,
    decks: Object.fromEntries(Object.entries(CATALOG).map(([kind, cards]) => [kind, shuffle(cards.map(c => c.id))])),
    last: { quete: null, anomalie: null },
    event: null, eventCount: 0, history: [],
  };
}

export const eventActive = state => !!state.event && state.event.choices.length < state.players.length;

export function targetIndex(state, card, chooser) {
  const offset = TARGETS.find(t => t.id === card.target)?.offset ?? 0;
  return (chooser + offset + state.players.length) % state.players.length;
}

function addHistory(state, entry) {
  state.history.unshift({ ...entry, at: Date.now() });
  state.history = state.history.slice(0, 200);
}

export function draw(state, kind) {
  if (eventActive(state)) throw new Error('Terminez l’Altération en cours avant un autre tirage.');
  if (!CATALOG[kind]) throw new Error('Paquet inconnu.');
  if (!state.decks[kind].length) throw new Error('Le paquet est épuisé. Reconstituez-le pour continuer.');
  const id = state.decks[kind].pop();
  const card = CARDS[id];
  const result = { id, chooser: state.current, target: kind === 'anomalie' ? targetIndex(state, card, state.current) : state.current };
  state.last[kind] = result;
  addHistory(state, { type: kind, id, chooserName: state.players[result.chooser], targetName: state.players[result.target] });
  return result;
}

export function startAlteration(state) {
  if (eventActive(state)) throw new Error('Une Altération est déjà en cours.');
  const count = state.players.length;
  if (state.decks.anomalie.length < count) throw new Error(`Il faut ${count} cartes ; il n’en reste que ${state.decks.anomalie.length}. Reconstituez le paquet Anomalie.`);
  state.eventCount += 1;
  state.event = { number: state.eventCount, starter: state.current, cards: state.decks.anomalie.splice(-count), choices: [] };
  return state.event;
}

export function chooseAnomaly(state, id, global = false) {
  if (!eventActive(state)) throw new Error('Aucune Altération à résoudre.');
  if (!state.event.cards.includes(id) || state.event.choices.some(c => c.id === id)) throw new Error('Cette carte n’est plus disponible.');
  const chooser = (state.event.starter + state.event.choices.length) % state.players.length;
  const target = targetIndex(state, CARDS[id], chooser);
  const choice = { id, chooser, target, global: !!global };
  state.event.choices.push(choice);
  addHistory(state, {
    type: 'alteration', number: state.event.number, id, global: !!global,
    chooserName: state.players[chooser], targetName: global ? 'Tous les joueurs' : state.players[target],
  });
  return choice;
}

export function rebuildDeck(state, kind) {
  if (eventActive(state)) throw new Error('Terminez d’abord l’Altération en cours.');
  if (!CATALOG[kind]) throw new Error('Paquet inconnu.');
  state.decks[kind] = shuffle(CATALOG[kind].map(c => c.id));
  state.last[kind] = null;
  addHistory(state, { type: 'shuffle', kind });
}

export function resizePlayers(state, count) {
  if (eventActive(state)) throw new Error('Terminez l’Altération avant de modifier les joueurs.');
  if (!Number.isInteger(count) || count < 2 || count > 48) throw new Error('Choisissez entre 2 et 48 joueurs.');
  const previous = state.players;
  state.players = Array.from({ length: count }, (_, i) => previous[i] || `Joueur ${i + 1}`);
  state.current = Math.min(state.current, count - 1);
  state.last = { quete: null, anomalie: null };
  state.event = null;
}

// Reject invalid/obsolete device-local state rather than producing incomplete draws.
export function validState(s) {
  if (!s || s.version !== 1 || !Array.isArray(s.players) || s.players.length < 2 || s.players.length > 48 || !s.players.every(p => typeof p === 'string' && p.length > 0 && p.length <= 32)) return false;
  const playerIndex = i => Number.isInteger(i) && i >= 0 && i < s.players.length;
  if (!playerIndex(s.current) || !Number.isInteger(s.eventCount) || s.eventCount < 0 || !Array.isArray(s.history) || s.history.length > 200 || !s.last) return false;
  for (const [kind, catalog] of Object.entries(CATALOG)) {
    const ids = s.decks?.[kind];
    if (!Array.isArray(ids) || ids.length > catalog.length || new Set(ids).size !== ids.length || !ids.every(id => CARDS[id]?.kind === kind)) return false;
    const last = s.last[kind];
    if (last !== null && (!last || CARDS[last.id]?.kind !== kind || !playerIndex(last.chooser) || !playerIndex(last.target) || ids.includes(last.id))) return false;
  }
  if (!s.history.every(h => h && Number.isFinite(h.at) && (h.type === 'shuffle' ? !!CATALOG[h.kind] : ['quete', 'anomalie', 'alteration'].includes(h.type) && !!CARDS[h.id] && typeof h.chooserName === 'string' && typeof h.targetName === 'string'))) return false;
  if (s.event !== null) {
    const e = s.event;
    if (!e || !Number.isInteger(e.number) || e.number < 1 || !playerIndex(e.starter) || !Array.isArray(e.cards) || e.cards.length !== s.players.length || new Set(e.cards).size !== e.cards.length || !e.cards.every(id => CARDS[id]?.kind === 'anomalie') || !Array.isArray(e.choices) || e.choices.length > e.cards.length) return false;
    if (new Set(e.choices.map(c => c.id)).size !== e.choices.length || !e.choices.every((c, i) => e.cards.includes(c.id) && c.chooser === (e.starter + i) % s.players.length && playerIndex(c.target) && typeof c.global === 'boolean')) return false;
    if (e.choices.length < s.players.length && e.cards.some(id => s.decks.anomalie.includes(id))) return false;
  }
  return true;
}
