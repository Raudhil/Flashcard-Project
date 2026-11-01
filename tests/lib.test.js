import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCards, parseDeck, exportDeck, stats, shuffle, createStudyQueue, reviewStudyQueue } from '../src/lib.js';

test('parses canonical JSON and Mandarin aliases with optional hints', () => {
  const cards = parseCards('[{"front":"  你好  ","back":"Halo"},{"hanzi":"谢谢","pinyin":"xiè xie","answer":"Terima kasih"}]');
  assert.equal(cards[0].front, '你好'); assert.equal(cards[0].hint, '');
  assert.equal(cards[1].hint, 'xiè xie'); assert.notEqual(cards[0].id, cards[1].id);
  assert.equal(parseCards({ cards: [{ front: 'Q', back: 'A' }] }).length, 1);
});

test('rejects broken JSON, empty arrays, wrong data types and oversized parts', () => {
  for (const input of ['{bad}', '[]', '{}', '[null]', '[{"front":"Q","back":""}]', '[{"front":2,"back":"A"}]', '[{"front":"Q","hint":1,"back":"A"}]']) assert.throws(() => parseCards(input));
  assert.throws(() => parseCards(Array.from({ length: 2001 }, () => ({ front: 'Q', back: 'A' }))));
});

test('exports and reimports complete deck without leaking progress or retaining IDs', () => {
  const deck = { id: 'deck-original', name: 'Mandarin', description: 'Belajar', color: 'mint', parts: [{ id: 'part-original', name: 'Salam', cards: parseCards('[{"front":"你好","hint":"nǐ hǎo","back":"Halo"}]') }] };
  const exported = exportDeck(deck); const imported = parseDeck(JSON.stringify(exported));
  assert.deepEqual(exportDeck(imported), exported); assert.notEqual(imported.id, deck.id); assert.notEqual(imported.parts[0].cards[0].id, deck.parts[0].cards[0].id);
  assert.throws(() => parseDeck('{"name":"Deck","parts":[]}'));
  assert.throws(() => parseDeck('{"name":"Deck","parts":[null]}'));
});

test('counts mutually exclusive study states and ignores progress outside a part', () => {
  const cards = [{ id: '1' }, { id: '2' }, { id: '3' }];
  assert.deepEqual(stats(cards, { '1': { seen: true, mastered: true }, '2': { seen: true }, other: { mastered: true } }), { total: 3, mastered: 1, learning: 1, unseen: 1, percent: 33 });
  assert.equal(stats([], {}).percent, 0);
});

test('shuffle preserves every card without mutating its source', () => {
  const cards = Array.from({ length: 40 }, (_, id) => ({ id })); const before = [...cards]; const result = shuffle(cards);
  assert.deepEqual(cards, before); assert.notEqual(result, cards); assert.deepEqual(result.map(c => c.id).sort((a, b) => a - b), cards.map(c => c.id));
});

test('starts a randomized session that excludes saved understood cards', () => {
  const cards = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1) }));
  const progress = { '3': { seen: true, mastered: true }, '7': { seen: true, mastered: false } };
  const queue = createStudyQueue(cards, progress, () => 0);
  const unmastered = cards.filter(c => c.id !== '3').map(c => c.id);
  assert.notDeepEqual(queue, unmastered);
  assert.deepEqual([...queue].sort(), [...unmastered].sort());
  assert.equal(queue.includes('7'), true);
  assert.deepEqual(cards.map(c => c.id), Array.from({ length: 10 }, (_, i) => String(i + 1)));
  assert.deepEqual(createStudyQueue(cards, Object.fromEntries(cards.map(c => [c.id, { mastered: true }]))), []);
});

test('understood removes the current card; retries return at random later positions', () => {
  const queue = ['1', '2', '3', '4'];
  assert.deepEqual(reviewStudyQueue(queue, true), ['2', '3', '4']);
  assert.deepEqual(reviewStudyQueue(queue, false, () => 0), ['2', '1', '3', '4']);
  assert.deepEqual(reviewStudyQueue(queue, false, () => 0.5), ['2', '3', '1', '4']);
  assert.deepEqual(reviewStudyQueue(queue, false, () => 0.99), ['2', '3', '4', '1']);
  assert.deepEqual(queue, ['1', '2', '3', '4']);
});

test('a mixed session repeats unknown cards without losing cards or returning understood ones', () => {
  let queue = ['1', '2', '3', '4'];
  const understood = new Set();
  for (let attempt = 0; attempt < 30 && queue.length; attempt++) {
    const id = queue[0];
    assert.equal(understood.has(id), false);
    const known = attempt >= 5;
    if (known) understood.add(id);
    queue = reviewStudyQueue(queue, known, () => 0.5);
    assert.equal(new Set(queue).size, queue.length);
    assert.equal(queue.length + understood.size, 4);
    for (const mastered of understood) assert.equal(queue.includes(mastered), false);
    if (!known && queue.length > 1) assert.notEqual(queue[0], id);
  }
  assert.equal(understood.size, 4);
  assert.deepEqual(queue, []);
});

test('the final unknown card keeps returning until understood, including after resuming', () => {
  const cards = [{ id: 'one' }, { id: 'two' }];
  const progress = { one: { seen: true, mastered: true }, two: { seen: true, mastered: false } };
  let queue = createStudyQueue(cards, progress);
  for (let i = 0; i < 5; i++) queue = reviewStudyQueue(queue, false);
  assert.deepEqual(queue, ['two']);
  assert.deepEqual(reviewStudyQueue(queue, true), []);
  assert.deepEqual(reviewStudyQueue([], false), []);
  assert.deepEqual(createStudyQueue([], {}), []);
});
