import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('home renders seeded decks and restores an empty saved collection', async () => {
  let saved = null;
  globalThis.document = { documentElement: { classList: { contains: () => false } } };
  globalThis.localStorage = { getItem: () => saved };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { default: App } = await server.ssrLoadModule('/src/App.jsx');
    const initial = renderToStaticMarkup(React.createElement(App));
    assert.match(initial, /Mandarin sehari-hari/);
    assert.match(initial, /Everyday English/);
    assert.match(initial, /Web development/);
    assert.match(initial, /Aktifkan mode gelap/);
    saved = JSON.stringify({ decks: [], progress: {} });
    const empty = renderToStaticMarkup(React.createElement(App));
    assert.doesNotMatch(empty, /Mandarin sehari-hari/);
    assert.match(empty, /Buat deck baru/);
    saved = '{invalid';
    const recovered = renderToStaticMarkup(React.createElement(App));
    assert.match(recovered, /Penyimpanan browser tidak dapat dibaca/);

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
