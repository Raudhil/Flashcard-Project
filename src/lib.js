export const uid = () => crypto.randomUUID();

export const JSON_EXAMPLE = JSON.stringify([
  { front: '你好', hint: 'nǐ hǎo', back: 'Halo' },
  { front: '谢谢', hint: 'xiè xie', back: 'Terima kasih' },
  { front: '再见', hint: 'zài jiàn', back: 'Sampai jumpa' },
], null, 2);

function requiredText(value, field, index) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Kartu ${index + 1}: "${field}" harus berupa teks dan tidak boleh kosong.`);
  if (value.length > 2000) throw new Error(`Kartu ${index + 1}: "${field}" maksimal 2.000 karakter.`);
  return value.trim();
}

export function parseCards(input) {
  let parsed;
  try { parsed = typeof input === 'string' ? JSON.parse(input) : input; }
  catch { throw new Error('JSON belum valid. Periksa tanda kutip, koma, dan kurung siku.'); }
  const rows = Array.isArray(parsed) ? parsed : parsed?.cards;
  if (!Array.isArray(rows) || !rows.length) throw new Error('Isi JSON dengan array kartu, minimal 1 kartu.');
  if (rows.length > 2000) throw new Error('Maksimal 2.000 kartu per part. Pisahkan ke beberapa part.');
  return rows.map((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error(`Kartu ${index + 1}: gunakan objek dengan front, hint, dan back.`);
    const hint = row.hint ?? row.pinyin ?? '';
    if (typeof hint !== 'string') throw new Error(`Kartu ${index + 1}: "hint" harus berupa teks.`);
    return { id: uid(), front: requiredText(row.front ?? row.hanzi, 'front', index), hint: hint.trim(), back: requiredText(row.back ?? row.answer, 'back', index) };
  });
}

export function parseDeck(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('File deck bukan JSON yang valid.'); }
  if (!data || typeof data.name !== 'string' || !data.name.trim()) throw new Error('Deck harus memiliki "name" berupa teks.');
  if (!Array.isArray(data.parts) || !data.parts.length || data.parts.length > 100) throw new Error('Deck harus memiliki 1–100 part dalam "parts".');
  return {
    id: uid(), name: data.name.trim().slice(0, 80), description: typeof data.description === 'string' ? data.description.slice(0, 200) : '',
    color: ['pink', 'mint', 'purple', 'yellow', 'blue'].includes(data.color) ? data.color : 'pink',
    createdAt: new Date().toISOString(),
    parts: data.parts.map((part, index) => {
      if (!part || typeof part.name !== 'string' || !part.name.trim()) throw new Error(`Part ${index + 1} harus memiliki "name".`);
      return { id: uid(), name: part.name.trim().slice(0, 80), cards: parseCards(part.cards) };
    }),
  };
}

export function stats(cards, progress) {
  const mastered = cards.filter(c => progress[c.id]?.mastered).length;
  const learning = cards.filter(c => progress[c.id]?.seen && !progress[c.id]?.mastered).length;
  return { total: cards.length, mastered, learning, unseen: cards.length - mastered - learning, percent: cards.length ? Math.round(mastered / cards.length * 100) : 0 };
}

export function shuffle(cards, random = Math.random) {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

export function createStudyQueue(cards, progress, random = Math.random) {
  return shuffle(cards.filter(card => !progress[card.id]?.mastered).map(card => card.id), random);
}

export function reviewStudyQueue(queue, understood, random = Math.random) {
  if (!queue.length) return [];
  const [current, ...remaining] = queue;
  if (!understood) {
    // Leave at least one other question before a retry when other cards remain.
    const position = remaining.length ? 1 + Math.floor(random() * remaining.length) : 0;
    remaining.splice(position, 0, current);
  }
  return remaining;
}

export function exportDeck(deck) {
  return { name: deck.name, description: deck.description, color: deck.color, parts: deck.parts.map(p => ({ name: p.name, cards: p.cards.map(({ front, hint, back }) => ({ front, hint, back })) })) };
}

export function downloadJSON(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
