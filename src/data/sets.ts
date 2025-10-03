// src/data/sets.ts
// Ensure tsconfig.json has: "resolveJsonModule": true, "esModuleInterop": true

export type Vocab = { simp: string; trad?: string; pinyin: string; english: string };
export type SetKey =
  | "HSK1" | "HSK2" | "HSK3" | "HSK4" | "HSK5" | "HSK6"
  | "Travel & Tourism" | "Workspace" | "Business" | "Academic"
  | "Global" | "Everyday Life" | "News & Culture";

// 1) Import JSONs (raw). Use your actual filenames here.
import HSK1raw from "./HSK1.json";
import HSK2raw from "./HSK2.json";
import HSK3raw from "./HSK3.json";            // <- the one that likely has "Chinese", "English meaning", etc.
import HSK4raw from "./HSK4.json";
import HSK5raw from "./HSK5.json";
import HSK6raw from "./HSK6.json";
import TravelTourismRaw from "./travel_tourism.json";
import WorkspaceRaw from "./workspace.json";
import BusinessRaw from "./business.json";
import AcademicRaw from "./academic.json";
import GlobalRaw from "./global.json";
import EverydayLifeRaw from "./everyday_life.json";
import NewsCultureRaw from "./news_culture.json";

// 2) Adapter that normalizes *any* of these shapes to { simp, trad, pinyin, english }
function adapt(list: any[]): Vocab[] {
  return (list || [])
    .map((row: any) => {
      const simp =
        row.simp ?? row.Simplified ?? row.simplified ?? row.Chinese ?? row['Chinese (Simplified)'] ?? row.word ?? "";
      const trad =
        row.trad ?? row.Traditional ?? row.traditional ?? row['Chinese (Traditional)'] ?? simp ?? "";
      const pinyin =
        row.pinyin ?? row.Pinyin ?? row.py ?? row['Pinyin (numeric)'] ?? row['Pinyin (tone marks)'] ?? "";
      const english =
        row.english ?? row.English ?? row.meaning ?? row.translation ?? row['English meaning'] ?? row['English Meaning'] ?? "";

      if (!simp) return null; // drop empty rows
      return { simp: String(simp), pinyin: String(pinyin || ""), english: String(english || "") };
    })
    .filter(Boolean) as Vocab[];
}

// 3) Normalize all sets once here
const HSK1 = adapt(HSK1raw as any[]);
const HSK2 = adapt(HSK2raw as any[]);
const HSK3 = adapt(HSK3raw as any[]); // <- fixes your error
const HSK4 = adapt(HSK4raw as any[]);
const HSK5 = adapt(HSK5raw as any[]);
const HSK6 = adapt(HSK6raw as any[]);
const TravelTourism = adapt(TravelTourismRaw as any[]);
const Workspace = adapt(WorkspaceRaw as any[]);
const Business = adapt(BusinessRaw as any[]);
const Academic = adapt(AcademicRaw as any[]);
const Global = adapt(GlobalRaw as any[]);
const EverydayLife = adapt(EverydayLifeRaw as any[]);
const NewsCulture = adapt(NewsCultureRaw as any[]);

// 4) Export the typed SETS map
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
