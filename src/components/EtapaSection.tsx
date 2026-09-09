"use client";

import { useMemo, useState } from "react";
import { fmtDate } from "@/lib/dates";
import { toneFor } from "@/lib/grades";
import { TIPO_LABELS, TIPO_OPTIONS, valorMaximo, type EtapaInfo, type Grade, type TipoAvaliacao } from "@/lib/types";

const NEW_SUBJECT = "__nova__";

export default function EtapaSection({
  etapa,
  grades,
  allSubjects,
  onAdd,
  onDelete,
  loading,
}: {
  etapa: EtapaInfo;
  grades: Grade[];
  allSubjects: string[];
  onAdd: (subject: string, tipo: TipoAvaliacao, value: number, date: string) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}) {
  const [selSubject, setSelSubject] = useState<string>(allSubjects[0] ?? NEW_SUBJECT);
  const [novaMateria, setNovaMateria] = useState("");
  const [tipo, setTipo] = useState<TipoAvaliacao>("prova");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");

  const bySubject = useMemo(() => {
    const map: Record<string, Grade[]> = {};
    for (const g of grades) (map[g.subject] ||= []).push(g);
    return map;
  }, [grades]);

  const subjectsComNota = Object.keys(bySubject).sort();
  const subjectsSemNota = allSubjects.filter((s) => !bySubject[s]);

  const totals = subjectsComNota.map((s) => bySubject[s].reduce((sum, g) => sum + Number(g.value), 0));
  const etapaAvg = totals.length ? totals.reduce((s, n) => s + n, 0) / totals.length : null;
  const completas = subjectsComNota.filter((s) => {
    const entries = bySubject[s];
    const provas = entries.filter((g) => g.tipo === "prova").length;
    const trabalhos = entries.filter((g) => g.tipo === "trabalho").length;
    return provas >= 3 && trabalhos >= 1;
  }).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = selSubject === NEW_SUBJECT ? novaMateria.trim() : selSubject;
    const v = parseFloat(value.replace(",", "."));
    if (!subject || isNaN(v)) return;
    onAdd(subject, tipo, v, date);
    setNovaMateria("");
    setValue("");
    setDate("");
  }

  const currentMax = tipo === "trabalho" ? etapa.trabalhoMax : etapa.provaMax;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Notas escolares</p>
          <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-neutral-900">
            {etapa.label}
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            {etapa.max} pontos por matéria · 3 provas de {etapa.provaMax} + 1 trabalho de {etapa.trabalhoMax}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-semibold text-blue-700">
            {etapaAvg !== null ? etapaAvg.toFixed(1) : "—"}
            <span className="ml-1 text-sm font-medium text-neutral-400">/ {etapa.max}</span>
          </p>
          <p className="text-xs text-neutral-400">
            {completas}/{allSubjects.length || 0} matérias completas
          </p>
        </div>
      </header>

      {subjectsComNota.length > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {subjectsComNota.map((subj) => {
            const entries = bySubject[subj];
            const total = entries.reduce((s, g) => s + Number(g.value), 0);
            const pct = etapa.max > 0 ? (total / etapa.max) * 100 : 0;
            const provas = entries.filter((g) => g.tipo === "prova").length;
            const trabalhos = entries.filter((g) => g.tipo === "trabalho").length;
            const tone = toneFor(pct);
            return (
              <div key={subj} className={`rounded-xl border px-4 py-3 ${tone.bg}`}>
                <div className="font-mono text-xl font-semibold">
                  {total.toFixed(1)}
                  <span className="ml-1 text-xs font-medium opacity-80">/ {etapa.max}</span>
                </div>
                <div className="mt-0.5 truncate text-xs opacity-90">{subj}</div>
                <div className="mt-1 flex items-center justify-between font-mono text-[11px] font-semibold opacity-80">
                  <span>{pct.toFixed(0)}%</span>
                  <span className="font-sans font-normal opacity-70">
                    {provas}/3 provas · {trabalhos}/1 trab.
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {subjectsSemNota.length > 0 && (
        <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400">
          ainda sem nota nesta etapa: {subjectsSemNota.join(", ")}
        </p>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3 font-semibold">Matéria</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Nota</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                    Carregando…
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center italic text-neutral-400">
                    Nenhuma nota lançada nesta etapa ainda.
                  </td>
                </tr>
              ) : (
                grades.map((g) => (
                  <tr key={g.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2.5 text-neutral-700">{g.subject}</td>
                    <td className="px-4 py-2.5 text-neutral-500">{TIPO_LABELS[g.tipo]}</td>
                    <td className="px-4 py-2.5 font-mono">
                      {Number(g.value).toFixed(1)}
                      <span className="text-neutral-400"> / {valorMaximo(g.term, g.tipo)}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-neutral-500">
                      {g.grade_date ? fmtDate(g.grade_date) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => onDelete(g.id)} className="text-neutral-300 hover:text-red-600">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={submit} className="grid grid-cols-2 gap-2 border-t border-neutral-200 p-4 sm:grid-cols-6">
          <select
            value={selSubject}
            onChange={(e) => setSelSubject(e.target.value)}
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm sm:col-span-2"
          >
            {allSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={NEW_SUBJECT}>+ nova matéria…</option>
          </select>
          {selSubject === NEW_SUBJECT && (
            <input
              value={novaMateria}
              onChange={(e) => setNovaMateria(e.target.value)}
              placeholder="Nome da matéria"
              className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm sm:col-span-2"
              required
            />
          )}
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAvaliacao)}
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
          >
            {TIPO_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {TIPO_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Nota (0–${currentMax})`}
            inputMode="decimal"
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            required
          />
          <div className="flex gap-2 sm:col-span-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-w-0 flex-1 rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="shrink-0 rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Add
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
