import { CARDS, CATALOG } from './cartes.mjs';

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

const validCount = count => Number.isInteger(count) && count >= 2 && count <= 48;
const validDate = at => Number.isFinite(at) && at >= 0 && at <= 8640000000000000;

export function newGame(count = 4) {
  if (!validCount(count)) throw new Error('Choisissez entre 2 et 48 joueurs.');
  return {
    version: 2, playerCount: count,
    decks: Object.fromEntries(Object.entries(CATALOG).map(([kind, cards]) => [kind, shuffle(cards.map(c => c.id))])),
    last: { quete: null, anomalie: null },
    event: null, eventCount: 0, history: [],
  };
}

function addHistory(state, entry) {
  state.history.unshift({ ...entry, at: Date.now() });
  state.history = state.history.slice(0, 200);
}

export function draw(state, kind) {
  if (!CATALOG[kind]) throw new Error('Paquet inconnu.');
  if (!state.decks[kind].length) throw new Error('Le paquet est épuisé. Reconstituez-le pour continuer.');
  const id = state.decks[kind].pop();
  state.last[kind] = id;
  addHistory(state, { type: kind, id });
  return id;
}

export function startAlteration(state) {
  const count = state.playerCount;
  if (state.decks.anomalie.length < count) throw new Error(`Il faut ${count} cartes ; il n’en reste que ${state.decks.anomalie.length}. Reconstituez le paquet Anomalie.`);
  state.eventCount += 1;
  state.event = { number: state.eventCount, cards: state.decks.anomalie.splice(-count) };
  for (const id of [...state.event.cards].reverse()) addHistory(state, { type: 'alteration', number: state.event.number, id });
  return state.event;
}

export function rebuildDeck(state, kind) {
  if (!CATALOG[kind]) throw new Error('Paquet inconnu.');
  state.decks[kind] = shuffle(CATALOG[kind].map(c => c.id));
  state.last[kind] = null;
  if (kind === 'anomalie') state.event = null;
  addHistory(state, { type: 'shuffle', kind });
}

export function setPlayerCount(state, count) {
  if (!validCount(count)) throw new Error('Choisissez entre 2 et 48 joueurs.');
  state.playerCount = count;
}

export function validState(s) {
  if (!s || s.version !== 2 || !validCount(s.playerCount) || !Number.isInteger(s.eventCount) || s.eventCount < 0 || !s.last || !Array.isArray(s.history) || s.history.length > 200) return false;
  for (const [kind, catalog] of Object.entries(CATALOG)) {
    const ids = s.decks?.[kind];
    if (!Array.isArray(ids) || ids.length > catalog.length || new Set(ids).size !== ids.length || !ids.every(id => CARDS[id]?.kind === kind)) return false;
    const last = s.last[kind];
    if (last !== null && (CARDS[last]?.kind !== kind || ids.includes(last))) return false;
  }
  if (!s.history.every(h => h && validDate(h.at) && (h.type === 'shuffle' ? !!CATALOG[h.kind] : h.type === 'alteration' ? CARDS[h.id]?.kind === 'anomalie' && Number.isInteger(h.number) && h.number > 0 : ['quete', 'anomalie'].includes(h.type) && CARDS[h.id]?.kind === h.type))) return false;
  if (s.event !== null) {
    const e = s.event;
    if (!e || !Number.isInteger(e.number) || e.number < 1 || e.number > s.eventCount || !Array.isArray(e.cards) || !validCount(e.cards.length) || new Set(e.cards).size !== e.cards.length || !e.cards.every(id => CARDS[id]?.kind === 'anomalie' && !s.decks.anomalie.includes(id))) return false;
  }
  return true;
}

// Preserve already drawn cards while discarding the former player/turn workflow.
export function restoreState(saved) {
  if (saved?.version === 2) return validState(saved) ? saved : null;
  if (saved?.version !== 1 || !Array.isArray(saved.players) || !validCount(saved.players.length) || !Array.isArray(saved.decks?.quete) || !Array.isArray(saved.decks?.anomalie) || !saved.last || !Array.isArray(saved.history) || (saved.event && !Array.isArray(saved.event.cards))) return null;
  const state = {
    version: 2, playerCount: saved.players.length,
    decks: { quete: saved.decks.quete?.slice(), anomalie: saved.decks.anomalie?.slice() },
    last: { quete: saved.last.quete?.id ?? null, anomalie: saved.last.anomalie?.id ?? null },
    eventCount: saved.eventCount,
    event: saved.event ? { number: saved.event.number, cards: saved.event.cards?.slice() } : null,
    history: saved.history.map(h => h?.type === 'shuffle'
      ? { type: h.type, kind: h.kind, at: h.at }
      : { type: h?.type, id: h?.id, ...(h?.type === 'alteration' ? { number: h.number } : {}), at: h?.at }),
  };
  if (state.event?.cards && Array.isArray(state.decks.anomalie)) {
    if (state.event.cards.some(id => state.decks.anomalie.includes(id))) state.event = null;
    else {
      const at = state.history.find(h => h.type === 'alteration' && h.number === state.event.number)?.at ?? Date.now();
      const missing = state.event.cards.filter(id => !state.history.some(h => h.type === 'alteration' && h.number === state.event.number && h.id === id));
      state.history.unshift(...missing.map(id => ({ type: 'alteration', number: state.event.number, id, at })));
    }
  }
  state.history = state.history.slice(0, 200);
  return validState(state) ? state : null;
}
