import test from 'node:test';
import assert from 'node:assert/strict';
import { ANOMALIES, QUESTS } from './cartes.mjs';
import { newGame, validState, restoreState, draw, startAlteration, rebuildDeck, setPlayerCount } from './moteur.mjs';

test('catalogue : 48 anomalies et 24 quêtes sans identité dupliquée', () => {
  assert.equal(ANOMALIES.length, 48);
  assert.equal(QUESTS.length, 24);
  assert.equal(new Set([...ANOMALIES, ...QUESTS].map(c => c.id)).size, 72);
  assert.equal(ANOMALIES.filter(c => c.polarity === 'positive').length, 24);
  for (const target of ['actuel', 'suivant', 'precedent']) assert.equal(ANOMALIES.filter(c => c.target === target).length, 16);
  assert.deepEqual(QUESTS.filter(c => c.family === 'charite' && c.resource === 'Argent').map(c => [c.cost, c.reward]), [[2, 1], [4, 2], [6, 3]]);
});

test('tirages libres sans remise, épuisement et reconstitution', () => {
  const state = newGame();
  for (const kind of ['quete', 'anomalie']) {
    const seen = new Set();
    const total = state.decks[kind].length;
    for (let i = 0; i < total; i++) {
      const id = draw(state, kind);
      assert(!seen.has(id)); seen.add(id); assert(validState(state));
    }
    const before = JSON.stringify(state);
    assert.throws(() => draw(state, kind));
    assert.equal(JSON.stringify(state), before);
    rebuildDeck(state, kind);
    assert.equal(state.decks[kind].length, total);
    assert(validState(state));
  }
});

test('Altération : nombre de cartes, pioche commune et aucune attente entre les tirages', () => {
  for (const count of [2, 3, 4, 6, 8, 12, 48]) {
    const state = newGame(count);
    const event = startAlteration(state);
    assert.equal(event.cards.length, count);
    assert.equal(new Set(event.cards).size, count);
    assert.equal(state.decks.anomalie.length, 48 - count);
    assert.equal(state.history.length, count);
    // A batch never blocks another kind of draw, even without selecting any card.
    assert.doesNotThrow(() => draw(state, 'quete'));
    if (count < 48) {
      const id = draw(state, 'anomalie');
      assert(!event.cards.includes(id));
    }
    setPlayerCount(state, 2);
    assert.equal(state.event.cards.length, count);
    if (state.decks.anomalie.length >= 2) {
      const next = startAlteration(state);
      assert.equal(next.cards.length, 2);
      assert(next.cards.every(id => !event.cards.includes(id)));
    }
    assert(validState(JSON.parse(JSON.stringify(state))));
    rebuildDeck(state, 'anomalie');
    assert.equal(state.event, null);
    assert.equal(state.decks.anomalie.length, 48);
  }
});

test('pioche insuffisante : aucune Altération partielle, aucun état altéré', () => {
  const state = newGame(6);
  while (state.decks.anomalie.length >= 6) draw(state, 'anomalie');
  const before = JSON.stringify(state);
  assert.throws(() => startAlteration(state));
  assert.equal(JSON.stringify(state), before);
});

test('migration : reprendre une ancienne Altération inachevée sans conserver les tours', () => {
  const base = newGame(4);
  const questId = base.decks.quete.pop();
  const cards = base.decks.anomalie.splice(-4);
  const old = {
    version: 1, players: ['A', 'B', 'C', 'D'], current: 2,
    decks: base.decks, last: { quete: { id: questId, chooser: 2, target: 2 }, anomalie: null },
    eventCount: 1, event: { number: 1, starter: 2, cards, choices: [{ id: cards[0], chooser: 2, target: 3, global: false }] },
    history: [{ type: 'alteration', id: cards[0], number: 1, chooserName: 'C', targetName: 'D', at: 123 }, { type: 'quete', id: questId, chooserName: 'C', targetName: 'C', at: 100 }],
  };
  const state = restoreState(old);
  assert(validState(state));
  assert.equal(state.playerCount, 4);
  assert.deepEqual(state.decks, base.decks);
  assert.equal(state.last.quete, questId);
  assert.deepEqual(state.event.cards, cards);
  assert.equal(state.history.length, 5);
  for (const removed of ['players', 'current', 'chooserName', 'targetName', 'choices', 'starter']) assert(!JSON.stringify(state).includes(`"${removed}"`));
  assert.doesNotThrow(() => draw(state, 'quete'));
  assert.doesNotThrow(() => draw(state, 'anomalie'));
  assert.doesNotThrow(() => startAlteration(state));
});

test('validation : sauvegardes incorrectes et nombre de joueurs invalide', () => {
  assert.equal(restoreState({}), null);
  const state = newGame();
  assert.throws(() => setPlayerCount(state, 0));
  assert.throws(() => setPlayerCount(state, 3.5));
  assert.throws(() => setPlayerCount(state, 49));
  state.decks.anomalie.push(state.decks.anomalie[0]);
  assert(!validState(state));
  assert.equal(restoreState(state), null);
});
