"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { daysUntil, fmtDate, weekday } from "@/lib/dates";
import type { EnemDates, Exam } from "@/lib/types";

const DEFAULT_ENEM: EnemDates = { day1: "2026-11-08", day2: "2026-11-15" };

export default function ProvasPage() {
  const [enem, setEnem] = useState<EnemDates>(DEFAULT_ENEM);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");

  async function load() {
    const [{ data: cfg }, { data: ex }] = await Promise.all([
      supabase.from("config").select("value").eq("key", "enem_dates").maybeSingle(),
      supabase.from("exams").select("*").order("exam_date"),
    ]);
    if (cfg?.value) setEnem(cfg.value as EnemDates);
    setExams(ex ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function addExam(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    await supabase.from("exams").insert({ title: title.trim(), subject: subject.trim() || null, exam_date: date });
    setTitle("");
    setSubject("");
    setDate("");
    load();
  }

  async function deleteExam(id: string) {
    await supabase.from("exams").delete().eq("id", id);
    load();
  }

  const fixed = [
    { id: null, title: "ENEM — Dia 1", subject: "Linguagens · Humanas · Redação", exam_date: enem.day1, tag: "ENEM" },
    { id: null, title: "ENEM — Dia 2", subject: "Natureza · Matemática", exam_date: enem.day2, tag: "ENEM" },
  ];
  const ownSorted = [...exams].sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const rows = [...fixed, ...ownSorted.map((e) => ({ ...e, tag: null as string | null }))];

  function badgeCls(days: number) {
    if (days < 0) return "bg-neutral-100 text-neutral-400";
    if (days <= 3) return "bg-red-50 text-red-700";
    if (days <= 10) return "bg-amber-50 text-amber-700";
    return "bg-emerald-50 text-emerald-700";
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Estudos</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-neutral-900">
          Próximas provas
        </h1>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="divide-y divide-neutral-100">
          {loading ? (
            <p className="px-4 py-6 text-sm text-neutral-400">Carregando…</p>
          ) : (
            rows.map((e, i) => {
              const days = daysUntil(e.exam_date);
              const label = days < 0 ? "realizada" : days === 0 ? "hoje" : `${days}d`;
              return (
                <div key={e.id ?? `fixed-${i}`} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-16 shrink-0 rounded-lg px-2 py-1 text-center font-mono text-sm font-semibold ${badgeCls(days)}`}>
                    {label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800">
                      {e.tag && (
                        <span className="mr-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-blue-700">
                          {e.tag}
                        </span>
                      )}
                      {e.title}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {e.subject ? `${e.subject} · ` : ""}
                      {weekday(e.exam_date)}, {fmtDate(e.exam_date)}
                    </p>
                  </div>
                  {e.id && (
                    <button onClick={() => deleteExam(e.id!)} className="shrink-0 text-neutral-300 hover:text-red-600">
                      ✕
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={addExam} className="flex flex-col gap-2 border-t border-neutral-200 p-4 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Prova ou simulado"
            className="min-w-0 flex-1 rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            required
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Matéria (opcional)"
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm sm:w-40"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            required
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-blue-700 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Adicionar
          </button>
        </form>
      </section>
    </div>
  );
}
