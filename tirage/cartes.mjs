// Source : livre-de-regle/index.html, chapitres 8, 12 et 13.
// Un exemplaire de chaque combinaison ; les quantités ne sont pas précisées dans le livret.
export const SOURCE = {
  url: 'https://github.com/kitout3/livre-de-regle/blob/fa0b3f6062b680fd73b447af3642576746ec080a/index.html',
  revision: 'fa0b3f6',
};
export const TARGETS = [
  { id: 'actuel', label: 'Joueur actuel', offset: 0 },
  { id: 'suivant', label: 'Joueur suivant', offset: 1 },
  { id: 'precedent', label: 'Joueur précédent', offset: -1 },
];
const effects = [
  ['or', 'Gain de 3 Or', 'Perte de 3 Or', 'Or', '3'],
  ['cuivre', 'Gain de 3 Cuivre', 'Perte de 3 Cuivre', 'Cuivre', '3'],
  ['argent', 'Gain de 2 Argent', 'Perte de 2 Argent', 'Argent', '2'],
  ['obsidienne', 'Gain de 1 Obsidienne', 'Perte de 1 Obsidienne', 'Obsidienne', '1'],
  ['competence', 'Rechargement de compétence', 'Déchargement de compétence', 'Compétence', null],
  ['potion', 'Rechargement de potion', 'Déchargement de potion', 'Potion', null],
  ['vie', 'Gain de 4 Points de Vie', 'Perte de 4 Points de Vie', 'Points de Vie', '4'],
  ['statistique', 'Bénédiction aléatoire', 'Malédiction aléatoire', 'Statistique', null],
];
export const ANOMALIES = effects.flatMap(([key, positive, negative, resource, value]) =>
  ['positive', 'negative'].flatMap((polarity) => TARGETS.map(target => ({
    id: `a-${key}-${polarity}-${target.id}`, kind: 'anomalie', polarity,
    title: polarity === 'positive' ? positive : negative,
    resource, value: value ? `${polarity === 'positive' ? '+' : '−'}${value}` : null,
    target: target.id,
  })))
);
const resources = [['Or', 3], ['Cuivre', 3], ['Argent', 2], ['Obsidienne', 1]];
const biomes = ['Cité', 'Forêt', 'Désert', 'Montagne'];
export const QUESTS = [
  ...resources.flatMap(([resource, unit], r) => [1, 2, 3].map(tier => ({
    id: `q-charite-${r}-${tier}`, kind: 'quete', family: 'charite',
    title: `Charité · ${resource}`, resource, tier, cost: unit * tier, reward: tier,
  }))),
  ...biomes.flatMap((biome, b) => [1, 2, 3].map(tier => ({
    id: `q-chasse-${b}-${tier}`, kind: 'quete', family: 'chasse',
    title: `Chasse · ${biome}`, biome, tier, difficulty: tier * 2, reward: tier,
  }))),
];
export const CARDS = Object.fromEntries([...ANOMALIES, ...QUESTS].map(card => [card.id, card]));
export const CATALOG = { quete: QUESTS, anomalie: ANOMALIES };
