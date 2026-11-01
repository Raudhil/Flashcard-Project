import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCheck, ChevronDown, FolderOpen, GraduationCap, Keyboard, Layers, Lightbulb, RotateCcw, Shuffle, Sparkles, Zap } from 'lucide-react';
import { createStudyQueue, reviewStudyQueue, stats } from './lib.js';

const newSession = queue => ({ queue, flipped: false, showHint: false, revealed: false, answered: 0 });

export default function Study({ deck, part, progress, back, updateProgress, confirm, notify }) {
  const [mode, setMode] = useState('study');
  const [session, setSession] = useState(() => newSession(createStudyQueue(part.cards, progress)));
  const [shortcuts, setShortcuts] = useState(false);
  const card = part.cards.find(c => c.id === session.queue[0]);
  const s = stats(part.cards, progress);

  function flip() {
    if (!card) return;
    setSession(old => ({ ...old, flipped: !old.flipped, revealed: true }));
    updateProgress(old => ({ ...old, [card.id]: { ...old[card.id], seen: true } }));
  }

  function toggleHint() {
    if (card?.hint) setSession(old => ({ ...old, showHint: !old.showHint }));
  }

  function answer(understood) {
    if (!card || !session.revealed) return;
    updateProgress(old => ({ ...old, [card.id]: { seen: true, mastered: understood } }));
    setSession(old => ({ ...newSession(reviewStudyQueue(old.queue, understood)), answered: old.answered + 1 }));
    notify(understood ? 'Paham! Kartu ini tidak akan muncul lagi sampai progres direset.' : session.queue.length > 1 ? 'Kartu akan muncul lagi secara acak setelah kartu lain.' : 'Tersisa satu kartu. Coba ingat kembali jawabannya.');
  }

  function resetProgress() {
    confirm({
      type: 'confirm',
      title: 'Mulai lagi dari awal?',
      text: `Progres semua kartu dalam “${part.name}” akan direset. Semua kartu akan masuk kembali dengan urutan acak.`,
      action: () => {
        const ids = new Set(part.cards.map(c => c.id));
        updateProgress(old => Object.fromEntries(Object.entries(old).filter(([id]) => !ids.has(id))));
        setSession(newSession(createStudyQueue(part.cards, {})));
        setMode('study');
        notify('Progres part direset. Kartu sudah diacak untuk mulai lagi.');
      },
    });
  }

  useEffect(() => {
    function keydown(e) {
      if (document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey || e.repeat || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable || mode !== 'study') return;
      if (e.code === 'Space' && !e.target.closest('button')) { e.preventDefault(); flip(); }
      if (e.key.toLowerCase() === 'h') { e.preventDefault(); toggleHint(); }
      if (e.key === '1') { e.preventDefault(); answer(false); }
      if (e.key === '2') { e.preventDefault(); answer(true); }
    }
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  return <div className="inner-page study-page">
    <button className="back-link" onClick={back}><ArrowLeft size={16} /> {deck.name}</button>
    <div className="study-heading">
      <div><span className="eyebrow">WAKTUNYA BELAJAR</span><h1>{part.name}</h1><p>Soal diacak. Pahami satu kartu, lalu lanjutkan.</p></div>
      <div className="segmented" aria-label="Tampilan belajar">
        <button className={mode === 'study' ? 'selected' : ''} onClick={() => setMode('study')}><Zap size={15} /> Mode belajar</button>
        <button className={mode === 'all' ? 'selected' : ''} onClick={() => setMode('all')}><Layers size={15} /> Semua kartu</button>
      </div>
    </div>
    <div className="study-layout">
      <section className="study-panel">
        <div className="study-toolbar">
          <span className="part-tag"><span className={`tag-dot color-${deck.color}`} /> {part.cards.length} kartu dalam part ini</span>
          <span className="automatic-shuffle"><Shuffle size={14} /> Diacak otomatis</span>
        </div>
        {mode === 'study' ? <>
          <div className="flashcard-wrap">
            {card ? <div className={`flashcard color-${deck.color} ${session.flipped ? 'is-flipped' : ''}`}>
              <button className="flashcard-face" onClick={flip} aria-label={session.flipped ? 'Balik ke pertanyaan' : 'Balik kartu untuk melihat jawaban'}>
                <span className="flashcard-category">{deck.name}</span>
                <span className="card-decoration deco-one">✦</span><span className="card-decoration deco-two">✧</span>
                <span className="card-side-label">{session.flipped ? 'JAWABAN' : 'PERTANYAAN'}</span>
                <span className={`flashcard-text ${!session.flipped && /[\u3400-\u9fff]/.test(card.front) && card.front.length < 12 ? 'hanzi' : ''}`} key={`${card.id}-${session.flipped}`}>{session.flipped ? card.back : card.front}</span>
                {session.showHint && !session.flipped && card.hint && <span className="card-hint">{card.hint}</span>}
                <span className="flip-instruction"><RotateCcw size={13} /> {session.flipped ? 'Klik untuk kembali ke pertanyaan' : 'Klik kartu untuk melihat jawaban'}</span>
                <span className="card-bottom-label">{session.queue.length} kartu tersisa</span>
              </button>
              {card.hint && !session.flipped && <button className={`hint-button ${session.showHint ? 'hint-active' : ''}`} onClick={toggleHint}><Lightbulb size={14} /> {session.showHint ? 'Tutup hint' : 'Lihat hint'}</button>}
            </div> : <div className="study-complete">
              <span className="empty-icon color-mint"><CheckCheck size={38} /></span>
              <h2>{part.cards.length ? 'Semua kartu sudah dipahami!' : 'Belum ada kartu di part ini.'}</h2>
              <p>{part.cards.length ? 'Kerja bagus! Kartu yang sudah dipahami tidak akan muncul lagi. Reset progres jika ingin mengulang seluruh part.' : 'Tambahkan kartu dari halaman deck untuk mulai belajar.'}</p>
              <button className="button primary" onClick={back}><ArrowLeft size={16} /> Kembali ke deck</button>
            </div>}
          </div>
          {card && <>
            <div className="study-card-actions review-actions">
              <button className="button retry-button" disabled={!session.revealed} onClick={() => answer(false)} aria-describedby="review-help"><RotateCcw size={16} /> Tidak paham <kbd>1</kbd></button>
              <button className="button primary" disabled={!session.revealed} onClick={() => answer(true)} aria-describedby="review-help"><CheckCheck size={16} /> Paham <kbd>2</kbd></button>
            </div>
            <p id="review-help" className="review-help">{session.revealed ? 'Paham: selesai. Tidak paham: diulang secara acak.' : 'Lihat jawaban terlebih dahulu, lalu tentukan pemahamanmu.'}</p>
          </>}
          <div className="study-session-footer">
            <span><strong>{s.mastered}</strong> / {s.total} kartu dipahami <span>·</span> {session.answered} jawaban sesi ini</span>
            <button className="text-button" onClick={resetProgress} disabled={!part.cards.length}><RotateCcw size={13} /> Reset progres</button>
          </div>
        </> : <>
          <p className="all-cards-caption">Daftar referensi. Penilaian Paham / Tidak paham dilakukan di mode belajar.</p>
          <div className="all-cards-list">{part.cards.length ? part.cards.map((c, i) => <div className="all-card-row" key={c.id}>
            <span className="all-card-number">{String(i + 1).padStart(2, '0')}</span>
            <div><strong>{c.front}</strong>{c.hint && <span>{c.hint}</span>}<p>{c.back}</p></div>
            <span className={`card-status ${progress[c.id]?.mastered ? 'card-status-known' : ''}`}>{progress[c.id]?.mastered ? <><CheckCheck size={13} /> Paham</> : progress[c.id]?.seen ? 'Dipelajari' : 'Belum dimulai'}</span>
          </div>) : <div className="empty-state"><Layers size={30} /><h3>Belum ada kartu.</h3><p>Tambahkan kartu dari halaman deck.</p></div>}</div>
        </>}
      </section>
      <aside className="study-sidebar">
        <div className="statistics-panel">
          <h2>Progres belajarmu <Sparkles size={17} /></h2>
          <div className="stat-block"><div><span>Total kartu</span><strong>{s.total}</strong></div><span className="stat-block-icon color-blue"><Layers size={23} /></span></div>
          <div className="stat-block"><div><span>Sudah dipahami</span><strong>{s.mastered}</strong></div><span className="stat-block-icon color-mint"><GraduationCap size={23} /></span></div>
          <div className="stat-block"><div><span>Sedang dipelajari</span><strong>{s.learning}</strong></div><span className="stat-block-icon color-rose"><BookOpen size={23} /></span></div>
          <div className="stat-block"><div><span>Belum dimulai</span><strong>{s.unseen}</strong></div><span className="stat-block-icon color-pink"><FolderOpen size={23} /></span></div>
          <div className="session-progress"><span>Selangkah lebih dekat <strong>{s.percent}%</strong></span><div className="progress-track"><span style={{ width: `${s.percent}%` }} /></div></div>
        </div>
        <div className="study-tip"><Lightbulb size={20} /><p>Pilih <strong>Paham</strong> untuk mengeluarkan kartu dari antrean. Pilih <strong>Tidak paham</strong> agar kartu muncul lagi secara acak setelah kartu lain. Jika tinggal satu kartu, kartu itu langsung diulang.</p></div>
      </aside>
    </div>
    <div className="keyboard-help"><button onClick={() => setShortcuts(s => !s)}><Keyboard size={16} /> Pintasan keyboard <ChevronDown size={13} /></button><span>Pelan-pelan juga sampai. <Sparkles size={14} /></span></div>
    {shortcuts && <div className="shortcut-list"><span><kbd>Space</kbd> Balik kartu</span><span><kbd>H</kbd> Hint</span><span><kbd>1</kbd> Tidak paham</span><span><kbd>2</kbd> Paham</span></div>}
  </div>;
}
