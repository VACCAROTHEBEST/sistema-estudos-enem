export type Area =
  | "linguagens"
  | "humanas"
  | "natureza"
  | "matematica"
  | "redacao"
  | "outra";

export const AREA_LABELS: Record<Area, string> = {
  linguagens: "Linguagens",
  humanas: "Ciências Humanas",
  natureza: "Ciências da Natureza",
  matematica: "Matemática",
  redacao: "Redação",
  outra: "Outra",
};

export const AREA_OPTIONS = Object.keys(AREA_LABELS) as Area[];

export interface Subject {
  id: string;
  name: string;
  area: Area;
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  text: string;
  done: boolean;
  created_at: string;
}

export interface SubjectWithTopics extends Subject {
  topics: Topic[];
}

export interface Grade {
  id: string;
  subject: string;
  term: string;
  value: number;
  grade_date: string | null;
  created_at: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string | null;
  exam_date: string;
  notes: string | null;
  created_at: string;
}

export interface EnemDates {
  day1: string;
  day2: string;
}
