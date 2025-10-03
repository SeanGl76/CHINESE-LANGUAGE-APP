import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SETS, type Vocab, type SetKey } from './data/sets';

// --- UI helper
const Btn = ({ to, onClick, children }: { to?: string; onClick?: () => void; children: React.ReactNode }) => {
  const base = "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500";
  return to ? <Link to={to} className={base}>{children}</Link> : <button onClick={onClick} className={base}>{children}</button>;
};

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link to="/"><Btn>Back</Btn></Link>
      </header>
      {children}
    </div>
  );
}

// --- Main Menu
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

// --- Flashcards
function Flashcards() {
  const [pool, setPool] = useState<Vocab[]>([]);
  const [idx, setIdx] = useState(0);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    const chosen: SetKey[] = JSON.parse(localStorage.getItem("cn-selected-sets-v1") || '["HSK1"]');
    const combined: Vocab[] = [];
    chosen.forEach(k => combined.push(...(SETS[k] || [])));
    setPool(combined);
  }, []);

  if (!pool.length) return <Shell title="Flashcards"><p>No cards selected.</p></Shell>;
  const current = pool[idx];

  return (
    <Shell title="Flashcards">
      <div className="bg-gray-800 p-6 rounded text-center">
        <div className="text-5xl">{current.simp}</div>
        {reveal && <div className="mt-4">{current.pinyin} — {current.english}</div>}
      </div>
      <div className="flex gap-2 mt-4">
        <Btn onClick={() => setReveal(r => !r)}>{reveal ? "Hide" : "Reveal"}</Btn>
        <Btn onClick={() => setIdx((i) => (i + 1) % pool.length)}>Next</Btn>
      </div>
    </Shell>
  );
}

// --- Sentence Generator (simplified demo)
function SentenceGenerator() {
  const [sentence, setSentence] = useState<string>("");

  const generate = () => {
    const words = SETS.HSK1.slice(0, 5).map(w => w.simp);
    setSentence(words.join(" ") + "。");
  };

  return (
    <Shell title="Sentence Generator">
      <p>{sentence || "Click generate."}</p>
      <Btn onClick={generate}>New Sentence</Btn>
    </Shell>
  );
}

// --- Sentence Builder (placeholder)
function SentenceBuilder() {
  return <Shell title="Sentence Builder"><p>Coming soon…</p></Shell>;
}

// --- Vocabulary Sets
function VocabularySets() {
  const allSets = Object.keys(SETS) as SetKey[];
  const [chosen, setChosen] = useState<SetKey[]>(() => JSON.parse(localStorage.getItem("cn-selected-sets-v1") || '["HSK1"]'));
  const toggle = (k: SetKey) => {
    const next = chosen.includes(k) ? chosen.filter(x => x !== k) : [...chosen, k];
    setChosen(next);
    localStorage.setItem("cn-selected-sets-v1", JSON.stringify(next));
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
    </Shell>
  );
}

// --- Router
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/practice" element={<Flashcards />} />
        <Route path="/sentence" element={<SentenceGenerator />} />
        <Route path="/builder" element={<SentenceBuilder />} />
        <Route path="/sets" element={<VocabularySets />} />
      </Routes>
    </Router>
  );
}
