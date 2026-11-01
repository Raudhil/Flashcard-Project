import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('home includes built-in materials for new and returning browsers, and study renders correctly', async () => {
  let saved = null;
  globalThis.document = { documentElement: { classList: { contains: () => false } } };
  globalThis.localStorage = { getItem: () => saved };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: App, DeckView } = await server.ssrLoadModule('/src/App.jsx');
    const { seedDecks } = await server.ssrLoadModule('/src/data.js');
    const initial = renderToStaticMarkup(React.createElement(App));
    assert.match(initial, /Mandarin — Materi 01–13/);
    assert.match(initial, /236 kartu/);
    assert.match(initial, /MATERI BAWAAN/);
    assert.match(initial, /Aktifkan mode gelap/);
    saved = JSON.stringify({ decks: [], progress: {} });
    const empty = renderToStaticMarkup(React.createElement(App));
    assert.match(empty, /Mandarin — Materi 01–13/);
    assert.match(empty, /Buat deck baru/);
    saved = JSON.stringify({ decks: [{ id: 'personal', name: 'Koleksi pribadi lama', description: '', parts: [], color: 'mint' }], progress: {} });
    const returning = renderToStaticMarkup(React.createElement(App));
    assert.match(returning, /Mandarin — Materi 01–13/);
    assert.match(returning, /Koleksi pribadi lama/);
    saved = '{invalid';
    const recovered = renderToStaticMarkup(React.createElement(App));
    assert.match(recovered, /Penyimpanan browser tidak dapat dibaca/);

    const deckProps = { deck: seedDecks()[0], progress: {}, back: () => {}, study: () => {}, addPart: () => {}, editPart: () => {}, editDeck: () => {}, deleteDeck: () => {}, deletePart: () => {}, notify: () => {} };
    const builtinView = renderToStaticMarkup(React.createElement(DeckView, deckProps));
    assert.match(builtinView, /Part 01/);
    assert.match(builtinView, /Part 13/);
    assert.match(builtinView, /Ekspor deck/);
    assert.equal((builtinView.match(/>Belajar /g) || []).length, 13);
    assert.doesNotMatch(builtinView, /aria-label="Edit |aria-label="Hapus |Tambah part/);
    const personalView = renderToStaticMarkup(React.createElement(DeckView, { ...deckProps, deck: { ...deckProps.deck, builtin: false } }));
    assert.match(personalView, /aria-label="Edit deck"/);
    assert.match(personalView, /aria-label="Hapus deck"/);
    assert.match(personalView, /Tambah part/);

    const { default: Study } = await server.ssrLoadModule('/src/Study.jsx');
    const props = {
      deck: { name: 'Test deck', color: 'pink' },
      part: { name: 'Test part', cards: [{ id: 'known', front: 'Already understood question', back: 'Already understood answer' }, { id: 'unknown', front: 'Question still to learn', back: 'Answer still to learn' }] },
      progress: { known: { seen: true, mastered: true } },
      back: () => {}, updateProgress: () => {}, confirm: () => {}, notify: () => {},
    };
    const studying = renderToStaticMarkup(React.createElement(Study, props));
    assert.match(studying, /Question still to learn/);
    assert.doesNotMatch(studying, /Already understood question/);
    assert.match(studying, /Tidak paham/);
    assert.match(studying, /> Paham /);
    assert.match(studying, /1 kartu tersisa/);
    assert.equal((studying.match(/disabled=""/g) || []).length, 2);
    assert.doesNotMatch(studying, /Sebelumnya|Berikutnya|Sembunyikan dikuasai/);
    const completed = renderToStaticMarkup(React.createElement(Study, { ...props, progress: { ...props.progress, unknown: { mastered: true } } }));
    assert.match(completed, /Semua kartu sudah dipahami!/);
    assert.doesNotMatch(completed, /Question still to learn|Already understood question|class="flashcard-face"/);
  } finally {
    await server.close();
    delete globalThis.document;
    delete globalThis.localStorage;
  }
});
