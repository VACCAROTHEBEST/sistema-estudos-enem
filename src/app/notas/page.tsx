"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fmtDate } from "@/lib/dates";
import type { Grade } from "@/lib/types";

export default function NotasPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [term, setTerm] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");

  async function load() {
    const { data } = await supabase.from("grades").select("*").order("grade_date", { ascending: false });
    setGrades(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function addGrade(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(value.replace(",", "."));
    if (!subject.trim() || !term.trim() || isNaN(v)) return;
    await supabase.from("grades").insert({
      subject: subject.trim(),
      term: term.trim(),
      value: v,
      grade_date: date || new Date().toISOString().slice(0, 10),
    });
    setSubject("");
    setTerm("");
    setValue("");
    setDate("");
    load();
  }

  async function deleteGrade(id: string) {
    await supabase.from("grades").delete().eq("id", id);
    load();
  }

  const avg = grades.length ? grades.reduce((s, g) => s + Number(g.value), 0) / grades.length : null;

  const bySubject = grades.reduce<Record<string, number[]>>((acc, g) => {
    (acc[g.subject] ||= []).push(Number(g.value));
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Estudos</p>
          <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-neutral-900">
            Notas escolares
          </h1>
        </div>
        {avg !== null && (
          <p className="font-mono text-sm text-neutral-500">
            média geral <span className="text-lg font-semibold text-blue-700">{avg.toFixed(1)}</span>
          </p>
        )}
      </header>

      {Object.keys(bySubject).length > 0 && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(bySubject).map(([subj, values]) => {
            const a = values.reduce((s, v) => s + v, 0) / values.length;
            return (
              <div key={subj} className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                <div className="font-mono text-xl font-semibold text-neutral-800">{a.toFixed(1)}</div>
                <div className="mt-0.5 truncate text-xs text-neutral-500">{subj}</div>
              </div>
            );
          })}
        </section>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
                <th className="px-4 py-3 font-semibold">Matéria</th>
                <th className="px-4 py-3 font-semibold">Etapa</th>
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
                    Nenhuma nota lançada ainda.
                  </td>
                </tr>
              ) : (
                grades.map((g) => (
                  <tr key={g.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2.5">{g.subject}</td>
                    <td className="px-4 py-2.5 text-neutral-500">{g.term}</td>
                    <td className="px-4 py-2.5 font-mono">{Number(g.value).toFixed(1)}</td>
                    <td className="px-4 py-2.5 font-mono text-neutral-500">
                      {g.grade_date ? fmtDate(g.grade_date) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => deleteGrade(g.id)} className="text-neutral-300 hover:text-red-600">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={addGrade} className="grid grid-cols-2 gap-2 border-t border-neutral-200 p-4 sm:grid-cols-5">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Matéria"
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm sm:col-span-2"
            required
          />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Etapa (ex: 3º bim)"
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            required
          />
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nota (0–10)"
            inputMode="decimal"
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            required
          />
          <div className="flex gap-2">
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
