"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { daysUntil, fmtDate, weekday } from "@/lib/dates";
import { AREA_LABELS, ORIGIN_LABELS, type EnemDates, type Exam, type SubjectWithTopics } from "@/lib/types";

const DEFAULT_ENEM: EnemDates = { day1: "2026-11-08", day2: "2026-11-15" };

type ProvaBase = {
  key: string;
  examId: string | null;
  title: string;
  tag: string | null;
  exam_date: string;
  notes: string | null;
};

export default function ConteudoProvasPage() {
  const [enem, setEnem] = useState<EnemDates>(DEFAULT_ENEM);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [links, setLinks] = useState<{ exam_id: string; subject_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [pickSubject, setPickSubject] = useState("");

  async function load() {
    const [{ data: cfg }, { data: ex }, { data: subs }, { data: exSubs }] = await Promise.all([
      supabase.from("config").select("value").eq("key", "enem_dates").maybeSingle(),
      supabase.from("exams").select("*").order("exam_date"),
      supabase.from("subjects").select("*, topics(*)").order("name"),
      supabase.from("exam_subjects").select("exam_id, subject_id"),
    ]);
    if (cfg?.value) setEnem(cfg.value as EnemDates);
    setExams(ex ?? []);
    setSubjects((subs as SubjectWithTopics[]) ?? []);
    setLinks(exSubs ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function toggleTopic(id: string, done: boolean) {
    await supabase.from("topics").update({ done: !done }).eq("id", id);
    load();
  }

  async function linkSubject(examId: string, subjectId: string) {
    if (!subjectId) return;
    await supabase.from("exam_subjects").insert({ exam_id: examId, subject_id: subjectId });
    setPickSubject("");
    setAddingTo(null);
    load();
  }

  async function unlinkSubject(examId: string, subjectId: string) {
    await supabase.from("exam_subjects").delete().eq("exam_id", examId).eq("subject_id", subjectId);
    load();
  }

  const provas: ProvaBase[] = useMemo(() => {
    const fixas: ProvaBase[] = [
      { key: "enem-1", examId: null, title: "ENEM — Dia 1", tag: "ENEM", exam_date: enem.day1, notes: "Linguagens · Ciências Humanas · Redação" },
      { key: "enem-2", examId: null, title: "ENEM — Dia 2", tag: "ENEM", exam_date: enem.day2, notes: "Ciências da Natureza · Matemática" },
    ];
    const proprias: ProvaBase[] = exams.map((e) => ({
      key: e.id,
      examId: e.id,
      title: e.title,
      tag: null,
      exam_date: e.exam_date,
      notes: e.notes,
    }));
    return [...fixas, ...proprias]
      .filter((p) => daysUntil(p.exam_date) >= 0)
      .sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  }, [exams, enem]);

  function subjectsFor(p: ProvaBase): SubjectWithTopics[] {
    if (p.examId === null) {
      const areasD1 = ["linguagens", "humanas", "redacao"];
      const areasD2 = ["natureza", "matematica"];
      const areas = p.key === "enem-1" ? areasD1 : areasD2;
      return subjects.filter((s) => s.origin === "enem" && areas.includes(s.area));
    }
    const ids = new Set(links.filter((l) => l.exam_id === p.examId).map((l) => l.subject_id));
    return subjects.filter((s) => ids.has(s.id));
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Estudos</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-neutral-900">
          Conteúdo das provas
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          O que vai cair em cada prova, com os mesmos tópicos e caixinhas de &quot;já estudei&quot; das Matérias.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-400">Carregando…</p>
      ) : provas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma prova agendada.
        </p>
      ) : (
        <div className="space-y-3">
          {provas.map((p) => {
            const subs = subjectsFor(p);
            const allTopics = subs.flatMap((s) => s.topics);
            const done = allTopics.filter((t) => t.done).length;
            const total = allTopics.length;
            const pct = total > 0 ? (done / total) * 100 : 0;
            const d = daysUntil(p.exam_date);
            const open = !!openIds[p.key];
            const availableToAdd = subjects.filter((s) => !subs.some((x) => x.id === s.id));

            return (
              <section key={p.key} className="rounded-xl border border-neutral-200 bg-white shadow-sm">
                <button
                  onClick={() => setOpenIds((o) => ({ ...o, [p.key]: !o[p.key] }))}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-14 shrink-0 rounded-lg bg-blue-50 px-2 py-1 text-center font-mono text-xs font-semibold text-blue-700">
                      {d === 0 ? "hoje" : `${d}d`}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        {p.tag && (
                          <span className="mr-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-blue-700">
                            {p.tag}
                          </span>
                        )}
                        {p.title}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {weekday(p.exam_date)}, {fmtDate(p.exam_date)}
                        {p.notes ? ` · ${p.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {total > 0 && (
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold text-neutral-700">
                          {done}/{total} <span className="text-xs font-medium text-neutral-400">estudado</span>
                        </p>
                        <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <span className={`text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
                  </div>
                </button>

                {open && (
                  <div className="space-y-4 border-t border-neutral-100 px-5 py-4">
                    {subs.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-400">
                        Nenhuma matéria vinculada a essa prova ainda.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {subs.map((s) => {
                          const items = [...s.topics].sort((a, b) => Number(a.done) - Number(b.done));
                          const pend = items.filter((t) => !t.done).length;
                          return (
                            <div key={s.id} className="rounded-lg border border-neutral-200 p-3">
                              <div className="mb-1.5 flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-neutral-900">{s.name}</p>
                                  <p className="text-[11px] uppercase tracking-wide text-neutral-400">
                                    {AREA_LABELS[s.area]}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
                                      pend === 0
                                        ? "bg-emerald-50 text-emerald-700"
                                        : pend <= 4
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {pend === 0 ? "em dia" : `${pend} pendente${pend === 1 ? "" : "s"}`}
                                  </span>
                                  {p.examId && (
                                    <button
                                      onClick={() => unlinkSubject(p.examId!, s.id)}
                                      title="desvincular matéria dessa prova"
                                      className="text-neutral-300 hover:text-red-600"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                              <ul className="space-y-1.5">
                                {items.length === 0 && (
                                  <li className="py-1 text-[13px] italic text-neutral-400">Sem tópicos cadastrados.</li>
                                )}
                                {items.map((t) => (
                                  <li key={t.id} className="flex items-center gap-2 text-[13.5px]">
                                    <input
                                      type="checkbox"
                                      checked={t.done}
                                      onChange={() => toggleTopic(t.id, t.done)}
                                      className="h-3.5 w-3.5 accent-blue-700"
                                    />
                                    <span className={t.done ? "text-neutral-400 line-through" : "text-neutral-700"}>
                                      {t.text}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {p.examId && (
                      <div className="border-t border-dashed border-neutral-200 pt-3">
                        {addingTo === p.examId ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={pickSubject}
                              onChange={(e) => setPickSubject(e.target.value)}
                              className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
                              autoFocus
                            >
                              <option value="">Escolha uma matéria…</option>
                              {availableToAdd.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} · {ORIGIN_LABELS[s.origin]}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => linkSubject(p.examId!, pickSubject)}
                              className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                            >
                              Vincular
                            </button>
                            <button
                              onClick={() => {
                                setAddingTo(null);
                                setPickSubject("");
                              }}
                              className="text-xs text-neutral-400 hover:text-neutral-700"
                            >
                              cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTo(p.examId)}
                            className="text-xs font-medium text-blue-700 hover:underline"
                          >
                            + vincular matéria a essa prova
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
