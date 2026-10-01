import test from 'node:test';
import assert from 'node:assert/strict';
import { ANOMALIES, QUESTS } from './cartes.mjs';
import { newGame, validState, draw, startAlteration, chooseAnomaly, rebuildDeck, targetIndex, eventActive, resizePlayers } from './moteur.mjs';

test('catalogue : toutes les combinaisons attendues et aucune identité dupliquée', () => {
  assert.equal(ANOMALIES.length, 48);
  assert.equal(QUESTS.length, 24);
  assert.equal(new Set([...ANOMALIES, ...QUESTS].map(c => c.id)).size, 72);
  assert.equal(ANOMALIES.filter(c => c.polarity === 'positive').length, 24);
  for (const target of ['actuel', 'suivant', 'precedent']) assert.equal(ANOMALIES.filter(c => c.target === target).length, 16);
  assert.deepEqual(QUESTS.filter(c => c.family === 'charite' && c.resource === 'Argent').map(c => [c.cost, c.reward]), [[2, 1], [4, 2], [6, 3]]);
  assert(QUESTS.filter(c => c.family === 'chasse').every(c => c.difficulty === c.reward * 2));
});

test('pioche sans remise, arrêt à épuisement et reconstitution complète', () => {
  const state = newGame();
  for (const kind of ['quete', 'anomalie']) {
    const seen = new Set();
    const total = state.decks[kind].length;
    for (let i = 0; i < total; i++) {
      const { id } = draw(state, kind);
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

test('Altération : pioche commune, ordre circulaire, cibles et effet collectif de 2 à 48 joueurs', () => {
  for (const count of [2, 3, 4, 5, 6, 8, 12, 48]) {
    const state = newGame(count);
    state.current = count - 1;
    assert.equal(targetIndex(state, ANOMALIES.find(c => c.target === 'suivant'), count - 1), 0);
    assert.equal(targetIndex(state, ANOMALIES.find(c => c.target === 'precedent'), 0), count - 1);
    const event = startAlteration(state);
    assert.equal(event.cards.length, count);
    assert.equal(new Set(event.cards).size, count);
    assert.equal(state.decks.anomalie.length, 48 - count);
    assert(validState(state));
    assert.throws(() => draw(state, 'quete'));
    assert.throws(() => rebuildDeck(state, 'anomalie'));
    assert.throws(() => resizePlayers(state, 3));
    assert.throws(() => startAlteration(state));
    for (let i = 0; i < count; i++) {
      const choice = chooseAnomaly(state, event.cards[i], i === 0);
      assert.equal(choice.chooser, (count - 1 + i) % count);
      assert.equal(choice.global, i === 0);
      if (i === 0) assert.throws(() => chooseAnomaly(state, event.cards[0]));
      assert(validState(JSON.parse(JSON.stringify(state))));
    }
    assert(!eventActive(state));
    assert.equal(state.history.length, count);
    assert.equal(state.history.at(-1).targetName, 'Tous les joueurs');
    assert.throws(() => chooseAnomaly(state, event.cards[0]));
  }
});

test('une pioche insuffisante ne démarre pas une Altération partielle', () => {
  const state = newGame(6);
  while (state.decks.anomalie.length >= 6) draw(state, 'anomalie');
  const before = JSON.stringify(state);
  assert.throws(() => startAlteration(state));
  assert.equal(JSON.stringify(state), before);
});

test('validation et adaptation du nombre de joueurs', () => {
  const state = newGame();
  draw(state, 'quete');
  resizePlayers(state, 2);
  assert(validState(state));
  assert.equal(state.history.length, 1);
  assert.equal(state.last.quete, null);
  assert(!validState({}));
  assert(!validState({ ...newGame(), players: ['one'] }));
  const corrupted = newGame();
  corrupted.decks.anomalie.push(corrupted.decks.anomalie[0]);
  assert(!validState(corrupted));
});
