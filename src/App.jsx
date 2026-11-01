import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, BookOpen, Check, CheckCheck, ChevronDown, Code2, Copy, FileJson, FolderOpen, Globe2, GraduationCap, Layers, Lightbulb, Moon, Plus, Search, Sparkles, Sun, Trash2, Upload, X, Zap, Pencil } from 'lucide-react';
import { localData, seedDecks, withBuiltinDecks } from './data.js';
import { downloadJSON, exportDeck, JSON_EXAMPLE, parseCards, parseDeck, stats, uid } from './lib.js';
import Study from './Study.jsx';

const STORAGE_KEY = 'kartu-data-v1';
const COLORS = ['pink', 'mint', 'purple', 'yellow', 'blue'];
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (!Array.isArray(data.decks) || !data.progress || typeof data.progress !== 'object') throw new Error();
      for (const deck of data.decks) {
        if (typeof deck.id !== 'string' || typeof deck.name !== 'string' || !Array.isArray(deck.parts)) throw new Error();
        for (const part of deck.parts) if (typeof part.id !== 'string' || typeof part.name !== 'string' || !Array.isArray(part.cards) || part.cards.some(c => typeof c.id !== 'string' || typeof c.front !== 'string' || typeof c.back !== 'string')) throw new Error();
      }
      return withBuiltinDecks(data);
    }
  } catch { return { decks: seedDecks(), progress: {}, storageError: true }; }
  return { decks: seedDecks(), progress: {} };
}

function DeckIcon({ color, size = 24 }) {
  const Icon = color === 'pink' ? Globe2 : color === 'mint' ? BookOpen : color === 'purple' ? Code2 : GraduationCap;
  return <Icon size={size} strokeWidth={1.6} />;
}

function Modal({ title, subtitle, children, close, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus?.(); };
  }, []);
  return <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === ref.current) { const b = ref.current.getBoundingClientRect(); if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) close(); } }}>
    <div className="modal-header"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button className="icon-button" onClick={close} aria-label="Tutup dialog"><X size={20} /></button></div>{children}
  </dialog>;
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [theme, setTheme] = useState(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const [page, setPage] = useState({ view: 'home' });
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('default');
  const [storageError, setStorageError] = useState(data.storageError ? 'Penyimpanan browser tidak dapat dibaca. Perubahan belum disimpan; ekspor deck Anda sebagai cadangan.' : '');
  const saveBlocked = useRef(Boolean(data.storageError));
  useEffect(() => {
    if (saveBlocked.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(localData(data))); setStorageError(''); }
    catch { setStorageError('Penyimpanan browser penuh atau tidak tersedia. Ekspor deck Anda agar perubahan tidak hilang.'); }
  }, [data]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1e211f' : '#f8f6f0';
    try { localStorage.setItem('kartu-theme', theme); } catch { /* Theme still works in memory. */ }
  }, [theme]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 3600); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [page.view, page.deckId, page.partId]);
  const deck = data.decks.find(d => d.id === page.deckId);
  const part = deck?.parts.find(p => p.id === page.partId);
  const allCards = data.decks.flatMap(d => d.parts.flatMap(p => p.cards));
  const totalStats = stats(allCards, data.progress);
  function updateDeck(next) { setData(old => ({ ...old, decks: old.decks.map(d => d.id === next.id && !d.builtin ? next : d) })); }
  function goHome() { setPage({ view: 'home' }); }
  function deleteDeck(target) {
    if (target.builtin) return;
    setModal({ type: 'confirm', title: 'Hapus deck ini?', text: `Deck “${target.name}” beserta semua part, kartu, dan progresnya akan dihapus dari browser ini.`, action: () => {
      const ids = new Set(target.parts.flatMap(p => p.cards.map(c => c.id)));
      setData(old => ({ ...old, decks: old.decks.filter(d => d.id !== target.id), progress: Object.fromEntries(Object.entries(old.progress).filter(([id]) => !ids.has(id))) })); goHome(); setToast('Deck berhasil dihapus.');
    } });
  }
  async function importDeck(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setToast('File terlalu besar. Maksimal 5 MB.'); return; }
    try { const imported = parseDeck(await file.text()); setData(old => ({ ...old, decks: [...old.decks, imported] })); setPage({ view: 'deck', deckId: imported.id }); setToast('Deck berhasil diimpor. Selamat belajar!'); }
    catch (error) { setToast(error.message); }
  }
  const filteredDecks = data.decks.filter(d => `${d.name} ${d.description}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? b.createdAt.localeCompare(a.createdAt) : 0);
  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <button onClick={goHome} className="brand" aria-label="Kartu, halaman utama"><span className="brand-icon"><Layers size={22} strokeWidth={1.8} /></span><span>kartu<span className="brand-dot">.</span></span></button>
      <nav className="desktop-nav" aria-label="Navigasi utama"><button onClick={goHome} className={page.view === 'home' ? 'nav-link active' : 'nav-link'}><FolderOpen size={16} /> Deck saya</button><button className="nav-link" onClick={() => setModal({ type: 'guide' })}><Code2 size={16} /> Panduan JSON <span className="tiny-badge">{ }</span></button></nav>
      <div className="header-actions"><span className="local-badge"><span /> Tersimpan di browser</span><button className="theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} aria-label={`Aktifkan mode ${theme === 'light' ? 'gelap' : 'terang'}`} title={`Mode ${theme === 'light' ? 'gelap' : 'terang'}`}>{theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}</button></div>
    </div></header>
    <main className="main-container">
      {storageError && <div className="storage-warning" role="alert">{storageError}</div>}
      {page.view === 'home' && <>
        <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="little-line" /> RUANG KECIL UNTUK INGATAN BESAR</div><h1>Sedikit setiap hari.<br />Ingat <span className="highlight-word">lebih lama.<svg viewBox="0 0 330 15" preserveAspectRatio="none"><path d="M4 10 Q155 -1 326 7 M28 14 Q180 5 300 11" /></svg></span></h1><p>Ubah hal yang ingin kamu pelajari menjadi kartu.<br className="hidden sm:block" /> Buat deck, temukan ritmemu, dan lihat progresmu tumbuh.</p><button className="button primary" onClick={() => setModal({ type: 'deck' })}><Plus size={18} /> Buat deck pertama{data.decks.length ? 'mu' : ''}<ArrowRight size={17} className="ml-3" /></button><div className="hero-note"><span className="mini-avatar">你</span><span className="mini-avatar avatar-2">Aa</span><span className="mini-avatar avatar-3">&lt;/&gt;</span><span>Bahasa baru, ide baru, apa saja.</span></div></div>
        <div className="hero-art" aria-hidden="true"><Sparkles className="art-spark spark-one" size={35} /><span className="art-dots">✦</span><div className="paper-card paper-back" /><div className="paper-card paper-middle" /><div className="paper-card paper-front"><span className="illustration-tag">SATU KARTU, SATU LANGKAH</span><span className="illustration-hanzi">学</span><span className="illustration-pinyin">xué</span><div className="illustration-answer">belajar <span>↗</span></div><span className="paper-corner">✧</span></div><div className="art-caption"><span>↑</span> Masa depanmu berterima kasih.</div><span className="art-star">✳</span></div></section>
        <section className="overview-grid" aria-label="Ringkasan koleksi"><Summary icon={FolderOpen} value={data.decks.length} label="Deck koleksi" color="yellow" /><Summary icon={Layers} value={data.decks.reduce((s, d) => s + d.parts.length, 0)} label="Part belajar" color="purple" /><Summary icon={BookOpen} value={totalStats.total} label="Total kartu" color="pink" /><Summary icon={CheckCheck} value={totalStats.mastered} label="Sudah dikuasai" color="mint" /></section>
        <section className="collection"><div className="section-heading"><div><div className="flex items-center gap-3"><h2>Deck saya</h2><span className="count-badge">{data.decks.length}</span></div><p>Semua yang ingin kamu ingat, ada di sini.</p></div><div className="collection-actions"><label className="button subtle import-button"><Upload size={16} /> Impor deck<input className="sr-only" type="file" accept=".json,application/json" onChange={e => { importDeck(e.target.files?.[0]); e.target.value = ''; }} /></label><button className="button primary small" onClick={() => setModal({ type: 'deck' })}><Plus size={17} /> Buat deck</button></div></div>
          <div className="collection-toolbar"><div className="search-input"><Search size={17} /><input aria-label="Cari deck" placeholder="Cari deck kamu..." value={query} onChange={e => setQuery(e.target.value)} />{query && <button aria-label="Hapus pencarian" onClick={() => setQuery('')}><X size={15} /></button>}</div><div className="sort-wrap"><span>Urutkan:</span><select aria-label="Urutkan deck" value={sort} onChange={e => setSort(e.target.value)}><option value="default">Koleksi saya</option><option value="newest">Terbaru</option><option value="name">Nama A–Z</option></select><ChevronDown size={13} /></div></div>
          <div className="deck-grid">{filteredDecks.map((d, i) => <DeckCard key={d.id} deck={d} index={i} progress={data.progress} open={() => setPage({ view: 'deck', deckId: d.id })} />)}<button className="new-deck-card" onClick={() => setModal({ type: 'deck' })}><span className="new-deck-plus"><Plus size={25} strokeWidth={1.5} /></span><strong>Rasa ingin tahu berikutnya?</strong><span>Beri tempat untuk hal baru yang ingin dipelajari.</span><span className="new-deck-link">Buat deck baru <ArrowRight size={15} /></span></button></div>
          {query && !filteredDecks.length && <div className="empty-search"><Search size={25} /><h3>Deck belum ditemukan</h3><p>Coba kata kunci lain, atau buat deck baru.</p></div>}
        </section>
        <section className="bottom-note"><div className="note-icon"><Lightbulb size={24} strokeWidth={1.6} /></div><div><h3>Punya daftar kosakata? Jadikan flashcard.</h3><p>Tempel JSON, susun dalam part, dan mulai belajar dalam hitungan detik.</p></div><button onClick={() => setModal({ type: 'guide' })}>Lihat format JSON <ArrowRight size={16} /></button></section>
      </>}
      {page.view === 'deck' && deck && <DeckView deck={deck} progress={data.progress} back={goHome} study={id => setPage({ view: 'study', deckId: deck.id, partId: id })} addPart={() => setModal({ type: 'part' })} editPart={part => setModal({ type: 'part', part })} editDeck={() => setModal({ type: 'deck', deck })} deleteDeck={() => deleteDeck(deck)} deletePart={target => setModal({ type: 'confirm', title: 'Hapus part ini?', text: `Semua kartu dan progres dalam “${target.name}” akan dihapus.`, action: () => {
        updateDeck({ ...deck, parts: deck.parts.filter(p => p.id !== target.id) });
        setData(old => ({ ...old, progress: Object.fromEntries(Object.entries(old.progress).filter(([id]) => !target.cards.some(c => c.id === id))) })); setToast('Part berhasil dihapus.');
      } })} notify={setToast} />}
      {page.view === 'study' && deck && part && <Study key={part.id} deck={deck} part={part} progress={data.progress} back={() => setPage({ view: 'deck', deckId: deck.id })} updateProgress={updater => setData(old => ({ ...old, progress: updater(old.progress) }))} confirm={setModal} notify={setToast} />}
    </main>
    <footer className="site-footer"><span className="footer-brand"><Layers size={15} /> kartu.</span><span>Dibuat untuk rasa ingin tahumu.</span><span className="footer-storage"><span /> Data tersimpan di perangkat ini · Ekspor untuk cadangan</span></footer>
    {modal?.type === 'deck' && <DeckForm deck={modal.deck} close={() => setModal(null)} save={next => { if (modal.deck) updateDeck(next); else setData(old => ({ ...old, decks: [...old.decks, next] })); setModal(null); setPage({ view: 'deck', deckId: next.id }); setToast(modal.deck ? 'Deck diperbarui.' : 'Deck baru siap diisi!'); }} />}
    {modal?.type === 'part' && deck && <PartForm part={modal.part} close={() => setModal(null)} save={next => {
      const oldPart = modal.part;
      updateDeck({ ...deck, parts: oldPart ? deck.parts.map(p => p.id === next.id ? next : p) : [...deck.parts, next] });
      if (oldPart) { const retained = new Set(next.cards.map(c => c.id)); const removed = new Set(oldPart.cards.filter(c => !retained.has(c.id)).map(c => c.id)); setData(old => ({ ...old, progress: Object.fromEntries(Object.entries(old.progress).filter(([id]) => !removed.has(id))) })); }
      setModal(null); setToast(oldPart ? 'Part berhasil diperbarui.' : 'Part dan kartu berhasil ditambahkan.');
    }} />}
    {modal?.type === 'guide' && <Guide close={() => setModal(null)} notify={setToast} />}
    {modal?.type === 'confirm' && <Modal title={modal.title} close={() => setModal(null)}><p className="confirm-text">{modal.text}</p><div className="modal-actions"><button className="button" onClick={() => setModal(null)}>Batal</button><button className="button danger" onClick={() => { modal.action(); setModal(null); }}>Ya, lanjutkan</button></div></Modal>}
    {toast && <div className="toast" role="status"><span>{toast}</span><button aria-label="Tutup notifikasi" onClick={() => setToast('')}><X size={16} /></button></div>}
  </div>;
}

function Summary({ icon: Icon, value, label, color }) { return <div className="summary-card"><span className={`summary-icon color-${color}`}><Icon size={21} strokeWidth={1.7} /></span><div><strong>{value.toLocaleString('id-ID')}</strong><span>{label}</span></div></div>; }

function DeckCard({ deck, progress, open }) {
  const s = stats(deck.parts.flatMap(p => p.cards), progress);
  return <button className={`deck-card color-${deck.color}`} onClick={open}><div className="deck-card-top"><span className="deck-icon"><DeckIcon color={deck.color} size={27} /></span><span className="deck-kind">{deck.builtin ? 'MATERI BAWAAN' : deck.color === 'pink' ? 'BAHASA' : deck.color === 'mint' ? 'BAHASA' : deck.color === 'purple' ? 'PENGETAHUAN' : 'KOLEKSI'}</span><span className="deck-open"><ArrowRight size={19} /></span></div><div className="deck-card-content"><h3>{deck.name}</h3><p>{deck.description || 'Satu langkah lebih dekat dengan hal baru.'}</p><div className="deck-meta"><span><Layers size={14} /> {deck.parts.length} part</span><span className="meta-dot">·</span><span><BookOpen size={14} /> {s.total} kartu</span></div></div><div className="deck-progress"><div><span>Progres belajar</span><strong>{s.percent}%</strong></div><div className="progress-track"><span style={{ width: `${s.percent}%` }} /></div><span className="progress-caption">{s.mastered} dari {s.total} kartu dikuasai</span></div></button>;
}

export function DeckView({ deck, progress, back, study, addPart, editPart, editDeck, deleteDeck, deletePart, notify }) {
  const s = stats(deck.parts.flatMap(p => p.cards), progress);
  return <div className="inner-page">
    <button className="back-link" onClick={back}><ArrowLeft size={16} /> Kembali ke deck saya</button>
    <section className={`deck-banner color-${deck.color}`}>
      <div className="deck-banner-main">
        <span className="deck-icon big"><DeckIcon color={deck.color} size={34} /></span>
        <div>
          <span className="eyebrow">{deck.builtin ? 'MATERI BAWAAN · TERSEDIA DI SEMUA PERANGKAT' : 'KOLEKSI BELAJARMU'}</span>
          <h1>{deck.name}</h1>
          <p>{deck.description || 'Setiap kartu adalah langkah kecil untuk belajar.'}</p>
        </div>
      </div>
      <div className="deck-banner-actions">
        {!deck.builtin && <button className="icon-button" onClick={editDeck} title="Edit deck" aria-label="Edit deck"><Pencil size={18} /></button>}
        <button className="icon-button" onClick={() => { downloadJSON(exportDeck(deck), `${deck.name}.json`); notify('Deck diekspor. Simpan file JSON sebagai cadangan.'); }} title="Ekspor deck" aria-label="Ekspor deck"><ArrowDownToLine size={18} /></button>
        {!deck.builtin && <button className="icon-button" onClick={deleteDeck} title="Hapus deck" aria-label="Hapus deck"><Trash2 size={18} /></button>}
      </div>
    </section>
    <section className="overview-grid compact">
      <Summary icon={Layers} value={deck.parts.length} label="Part belajar" color="purple" />
      <Summary icon={BookOpen} value={s.total} label="Total kartu" color="pink" />
      <Summary icon={CheckCheck} value={s.mastered} label="Dikuasai" color="mint" />
      <Summary icon={Zap} value={`${s.percent}%`} label="Progres deck" color="yellow" />
    </section>
    <div className="section-heading">
      <div><h2>Selangkah demi selangkah.</h2><p>{deck.builtin ? '13 part siap dipelajari. Pilih part dan mulai belajar.' : 'Pilih part untuk mulai belajar atau tambahkan kartu baru.'}</p></div>
      {!deck.builtin && <button className="button primary" onClick={addPart}><Plus size={17} /> Tambah part</button>}
    </div>
    <div className="parts-list">{deck.parts.map((p, index) => {
      const ps = stats(p.cards, progress);
      return <article className="part-row" key={p.id}>
        <span className={`part-number color-${deck.color}`}>{String(index + 1).padStart(2, '0')}</span>
        <div className="part-info"><h3>{p.name}</h3><span>{p.cards.length} kartu <span>·</span> {ps.mastered} dikuasai</span></div>
        <div className="part-progress"><span>{ps.percent}%</span><div className="progress-track"><span style={{ width: `${ps.percent}%` }} /></div></div>
        <div className="part-actions">
          {!deck.builtin && <>
            <button className="icon-button" aria-label={`Edit ${p.name}`} onClick={() => editPart(p)}><Pencil size={16} /></button>
            <button className="icon-button" aria-label={`Hapus ${p.name}`} onClick={() => deletePart(p)}><Trash2 size={16} /></button>
          </>}
          <button className="button study-button" onClick={() => study(p.id)}>Belajar <ArrowRight size={16} /></button>
        </div>
      </article>;
    })}{!deck.parts.length && <div className="empty-state"><span className="empty-icon color-yellow"><Layers size={35} /></span><h2>Deck baru, kemungkinan baru.</h2><p>Tambahkan part pertamamu dengan mengimpor kartu dari JSON.</p><button className="button primary" onClick={addPart}><Plus size={17} /> Buat part pertama</button></div>}</div>
    <div className="help-line"><FileJson size={16} /> {deck.builtin ? 'Materi bawaan sama di semua perangkat. Progres belajar dan deck pribadi tersimpan di browser masing-masing.' : 'Setiap part berisi kumpulan flashcard dari JSON. Susun berdasarkan topik, bab, atau tingkat kesulitan.'}</div>
  </div>;
}

function DeckForm({ deck, close, save }) {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const [color, setColor] = useState(deck?.color || 'pink');
  return <Modal title={deck ? 'Edit deck' : 'Ruang untuk hal baru.'} subtitle="Satu deck untuk satu topik yang ingin kamu kuasai." close={close}><form onSubmit={e => { e.preventDefault(); if (name.trim()) save({ ...deck, id: deck?.id || uid(), name: name.trim(), description: description.trim(), color, parts: deck?.parts || [], createdAt: deck?.createdAt || new Date().toISOString() }); }}><label className="field-label" htmlFor="deck-name">Nama deck <span>*</span></label><input id="deck-name" className="text-input" placeholder="Misalnya, Mandarin sehari-hari" value={name} onChange={e => setName(e.target.value)} maxLength={80} required autoFocus /><label className="field-label" htmlFor="deck-description">Deskripsi <span className="optional">opsional</span></label><textarea id="deck-description" className="text-input" placeholder="Apa yang ingin kamu pelajari?" value={description} onChange={e => setDescription(e.target.value)} maxLength={200} rows={3} /><span className="field-label">Warna deck</span><div className="color-options">{COLORS.map(c => <button key={c} type="button" aria-label={`Warna ${c}`} aria-pressed={color === c} className={`color-swatch color-${c} ${color === c ? 'selected' : ''}`} onClick={() => setColor(c)}>{color === c && <Check size={19} />}</button>)}</div><div className="modal-actions"><button type="button" className="button" onClick={close}>Batal</button><button className="button primary" type="submit"><Plus size={17} /> {deck ? 'Simpan perubahan' : 'Buat deck'}</button></div></form></Modal>;
}

function PartForm({ part, close, save }) {
  const [name, setName] = useState(part?.name || '');
  const [json, setJson] = useState(part ? JSON.stringify(part.cards.map(({ front, hint, back }) => ({ front, hint, back })), null, 2) : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRead = useRef(0);
  const preview = (() => { try { return parseCards(json); } catch { return null; } })();
  async function readFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Maksimal ukuran file 5 MB.'); return; }
    const token = ++fileRead.current; setLoading(true);
    try { const content = await file.text(); if (token === fileRead.current) { setJson(content); setError(''); } } catch { setError('File tidak dapat dibaca. Coba pilih ulang.'); }
    finally { if (token === fileRead.current) setLoading(false); }
  }
  function submit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Nama part tidak boleh kosong.'); return; }
    try {
      const cards = parseCards(json);
      // Retain progress for unchanged cards, including duplicates in their original order.
      const existing = [...(part?.cards || [])];
      cards.forEach(card => { const index = existing.findIndex(c => c.front === card.front && c.hint === card.hint && c.back === card.back); if (index >= 0) card.id = existing.splice(index, 1)[0].id; });
      save({ id: part?.id || uid(), name: name.trim(), cards });
    } catch (err) { setError(err.message); }
  }
  return <Modal title={part ? 'Edit part & kartu' : 'Kartu baru, pengetahuan baru.'} subtitle="Beri nama part, lalu tempel atau unggah JSON kartumu." close={close} wide><form onSubmit={submit}><label className="field-label" htmlFor="part-name">Nama part <span>*</span></label><input id="part-name" className="text-input" placeholder="Misalnya, Salam & perkenalan" value={name} onChange={e => setName(e.target.value)} required maxLength={80} autoFocus /><div className="json-label-row"><label className="field-label" htmlFor="cards-json">Kartu dalam format JSON <span>*</span></label><button type="button" className="text-button" onClick={() => { setJson(JSON_EXAMPLE); setError(''); }}>Gunakan contoh</button></div><div className="json-editor"><div className="editor-top"><span><span className="editor-dot" /> cards.json</span><label className="text-button upload-json"><Upload size={14} /> Unggah .json<input type="file" accept=".json,application/json" className="sr-only" onChange={e => { readFile(e.target.files?.[0]); e.target.value = ''; }} /></label></div><textarea id="cards-json" spellCheck={false} value={json} onChange={e => { setJson(e.target.value); setError(''); }} placeholder={JSON_EXAMPLE} required aria-describedby="json-help json-error" /></div><p className="field-help" id="json-help"><Code2 size={14} /> front = pertanyaan · hint = petunjuk (opsional) · back = jawaban</p>{preview && <div className="json-valid"><Check size={16} /> {preview.length} kartu siap disimpan <span>Kartu pertama: {preview[0].front.slice(0, 35)}</span></div>}{error && <p className="form-error" id="json-error" role="alert">{error}</p>}{part && <p className="field-help">Progres kartu yang isinya tetap sama akan dipertahankan.</p>}<div className="modal-actions"><button type="button" className="button" onClick={close}>Batal</button><button className="button primary" type="submit" disabled={loading}><Plus size={17} /> {loading ? 'Membaca file…' : part ? 'Simpan perubahan' : 'Tambahkan part'}</button></div></form></Modal>;
}

function Guide({ close, notify }) {
  return <Modal title="Dari JSON jadi ingatan." subtitle="Satu format sederhana untuk semua hal yang ingin kamu pelajari." close={close} wide><div className="guide-fields"><div><strong>front</strong><p>Pertanyaan atau hanzi di depan kartu.</p></div><div><strong>hint <span>opsional</span></strong><p>Petunjuk atau pinyin saat dibutuhkan.</p></div><div><strong>back</strong><p>Jawaban atau arti di belakang kartu.</p></div></div><div className="guide-code"><div className="editor-top"><span><FileJson size={15} /> contoh-kartu.json</span><button className="text-button" onClick={async () => { try { await navigator.clipboard.writeText(JSON_EXAMPLE); notify('Contoh JSON disalin.'); } catch { notify('Tidak bisa menyalin. Gunakan tombol unduh contoh.'); } }}><Copy size={14} /> Salin</button></div><pre>{JSON_EXAMPLE}</pre></div><p className="guide-info"><Lightbulb size={18} /> Gunakan array <code>[ ... ]</code> berisi objek kartu. Format <code>hanzi / pinyin / answer</code> juga didukung. JSON dapat dipakai untuk bahasa, rumus, istilah, dan topik apa saja.</p><p className="field-help">Untuk memindahkan seluruh deck, gunakan tombol Ekspor di dalam deck, lalu Impor deck pada halaman utama. Progres belajar hanya tersimpan di browser ini.</p><div className="modal-actions"><button className="button" onClick={() => downloadJSON(JSON.parse(JSON_EXAMPLE), 'contoh-kartu.json')}><ArrowDownToLine size={16} /> Unduh contoh</button><button className="button primary" onClick={close}>Mengerti <Check size={16} /></button></div></Modal>;
}

