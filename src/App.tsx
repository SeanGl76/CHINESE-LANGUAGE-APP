import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SETS, type Vocab, type SetKey } from './data/sets';

/* -------------------- Shared UI helpers -------------------- */
const Btn = ({
  to,
  onClick,
  children,
  variant = 'primary',
  disabled = false,
}: {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
}) => {
  const base =
    'px-4 py-2 rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';
  const styles =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-500'
      : variant === 'secondary'
      ? 'bg-gray-700 text-white hover:bg-gray-600'
      : variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-500'
      : 'bg-transparent text-white/90 hover:text-white hover:bg-white/10';
  const cls = `${base} ${styles}`;
  return to ? (
    <Link to={to} className={cls}>
      {children}
    </Link>
  ) : (
    <button onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  );
};

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link to="/"><Btn variant="secondary">Back</Btn></Link>
      </header>
      <div className="max-w-4xl">{children}</div>
    </div>
  );
}

/* -------------------- Utilities -------------------- */
function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const r = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

function speakChinese(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.find(v => /zh|cmn|Chinese|Mandarin/i.test(v.lang + v.name));
    if (zh) u.voice = zh;
    u.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {/* no-op */}
}

/* ============================================================
   Main Menu
============================================================ */
function MainMenu() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="grid gap-4 text-center">
        <h1 className="text-3xl font-bold">Chinese Flashcards</h1>
        <Btn to="/practice">Start Practicing Words</Btn>
        <Btn to="/sentence">Random Sentence Generator</Btn>
        <Btn to="/builder">Sentence Building</Btn>
        <Btn to="/sets">Current Vocabulary Sets</Btn>
      </div>
    </div>
  );
}

/* ============================================================
   Flashcards (uses real data from SETS)
============================================================ */
function Flashcards() {
  const [pool, setPool] = useState<Vocab[]>([]);
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const chosen: SetKey[] = JSON.parse(
      localStorage.getItem('cn-selected-sets-v1') || '["HSK1"]'
    );
    const combined: Vocab[] = [];
    chosen.forEach(k => combined.push(...(SETS[k] || [])));
    setPool(combined.length ? combined : SETS.HSK1);
  }, []);

  if (!pool.length) return <Shell title="Flashcards"><p>No cards selected.</p></Shell>;
  const current = pool[idx];

  return (
    <Shell title="Flashcards">
      <div className="bg-gray-800 p-8 rounded text-center">
        <div className="text-5xl">{current.simp}</div>
        {reveal && (
          <div className="mt-4 text-lg">
            {current.pinyin} — {current.english}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-4">
        <Btn variant="secondary" onClick={() => speakChinese(current.simp)}>🔊 Audio</Btn>
        <Btn variant="secondary" onClick={() => setReveal(r => !r)}>{reveal ? 'Hide' : 'Reveal'}</Btn>
        <div className="ml-auto flex gap-2">
          <Btn variant="secondary" onClick={() => setIdx(i => (i - 1 + pool.length) % pool.length)}>← Prev</Btn>
          <Btn onClick={() => setIdx(i => (i + 1) % pool.length)}>Next →</Btn>
        </div>
      </div>
    </Shell>
  );
}

/* ============================================================
   Random Sentence Generator — REIMPLEMENTED
   - Logical grammar templates
   - Uses selected sets when possible (fallback to built-in bank)
   - Show Pinyin / Show Translation toggles
============================================================ */
type LengthOpt = 'short' | 'regular' | 'long';

type Token = {
  cn: string;
  py: string;
  en: string;
  tag: 'Time'|'Subject'|'Place'|'Verb'|'Object'|'Connector'|'Aspect'|'Punct';
};

// Built-in bank w/ tags + pinyin + english
const BANK: Token[] = [
  // Time
  { cn:'今天', py:'jīntiān', en:'today', tag:'Time' },
  { cn:'现在', py:'xiànzài', en:'now', tag:'Time' },
  { cn:'明天早上', py:'míngtiān zǎoshang', en:'tomorrow morning', tag:'Time' },
  { cn:'周末', py:'zhōumò', en:'the weekend', tag:'Time' },
  { cn:'晚上', py:'wǎnshang', en:'in the evening', tag:'Time' },

  // Subject
  { cn:'我', py:'wǒ', en:'I', tag:'Subject' },
  { cn:'你', py:'nǐ', en:'you', tag:'Subject' },
  { cn:'他', py:'tā', en:'he', tag:'Subject' },
  { cn:'她', py:'tā', en:'she', tag:'Subject' },
  { cn:'我们', py:'wǒmen', en:'we', tag:'Subject' },
  { cn:'他们', py:'tāmen', en:'they', tag:'Subject' },

  // Place
  { cn:'在北京', py:'zài Běijīng', en:'in Beijing', tag:'Place' },
  { cn:'在公司', py:'zài gōngsī', en:'at the company', tag:'Place' },
  { cn:'在酒店', py:'zài jiǔdiàn', en:'at the hotel', tag:'Place' },
  { cn:'在机场', py:'zài jīchǎng', en:'at the airport', tag:'Place' },
  { cn:'在超市', py:'zài chāoshì', en:'at the supermarket', tag:'Place' },

  // Verbs
  { cn:'学习', py:'xuéxí', en:'study', tag:'Verb' },
  { cn:'工作', py:'gōngzuò', en:'work', tag:'Verb' },
  { cn:'吃', py:'chī', en:'eat', tag:'Verb' },
  { cn:'喝', py:'hē', en:'drink', tag:'Verb' },
  { cn:'参观', py:'cānguān', en:'visit', tag:'Verb' },
  { cn:'开会', py:'kāihuì', en:'have a meeting', tag:'Verb' },
  { cn:'见面', py:'jiànmiàn', en:'meet', tag:'Verb' },
  { cn:'买', py:'mǎi', en:'buy', tag:'Verb' },

  // Objects
  { cn:'中文', py:'Zhōngwén', en:'Chinese', tag:'Object' },
  { cn:'报告', py:'bàogào', en:'a report', tag:'Object' },
  { cn:'米饭', py:'mǐfàn', en:'rice', tag:'Object' },
  { cn:'咖啡', py:'kāfēi', en:'coffee', tag:'Object' },
  { cn:'水果', py:'shuǐguǒ', en:'fruit', tag:'Object' },
  { cn:'博物馆', py:'bówùguǎn', en:'the museum', tag:'Object' },

  // Connectors / Aspect / Punct
  { cn:'虽然', py:'suīrán', en:'although', tag:'Connector' },
  { cn:'但是', py:'dànshì', en:'but', tag:'Connector' },
  { cn:'如果', py:'rúguǒ', en:'if', tag:'Connector' },
  { cn:'那么', py:'nàme', en:'then', tag:'Connector' },
  { cn:'先', py:'xiān', en:'first', tag:'Connector' },
  { cn:'然后', py:'ránhòu', en:'then', tag:'Connector' },
  { cn:'还是', py:'háishi', en:'still', tag:'Connector' },
  { cn:'正在', py:'zhèngzài', en:'be (doing)', tag:'Aspect' },
  { cn:'，', py:',', en:',', tag:'Punct' },
  { cn:'。', py:'.', en:'.', tag:'Punct' },
];

// Try to pull matching tokens from selected pool; else fallback to BANK
function pick(pool: Vocab[], tag: Token['tag'], candidates: string[]): Token {
  // see if any candidate appears in the selected pool
  for (const c of candidates) {
    const hit = pool.find(v => v.simp === c);
    if (hit) {
      // pinyin/english from pool if present; fallback to BANK mapping
      const bank = BANK.find(b => b.cn === c);
      return {
        cn: hit.simp,
        py: hit.pinyin || bank?.py || '',
        en: hit.english || bank?.en || '',
        tag,
      };
    }
  }
  // fallback: pick from BANK by tag, filtered to candidates if provided
  const byTag = BANK.filter(b => b.tag === tag);
  const filtered = byTag.filter(b => candidates.includes(b.cn));
  return (filtered.length ? r(filtered) : r(byTag));
}

// Build pinyin string for a sentence
function pinyinOf(tokens: Token[]) {
  return tokens.map(t => t.py || t.cn).join('').replace(/，/g, '，').replace(/。/g, '。');
}

// Build English gloss (template-aware but simple)
function englishOf(tokens: Token[]) {
  return tokens.map(t => t.en || t.cn).join(' ').replace(/ ,/g, ',').replace(/ \./g, '.');
}

function SentenceGenerator() {
  const [length, setLength] = useState<LengthOpt>('short');
  const [pool, setPool] = useState<Vocab[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showPy, setShowPy] = useState(false);
  const [showEn, setShowEn] = useState(false);

  useEffect(() => {
    const chosen: SetKey[] = JSON.parse(localStorage.getItem('cn-selected-sets-v1') || '["HSK1"]');
    const combined: Vocab[] = [];
    chosen.forEach(k => combined.push(...(SETS[k] || [])));
    setPool(combined.length ? combined : SETS.HSK1);
  }, []);

  function generate() {
    // Ensure we always build a logical sentence:
    // base slots
    const T = pick(pool, 'Time', ['今天','现在','明天早上','周末','晚上']);
    const S = pick(pool, 'Subject', ['我','你','他','她','我们','他们']);
    const P = pick(pool, 'Place', ['在北京','在公司','在酒店','在机场','在超市']);
    const V = pick(pool, 'Verb', ['学习','工作','吃','喝','参观','开会','见面','买']);
    const O = pick(pool, 'Object', ['中文','报告','米饭','咖啡','水果','博物馆']);

    let out: Token[] = [];

    if (length === 'short') {
      // [Time][Subject][Place][(正在)]Verb Object 。
      const ASPECT = Math.random() < 0.4 ? BANK.find(b => b.cn === '正在')! : null;
      out = [T, S, P];
      if (ASPECT) out.push(ASPECT);
      out.push(V);
      if (O) out.push(O);
      out.push(BANK.find(b => b.cn === '。')!);
    } else if (length === 'regular') {
      // 虽然 S V O ， 但是 T S 还要 V O 。
      const SU = BANK.find(b => b.cn === '虽然')!;
      const BUT = BANK.find(b => b.cn === '但是')!;
      const STILL = BANK.find(b => b.cn === '还是')!;
      out = [SU, S, V, O, BANK.find(b => b.cn === '，')!, BUT, T, S, STILL, V, O, BANK.find(b => b.cn === '。')!];
    } else {
      // 如果 T S P V O ， 那么 他们 P 见面 。
      const IF = BANK.find(b => b.cn === '如果')!;
      const THEN = BANK.find(b => b.cn === '那么')!;
      const THEY = pick(pool, 'Subject', ['他们','我们']);
      const MEET = pick(pool, 'Verb', ['见面']);
      out = [IF, T, S, P, V, O, BANK.find(b => b.cn === '，')!, THEN, THEY, P, MEET, BANK.find(b => b.cn === '。')!];
    }

    setTokens(out);
    setShowPy(false);
    setShowEn(false);
  }

  useEffect(() => { if (pool.length) generate(); }, [pool, length]);

  const cn = tokens.map(t => t.cn).join('');
  const py = pinyinOf(tokens);
  const en = englishOf(tokens);

  return (
    <Shell title="Random Sentence Generator">
      <div className="flex items-center gap-3 mb-4">
        <span className="opacity-70 text-sm">Length:</span>
        <select
          className="bg-gray-800 rounded px-3 py-2"
          value={length}
          onChange={(e) => (setLength(e.target.value as LengthOpt))}
        >
          <option value="short">Short (&lt;10)</option>
          <option value="regular">Regular (10–20)</option>
          <option value="long">Long (20+)</option>
        </select>
        <Btn variant="secondary" onClick={generate}>New Sentence</Btn>
        <Btn variant="secondary" onClick={() => speakChinese(cn)} disabled={!cn}>🔊 Audio</Btn>
        <div className="ml-auto flex gap-2">
          <Btn variant="ghost" onClick={() => setShowPy(s => !s)}>{showPy ? 'Hide Pinyin' : 'Show Pinyin'}</Btn>
          <Btn variant="ghost" onClick={() => setShowEn(s => !s)}>{showEn ? 'Hide Translation' : 'Show Translation'}</Btn>
        </div>
      </div>

      <div className="rounded-2xl bg-gray-800 p-6">
        <div className="text-2xl leading-relaxed">{cn || '—'}</div>
        {showPy && <div className="mt-2 opacity-90">{py}</div>}
        {showEn && (
          <div className="mt-3">
            <div className="font-semibold">Translation</div>
            <div className="opacity-90">{en}</div>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li className="opacity-90">Basic order: [Time] [Subject] [Place] [Verb] [Object].</li>
              {cn.includes('虽然') && cn.includes('但是') && <li>虽然…但是…: concession (although…but…).</li>}
              {cn.includes('如果') && cn.includes('那么') && <li>如果…那么…: conditional (if…then…).</li>}
              {cn.includes('正在') && <li>正在 + verb: progressive (be doing).</li>}
              {cn.includes('先') && cn.includes('然后') && <li>先…然后…: first…then… (sequence).</li>}
            </ul>
          </div>
        )}
      </div>
    </Shell>
  );
}

/* ============================================================
   Sentence Building — (from previous step, kept as-is)
============================================================ */
type SBItem = {
  cn: string[];      // correct token order
  en: string;        // English prompt
  notes: string[];   // grammar notes to show on check
};

const SENTENCE_BANK: SBItem[] = [
  { cn: ['今天','我','在公司','开会','。'], en: 'Today I have a meeting at the company.', notes: ['Basic order: [Time] [Subject] [Place] [Verb] [Object].','在 + place before the verb.'] },
  { cn: ['现在','他们','在北京','学习','中文','。'], en: 'They are studying Chinese in Beijing now.', notes: ['Time words usually go first.','Place phrase 在北京 goes before the verb.'] },
  { cn: ['虽然','天气不好','，','但是','我们','还是','去','超市','。'], en: "Although the weather isn't good, we still go to the supermarket.", notes: ['虽然…但是…: concession.','还是 indicates “still / nevertheless”.'] },
  { cn: ['如果','明天早上','你','有时间','，','那么','我们','在机场','见面','。'], en: 'If you have time tomorrow morning, then we will meet at the airport.', notes: ['如果…那么…: conditional.'] },
  { cn: ['他','先','写','报告','，','然后','去','开会','。'], en: 'He first writes the report, and then goes to the meeting.', notes: ['先…然后…: first…then…','写报告 / 去开会 are verb-object chunks.'] },
  { cn: ['我','正在','酒店','吃','晚饭','。'], en: 'I am eating dinner at the hotel.', notes: ['正在 + verb: progressive.','Place phrase before the verb.'] },
];

type Feedback = { correct: boolean | null; firstWrongIndex: number | null; reasons: string[] };

function tagToken(t: string): 'Time'|'Subject'|'Place'|'Connector'|'Aspect'|'Verb'|'Object'|'Punct'|'Other' {
  if (['今天','现在','明天早上','周末','晚上'].includes(t)) return 'Time';
  if (['我','你','他','她','我们','你们','他们'].includes(t)) return 'Subject';
  if (t.startsWith('在')) return 'Place';
  if (['虽然','但是','如果','那么','先','然后','还是','，'].includes(t)) return 'Connector';
  if (['正在'].includes(t)) return 'Aspect';
  if (['开会','学习','写','吃','喝','去','见面'].includes(t)) return 'Verb';
  if (['中文','报告','超市','晚饭','机场'].includes(t)) return 'Object';
  if (['，','。'].includes(t)) return 'Punct';
  return 'Other';
}
function explainOrder(expected: string[], answer: string[]): string[] {
  const reasons: string[] = [];
  const firstWrongIndex = answer.findIndex((tok, i) => tok !== expected[i]);
  if (firstWrongIndex === -1) return reasons;
  const tok = answer[firstWrongIndex];
  const tag = tagToken(tok);
  const wantTag = tagToken(expected[firstWrongIndex]);
  if (tag !== wantTag) {
    if (wantTag === 'Time') reasons.push('Time words usually come first (e.g., 今天/现在/明天早上).');
    if (wantTag === 'Subject') reasons.push('Subject follows time: [Time] [Subject] …');
    if (wantTag === 'Place') reasons.push('Place phrase 在 + 地点 should be before the verb.');
    if (wantTag === 'Verb') reasons.push('Verb typically follows [Time][Subject][Place].');
    if (wantTag === 'Object') reasons.push('Objects follow the verb (中文/报告/晚饭…).');
    if (wantTag === 'Connector') reasons.push('Connectors (虽然/但是/如果/那么/先/然后) must stay in fixed spots.');
    if (wantTag === 'Aspect') reasons.push('Aspect marker 正在 appears before the verb.');
    if (wantTag === 'Punct') reasons.push('Keep punctuation in the original positions.');
  } else {
    reasons.push(`The token “${tok}” is in the wrong position. Follow the original pattern precisely.`);
  }
  const expStr = expected.join('');
  if (/虽然.*但是/.test(expStr)) reasons.push('Use the frame: 虽然 … ，但是 …');
  if (/如果.*那么/.test(expStr)) reasons.push('Use the frame: 如果 … ，那么 …');
  if (/先.*然后/.test(expStr)) reasons.push('Use the frame: 先 … ，然后 …');
  if (expected.some(t => tagToken(t) === 'Time') && expected.some(t => tagToken(t) === 'Subject')) {
    reasons.push('Baseline order: [Time] + [Subject] + [Place] + [Verb] + [Object].');
  }
  return Array.from(new Set(reasons));
}

function SentenceBuilding() {
  const [item, setItem] = useState<SBItem>(() => SENTENCE_BANK[Math.floor(Math.random()*SENTENCE_BANK.length)]);
  const [choices, setChoices] = useState<string[]>(() => shuffle(item.cn.filter(t => t !== '')));
  const [picked, setPicked] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<Feedback>({ correct: null, firstWrongIndex: null, reasons: [] });

  function newItem() {
    const next = SENTENCE_BANK[Math.floor(Math.random()*SENTENCE_BANK.length)];
    setItem(next);
    setChoices(shuffle(next.cn.slice()));
    setPicked([]);
    setFeedback({ correct: null, firstWrongIndex: null, reasons: [] });
  }
  function pickToken(tok: string) {
    if (feedback.correct !== null) return;
    if (!choices.includes(tok)) return;
    const i = choices.indexOf(tok);
    const nextChoices = choices.slice();
    nextChoices.splice(i, 1);
    const nextPicked = [...picked, tok];
    if (nextPicked.length === item.cn.length) {
      const firstWrong = nextPicked.findIndex((t, idx) => t !== item.cn[idx]);
      if (firstWrong === -1) {
        setPicked(nextPicked); setChoices(nextChoices);
        setFeedback({ correct: true, firstWrongIndex: null, reasons: item.notes });
        speakChinese(item.cn.join(''));
      } else {
        const reasons = explainOrder(item.cn, nextPicked);
        setPicked(nextPicked); setChoices(nextChoices);
        setFeedback({ correct: false, firstWrongIndex: firstWrong, reasons });
      }
      return;
    }
    setPicked(nextPicked); setChoices(nextChoices);
  }
  function undo() {
    if (!picked.length) return;
    const last = picked[picked.length - 1];
    setPicked(p => p.slice(0, -1));
    setChoices(c => [...c, last]);
    setFeedback({ correct: null, firstWrongIndex: null, reasons: [] });
  }
  function reset() {
    setPicked([]); setChoices(shuffle(item.cn.slice()));
    setFeedback({ correct: null, firstWrongIndex: null, reasons: [] });
  }
  function reveal() {
    setPicked(item.cn.slice()); setChoices([]);
    setFeedback({ correct: true, firstWrongIndex: null, reasons: item.notes });
  }

  const target = item.cn.join('');

  return (
    <Shell title="Sentence Building">
      <div className="mb-4 text-lg">
        <span className="opacity-70 mr-2">English:</span>
        <span className="font-medium">{item.en}</span>
      </div>

      <div className="rounded-2xl bg-gray-800 p-5 mb-4">
        <div className="mb-2 opacity-70 text-sm">Your sentence:</div>
        <div className="text-2xl leading-relaxed flex flex-wrap gap-2">
          {picked.map((t, i) => (
            <span
              key={i}
              className={
                feedback.correct === false && feedback.firstWrongIndex === i
                  ? 'px-2 rounded bg-yellow-400 text-black'
                  : 'px-2 rounded bg-white/10'
              }
            >
              {t}
            </span>
          ))}
          {!picked.length && <span className="opacity-60">Click the tiles below in the correct order…</span>}
        </div>
        {feedback.correct === true && <div className="mt-3 text-green-400 font-semibold">✅ Correct!</div>}
        {feedback.correct === false && <div className="mt-3 text-yellow-300">❌ Not quite. The highlighted word is the first mistake.</div>}
      </div>

      <div className="mb-4">
        <div className="opacity-70 text-sm mb-2">Choose in order:</div>
        <div className="flex flex-wrap gap-2">
          {choices.map((t, idx) => (
            <button key={idx} onClick={() => pickToken(t)} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600">
              {t}
            </button>
          ))}
          {!choices.length && <span className="opacity-60">No tiles left.</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Btn variant="secondary" onClick={undo} disabled={!picked.length}>Undo</Btn>
        <Btn variant="secondary" onClick={reset}>Reset</Btn>
        <Btn variant="secondary" onClick={newItem}>New Sentence</Btn>
        <Btn variant="secondary" onClick={() => speakChinese(target)} disabled={!target}>🔊 Audio</Btn>
        <Btn variant="ghost" onClick={reveal}>Reveal Answer</Btn>
      </div>

      {(feedback.reasons.length > 0 || item.notes.length > 0) && (
        <div className="rounded-xl bg-gray-800 p-4">
          <div className="font-semibold mb-2">Grammar Notes</div>
          <ul className="list-disc pl-6 space-y-1">
            {(feedback.reasons.length ? feedback.reasons : item.notes).map((n, i) => (
              <li key={i} className="opacity-90">{n}</li>
            ))}
          </ul>
        </div>
      )}
    </Shell>
  );
}

/* ============================================================
   Vocabulary Sets
============================================================ */
function VocabularySets() {
  const allSets = Object.keys(SETS) as SetKey[];
  const [chosen, setChosen] = useState<SetKey[]>(() =>
    JSON.parse(localStorage.getItem('cn-selected-sets-v1') || '["HSK1"]')
  );
  const toggle = (k: SetKey) => {
    const next = chosen.includes(k) ? chosen.filter(x => x !== k) : [...chosen, k];
    setChosen(next);
    localStorage.setItem('cn-selected-sets-v1', JSON.stringify(next));
  };

  return (
    <Shell title="Vocabulary Sets">
      <div className="grid gap-2">
        {allSets.map(s => (
          <label key={s} className="flex justify-between bg-gray-800 px-4 py-2 rounded">
            <span>{s}</span>
            <input type="checkbox" checked={chosen.includes(s)} onChange={() => toggle(s)} />
          </label>
        ))}
      </div>
      <p className="text-sm opacity-70 mt-3">Tip: Select multiple sets to feed Flashcards and the Sentence Generator.</p>
    </Shell>
  );
}

/* ============================================================
   Router
============================================================ */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/practice" element={<Flashcards />} />
        <Route path="/sentence" element={<SentenceGenerator />} />
        <Route path="/builder" element={<SentenceBuilding />} />
        <Route path="/sets" element={<VocabularySets />} />
      </Routes>
    </Router>
  );
}
