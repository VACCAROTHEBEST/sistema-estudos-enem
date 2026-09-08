// Datas são tratadas como "dia civil" no fuso de São Paulo (UTC-3, sem horário
// de verão desde 2019), independente do fuso do navegador.

export function fmtDate(iso: string): string {
  const d = new Date(iso + "T12:00:00-03:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function weekday(iso: string): string {
  const d = new Date(iso + "T12:00:00-03:00");
  if (isNaN(d.getTime())) return "";
  const w = d.toLocaleDateString("pt-BR", { weekday: "long" });
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00-03:00");
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export function todayLong(): string {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}
