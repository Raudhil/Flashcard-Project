import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localData, seedDecks, withBuiltinDecks } from '../src/data.js';
import { createStudyQueue } from '../src/lib.js';

test('bundles all 13 JSON files in numeric order with the exact 236 source cards', () => {
  const [deck] = seedDecks();
  assert.equal(deck.builtin, true);
  assert.equal(deck.parts.length, 13);
  assert.equal(deck.parts.flatMap(part => part.cards).length, 236);
  for (let i = 0; i < 13; i++) {
    const number = String(i + 1).padStart(2, '0');
    const source = JSON.parse(readFileSync(new URL(`../json-mandarin/${number}.json`, import.meta.url), 'utf8'));
    assert.equal(deck.parts[i].name, `Part ${number}`);
    assert.deepEqual(deck.parts[i].cards.map(({ front, hint, back }) => ({ front, hint, back })), source);
  }
});

test('built-in IDs are stable and distinct, even for duplicated source rows', () => {
  const [first] = seedDecks();
  const [second] = seedDecks();
  assert.deepEqual(first, second);
  const ids = [first.id, ...first.parts.flatMap(part => [part.id, ...part.cards.map(card => card.id)])];
  assert.equal(new Set(ids).size, ids.length);
  const duplicates = first.parts[8].cards.filter(card => card.front === '高興');
  assert.equal(duplicates.length, 2);
  assert.notEqual(duplicates[0].id, duplicates[1].id);
  const known = first.parts[0].cards[0].id;
  assert.equal(createStudyQueue(second.parts[0].cards, { [known]: { mastered: true } }).includes(known), false);
});

test('adds built-ins to existing storage without changing personal decks or progress', () => {
  const personal = { id: 'personal-deck', name: 'Deck pribadi', parts: [] };
  const saved = { decks: [personal], progress: { customCard: { seen: true, mastered: true } } };
  const before = structuredClone(saved);
  const merged = withBuiltinDecks(saved);
  assert.equal(merged.decks.length, 2);
  assert.deepEqual(merged.decks[1], personal);
  assert.deepEqual(merged.progress, saved.progress);
  assert.deepEqual(saved, before);
  assert.equal(withBuiltinDecks({ decks: [], progress: {} }).decks.length, 1);
  assert.deepEqual(withBuiltinDecks(merged), merged);
});

test('always uses deployed built-in content and saves only personal decks plus progress', () => {
  const [builtin] = seedDecks();
  const personal = { id: 'personal-deck', name: 'Deck pribadi', parts: [] };
  const progress = { [builtin.parts[0].cards[0].id]: { seen: true, mastered: true } };
  const saved = { decks: [{ ...builtin, name: 'Old material', parts: [] }, personal], progress };
  const merged = withBuiltinDecks(saved);
  assert.deepEqual(merged.decks[0], builtin);
  assert.equal(merged.decks.length, 2);
  assert.deepEqual(localData(merged), { decks: [personal], progress });
  assert.deepEqual(withBuiltinDecks(localData(merged)), merged);
  // Recognize the reserved ID even if an older saved copy lacks the flag.
  assert.equal(withBuiltinDecks({ decks: [{ id: builtin.id, parts: [] }], progress: {} }).decks.length, 1);
});
