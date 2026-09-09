import { numeroDaEtapa, type Grade } from "./types";

// Faixas de cor por desempenho: <60% vermelho, 61–80% amarelo, >80% verde.
export function toneFor(pct: number) {
  if (pct < 60) return { bg: "bg-red-600 border-red-700 text-white", soft: "text-red-700 bg-red-50 border-red-200" };
  if (pct <= 80)
    return { bg: "bg-amber-400 border-amber-500 text-amber-950", soft: "text-amber-700 bg-amber-50 border-amber-200" };
  return { bg: "bg-emerald-600 border-emerald-700 text-white", soft: "text-emerald-700 bg-emerald-50 border-emerald-200" };
}

// Nota final de cada matéria em cada etapa = soma das notas lançadas naquela etapa.
// Chave: "<matéria>__<etapa 1|2|3>".
export function finaisPorMateriaEtapa(grades: Grade[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const g of grades) {
    const key = `${g.subject}__${numeroDaEtapa(g.term)}`;
    map[key] = (map[key] ?? 0) + Number(g.value);
  }
  return map;
}

// Média geral = soma da nota final de cada matéria (em cada etapa já lançada) dividida
// pela quantidade de matéria-etapas lançadas — não a média das notas de prova avulsas.
export function mediaGeral(grades: Grade[]): number | null {
  const finais = Object.values(finaisPorMateriaEtapa(grades));
  return finais.length ? finais.reduce((s, n) => s + n, 0) / finais.length : null;
}

// Média de uma etapa específica: mesma lógica, restrita às matérias com nota naquela etapa.
export function mediaDaEtapa(grades: Grade[], etapaN: 1 | 2 | 3): number | null {
  const finaisMap = finaisPorMateriaEtapa(grades);
  const materias = Array.from(
    new Set(grades.filter((g) => numeroDaEtapa(g.term) === etapaN).map((g) => g.subject))
  );
  const finais = materias
    .map((m) => finaisMap[`${m}__${etapaN}`])
    .filter((n): n is number => n !== undefined);
  return finais.length ? finais.reduce((s, n) => s + n, 0) / finais.length : null;
}
