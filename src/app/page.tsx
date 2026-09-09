"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { daysUntil, fmtDate, todayLong, weekday } from "@/lib/dates";
import { AREA_LABELS, ORIGIN_LABELS, type EnemDates, type Exam, type Grade, type SubjectWithTopics } from "@/lib/types";

const DEFAULT_ENEM: EnemDates = { day1: "2026-11-08", day2: "2026-11-15" };

export default function DashboardPage() {
  const [enem, setEnem] = useState<EnemDates>(DEFAULT_ENEM);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDates, setEditingDates] = useState(false);
  const [draftDay1, setDraftDay1] = useState(DEFAULT_ENEM.day1);
  const [draftDay2, setDraftDay2] = useState(DEFAULT_ENEM.day2);

  async function load() {
    const [{ data: cfg }, { data: subs }, { data: gr }, { data: ex }] = await Promise.all([
      supabase.from("config").select("value").eq("key", "enem_dates").maybeSingle(),
      supabase.from("subjects").select("*, topics(*)").order("name"),
      supabase.from("grades").select("*"),
      supabase.from("exams").select("*").order("exam_date"),
    ]);
    if (cfg?.value) setEnem(cfg.value as EnemDates);
    setSubjects((subs as SubjectWithTopics[]) ?? []);
    setGrades(gr ?? []);
    setExams(ex ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function saveDates() {
    const value = { day1: draftDay1, day2: draftDay2 };
    await supabase.from("config").upsert({ key: "enem_dates", value }, { onConflict: "user_id,key" });
    setEnem(value);
    setEditingDates(false);
  }

  const pendingBySubject = subjects.map((s) => ({
    ...s,
    open: s.topics.filter((t) => !t.done).length,
  }));
  const pendingSubjectsCount = pendingBySubject.filter((s) => s.open > 0).length;
  const pendingTopicsCount = pendingBySubject.reduce((sum, s) => sum + s.open, 0);
  const upcomingExams = exams
    .filter((e) => daysUntil(e.exam_date) >= 0)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const nextExam = upcomingExams[0];
  const avg = grades.length ? grades.reduce((s, g) => s + Number(g.value), 0) / grades.length : null;
  const topPending = pendingBySubject
    .filter((s) => s.open > 0)
    .sort((a, b) => b.open - a.open)
    .slice(0, 5);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">
            Painel
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-neutral-900">
            Reta final para o ENEM
          </h1>
        </div>
        <p className="font-mono text-sm text-neutral-400">Hoje · {todayLong()}</p>
      </header>

      {/* hero: contagem regressiva ENEM */}
      <section>
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => {
              setDraftDay1(enem.day1);
              setDraftDay2(enem.day2);
              setEditingDates((v) => !v);
            }}
            className="text-xs font-medium text-neutral-400 underline decoration-dotted underline-offset-2 hover:text-neutral-700"
          >
            editar datas do ENEM
          </button>
        </div>

        {editingDates && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
            <label className="flex items-center gap-2 text-xs text-neutral-500">
              Dia 1
              <input
                type="date"
                value={draftDay1}
                onChange={(e) => setDraftDay1(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1 text-sm text-neutral-800"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-neutral-500">
              Dia 2
              <input
                type="date"
                value={draftDay2}
                onChange={(e) => setDraftDay2(e.target.value)}
                className="rounded border border-neutral-300 px-2 py-1 text-sm text-neutral-800"
              />
            </label>
            <button
              onClick={saveDates}
              className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Salvar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <EnemCard label="ENEM · Dia 1" date={enem.day1} areas={["Linguagens", "Ciências Humanas", "Redação"]} />
          <EnemCard label="ENEM · Dia 2" date={enem.day2} areas={["Ciências da Natureza", "Matemática"]} />
        </div>
      </section>

      {/* stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat num={loading ? "—" : pendingSubjectsCount} cap="matérias com pendências" />
        <Stat num={loading ? "—" : pendingTopicsCount} cap="tópicos pendentes" />
        <Stat
          num={nextExam ? `${daysUntil(nextExam.exam_date)}d` : "—"}
          cap={nextExam ? nextExam.title : "nenhuma prova agendada"}
          mono
        />
        <Stat num={avg === null ? "—" : avg.toFixed(1)} cap="média geral" mono />
      </section>

      {/* matérias com mais pendências */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-[var(--font-display)] text-lg font-semibold text-neutral-900">
            Prioridades agora
          </h2>
          <Link href="/materias" className="text-xs font-medium text-blue-700 hover:underline">
            ver todas as matérias →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-neutral-400">Carregando…</p>
        ) : topPending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">
            Nenhuma pendência registrada — tudo em dia por aqui.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            {topPending.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{s.name}</p>
                  <p className="text-xs text-neutral-400">
                    {ORIGIN_LABELS[s.origin]} · {AREA_LABELS[s.area]}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-700">
                  {s.open} pendente{s.open === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EnemCard({ label, date, areas }: { label: string; date: string; areas: string[] }) {
  const d = daysUntil(date);
  return (
    <div className="rounded-2xl border border-neutral-200 border-t-[3px] border-t-blue-700 bg-white px-6 py-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{label}</p>
      <p className="font-digital mt-1 text-4xl font-semibold leading-none text-blue-700">
        {d > 0 ? d : d === 0 ? "🎯" : "—"}
        {d > 0 && <span className="ml-1.5 font-sans text-sm font-medium text-neutral-400">dias</span>}
        {d === 0 && <span className="ml-2 font-sans text-sm font-medium text-neutral-400">é hoje</span>}
        {d < 0 && <span className="ml-1 font-sans text-sm font-medium text-neutral-400">já passou</span>}
      </p>
      <p className="mt-2 text-sm text-neutral-500">
        {weekday(date)}, {fmtDate(date)}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {areas.map((a) => (
          <span key={a} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            {a}
          </span>
        ))}
      </div>
    </div>
  );
}

function Stat({ num, cap, mono }: { num: string | number; cap: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className={`text-xl font-semibold ${mono ? "font-digital" : ""}`}>{num}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{cap}</div>
    </div>
  );
}
