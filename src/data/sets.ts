
// src/data/sets.ts
import HSK1 from "./HSK1.json";
import HSK2 from "./HSK2.json";
import HSK3 from "./HSK3.json";
import HSK4 from "./HSK4.json";
import HSK5 from "./HSK5.json";
import HSK6 from "./HSK6.json";
import TravelTourism from "./travel_tourism.json";
import Workspace from "./workspace.json";
import Business from "./business.json";
import Academic from "./academic.json";
import Global from "./global.json";
import EverydayLife from "./everyday_life.json";
import NewsCulture from "./news_culture.json";

export type Vocab = { simp: string; trad?: string; pinyin: string; english: string };
export type SetKey =
  | "HSK1" | "HSK2" | "HSK3" | "HSK4" | "HSK5" | "HSK6"
  | "Travel & Tourism" | "Workspace" | "Business" | "Academic"
  | "Global" | "Everyday Life" | "News & Culture";

export const SETS: Record<SetKey, Vocab[]> = {
  HSK1, HSK2, HSK3, HSK4, HSK5, HSK6,
  "Travel & Tourism": TravelTourism,
  Workspace,
  Business,
  Academic,
  Global,
  "Everyday Life": EverydayLife,
  "News & Culture": NewsCulture,
};
