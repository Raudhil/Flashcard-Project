import lesson01 from '../json-mandarin/01.json' with { type: 'json' };
import lesson02 from '../json-mandarin/02.json' with { type: 'json' };
import lesson03 from '../json-mandarin/03.json' with { type: 'json' };
import lesson04 from '../json-mandarin/04.json' with { type: 'json' };
import lesson05 from '../json-mandarin/05.json' with { type: 'json' };
import lesson06 from '../json-mandarin/06.json' with { type: 'json' };
import lesson07 from '../json-mandarin/07.json' with { type: 'json' };
import lesson08 from '../json-mandarin/08.json' with { type: 'json' };
import lesson09 from '../json-mandarin/09.json' with { type: 'json' };
import lesson10 from '../json-mandarin/10.json' with { type: 'json' };
import lesson11 from '../json-mandarin/11.json' with { type: 'json' };
import lesson12 from '../json-mandarin/12.json' with { type: 'json' };
import lesson13 from '../json-mandarin/13.json' with { type: 'json' };

const lessons = [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06, lesson07, lesson08, lesson09, lesson10, lesson11, lesson12, lesson13];

function cardKey(card) {
  // Content-based IDs keep progress attached to the same card after reordering.
  const text = JSON.stringify([card.front, card.hint, card.back]);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}

export function seedDecks() {
  return [{
    id: 'builtin-mandarin',
    builtin: true,
    name: 'Mandarin — Materi 01–13',
    description: '236 kartu dari materi gambarmu. Hanzi di depan, arti sebagai hint, dan pinyin sebagai jawaban.',
    color: 'pink',
    createdAt: '2026-11-01T00:00:00.000Z',
    parts: lessons.map((cards, index) => {
      const number = String(index + 1).padStart(2, '0');
      const id = `builtin-mandarin-part-${number}`;
      const occurrences = new Map();
      return {
        id,
        builtin: true,
        name: `Part ${number}`,
        cards: cards.map(card => {
          const key = cardKey(card);
          const occurrence = (occurrences.get(key) || 0) + 1;
          occurrences.set(key, occurrence);
          return { ...card, id: `${id}-${key}-${occurrence}` };
        }),
      };
    }),
  }];
}

export function withBuiltinDecks(data) {
  const builtins = seedDecks().map(deck => {
    const saved = data.decks.find(item => item.id === deck.id);
    const builtinPartIds = new Set(deck.parts.map(part => part.id));
    const additions = (saved?.parts || []).filter(part => !part.builtin && !builtinPartIds.has(part.id));
    return { ...deck, parts: [...deck.parts, ...additions] };
  });
  const builtinIds = new Set(builtins.map(deck => deck.id));
  return { ...data, decks: [...builtins, ...data.decks.filter(deck => !deck.builtin && !builtinIds.has(deck.id))] };
}

export function localData(data) {
  // Store personal additions inside their built-in deck, without copying bundled cards.
  return {
    ...data,
    decks: data.decks
      .map(deck => deck.builtin ? { ...deck, parts: deck.parts.filter(part => !part.builtin) } : deck)
      .filter(deck => !deck.builtin || deck.parts.length > 0),
  };
}
