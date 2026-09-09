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

export type Origin = "colegio" | "enem";

export const ORIGIN_LABELS: Record<Origin, string> = {
  colegio: "Colégio",
  enem: "ENEM",
};

export interface Subject {
  id: string;
  name: string;
  area: Area;
  origin: Origin;
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

export type TipoAvaliacao = "prova" | "trabalho";

export const TIPO_LABELS: Record<TipoAvaliacao, string> = {
  prova: "Prova",
  trabalho: "Trabalho",
};

export const TIPO_OPTIONS = Object.keys(TIPO_LABELS) as TipoAvaliacao[];

export const ETAPA_OPTIONS = ["1ª Etapa", "2ª Etapa", "3ª Etapa"] as const;

export interface EtapaInfo {
  n: 1 | 2 | 3;
  label: string;
  term: string;
  max: number;
  provaMax: number;
  trabalhoMax: number;
}

export const ETAPAS: EtapaInfo[] = [
  { n: 1, label: "1ª Etapa", term: "1ª Etapa", max: 30, provaMax: 9, trabalhoMax: 3 },
  { n: 2, label: "2ª Etapa", term: "2ª Etapa", max: 35, provaMax: 10, trabalhoMax: 5 },
  { n: 3, label: "3ª Etapa", term: "3ª Etapa", max: 35, provaMax: 10, trabalhoMax: 5 },
];

// Extrai o número da etapa (1, 2 ou 3) de um texto livre como "1 etapa" ou "2ª Etapa".
// Se não conseguir identificar, assume 2ª/3ª etapa (valor mais comum, 35 pontos).
export function numeroDaEtapa(term: string): 1 | 2 | 3 {
  const match = term.match(/[123]/);
  if (match?.[0] === "1") return 1;
  if (match?.[0] === "3") return 3;
  return 2;
}

// Valor máximo de uma avaliação: 1ª Etapa vale 30 (3 provas de 9 + 1 trabalho de 3);
// 2ª e 3ª Etapa valem 35 (3 provas de 10 + 1 trabalho de 5).
export function valorMaximo(term: string, tipo: TipoAvaliacao): number {
  const etapa = numeroDaEtapa(term);
  if (tipo === "trabalho") return etapa === 1 ? 3 : 5;
  return etapa === 1 ? 9 : 10;
}

export interface Grade {
  id: string;
  subject: string;
  term: string;
  value: number;
  tipo: TipoAvaliacao;
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
