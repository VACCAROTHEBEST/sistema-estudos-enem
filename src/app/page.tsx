"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { daysUntil, fmtDate, todayLong, weekday } from "@/lib/dates";
import { mediaDaEtapa, mediaGeral } from "@/lib/grades";
import {
  AREA_LABELS,
  ETAPAS,
  ORIGIN_LABELS,
  type EnemDates,
  type Exam,
  type Grade,
  type SubjectWithTopics,
} from "@/lib/types";

const DEFAULT_ENEM: EnemDates = { day1: "2026-11-08", day2: "2026-11-15" };

export default function DashboardPage() {
  const [enem, setEnem] = useState<EnemDates>(DEFAULT_ENEM);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

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
  const avg = mediaGeral(grades);
  const topPending = pendingBySubject
    .filter((s) => s.open > 0)
    .sort((a, b) => b.open - a.open)
    .slice(0, 5);

  const colegioTopics = subjects.filter((s) => s.origin === "colegio").flatMap((s) => s.topics);
  const enemTopics = subjects.filter((s) => s.origin === "enem").flatMap((s) => s.topics);
  const pctDone = (topics: { done: boolean }[]) =>
    topics.length ? (topics.filter((t) => t.done).length / topics.length) * 100 : 0;

  const proximasProvas = [
    { title: "ENEM — Dia 1", subject: "Linguagens · Humanas · Redação", exam_date: enem.day1, tag: "ENEM" },
    { title: "ENEM — Dia 2", subject: "Natureza · Matemática", exam_date: enem.day2, tag: "ENEM" },
    ...exams.map((e) => ({ title: e.title, subject: e.subject, exam_date: e.exam_date, tag: null as string | null })),
  ]
    .filter((e) => daysUntil(e.exam_date) >= 0)
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .slice(0, 4);

  const notasRecentes = [...grades]
    .filter((g) => g.grade_date)
    .sort((a, b) => (b.grade_date ?? "").localeCompare(a.grade_date ?? ""))
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
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <EnemCard label="ENEM · Dia 1" date={enem.day1} areas={["Linguagens", "Ciências Humanas", "Redação"]} />
        <EnemCard label="ENEM · Dia 2" date={enem.day2} areas={["Ciências da Natureza", "Matemática"]} />
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

      {/* média por etapa + progresso do edital */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-800">Média por etapa</h2>
            <Link href="/notas" className="text-xs font-medium text-blue-700 hover:underline">
              ver notas →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {ETAPAS.map((et) => {
              const m = mediaDaEtapa(grades, et.n);
              return (
                <Link
                  key={et.n}
                  href={`/notas/${et.n}`}
                  className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-center hover:bg-neutral-100"
                >
                  <p className="font-mono text-lg font-semibold text-neutral-800">{m !== null ? m.toFixed(1) : "—"}</p>
                  <p className="text-[11px] text-neutral-400">{et.label}</p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-neutral-800">Progresso do edital</h2>
            <Link href="/materias" className="text-xs font-medium text-blue-700 hover:underline">
              ver matérias →
            </Link>
          </div>
          <div className="space-y-3">
            <ProgressBar label={ORIGIN_LABELS.colegio} pct={pctDone(colegioTopics)} />
            <ProgressBar label={ORIGIN_LABELS.enem} pct={pctDone(enemTopics)} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* matérias com mais pendências */}
        <div>
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
        </div>

        {/* próximas provas */}
        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-[var(--font-display)] text-lg font-semibold text-neutral-900">
              Próximas provas
            </h2>
            <Link href="/provas" className="text-xs font-medium text-blue-700 hover:underline">
              ver todas →
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-400">Carregando…</p>
          ) : proximasProvas.length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-400">
              Nenhuma prova agendada.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
              {proximasProvas.map((e, i) => {
                const d = daysUntil(e.exam_date);
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-12 shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-center font-mono text-xs font-semibold text-blue-700">
                      {d === 0 ? "hoje" : `${d}d`}
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
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* notas recentes */}
      {notasRecentes.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-[var(--font-display)] text-lg font-semibold text-neutral-900">Notas recentes</h2>
            <Link href="/notas" className="text-xs font-medium text-blue-700 hover:underline">
              ver todas as notas →
            </Link>
          </div>
          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
            {notasRecentes.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-neutral-800">{g.subject}</p>
                  <p className="text-xs text-neutral-400">
                    {g.term} · {g.tipo === "trabalho" ? "Trabalho" : "Prova"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold text-neutral-800">{Number(g.value).toFixed(1)}</p>
                  <p className="text-[11px] text-neutral-400">{g.grade_date ? fmtDate(g.grade_date) : "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EnemCard({ label, date, areas }: { label: string; date: string; areas: string[] }) {
  const d = daysUntil(date);
  return (
    <div className="rounded-2xl border border-neutral-200 border-t-[3px] border-t-blue-700 bg-white px-6 py-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400">{label}</p>
      <p className="mt-1 font-mono text-4xl font-semibold leading-none text-blue-700">
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
      <div className={`text-xl font-semibold ${mono ? "font-mono" : ""}`}>{num}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{cap}</div>
    </div>
  );
}

function ProgressBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-neutral-500">{label}</span>
        <span className="font-mono font-semibold text-neutral-700">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}
