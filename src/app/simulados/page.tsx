"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AREA_LABELS,
  ORIGIN_LABELS,
  type Origin,
  type Question,
  type SubjectWithTopics,
} from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E"];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function SimuladosPage() {
  const [tab, setTab] = useState<"gerar" | "banco">("gerar");
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: subs }, { data: qs }] = await Promise.all([
      supabase.from("subjects").select("*, topics(*)").order("name"),
      supabase.from("questions").select("*").order("created_at", { ascending: false }),
    ]);
    setSubjects((subs as SubjectWithTopics[]) ?? []);
    setQuestions((qs as Question[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">Estudos</p>
        <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-neutral-900">
          Simulados
        </h1>
        <p className="mt-1 text-xs text-neutral-400">
          Monte simulados com as questões que você mesmo cadastrar, filtrando por matéria.
        </p>
      </header>

      <div className="flex gap-1 border-b border-neutral-200">
        {([
          ["gerar", "Montar simulado"],
          ["banco", `Minhas questões (${questions.length})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative px-4 py-2 text-sm font-semibold transition-colors ${
              tab === key ? "text-blue-700" : "text-neutral-400 hover:text-neutral-700"
            }`}
          >
            {label}
            {tab === key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-blue-700" />}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">Carregando…</p>
      ) : tab === "gerar" ? (
        <GerarSimulado subjects={subjects} questions={questions} />
      ) : (
        <BancoDeQuestoes subjects={subjects} questions={questions} onChange={load} />
      )}
    </div>
  );
}

// ---------- Montar simulado ----------

function GerarSimulado({ subjects, questions }: { subjects: SubjectWithTopics[]; questions: Question[] }) {
  const [origin, setOrigin] = useState<Origin | "todas">("todas");
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [qtd, setQtd] = useState(10);
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [corrected, setCorrected] = useState(false);

  const filteredSubjects = subjects.filter((s) => origin === "todas" || s.origin === origin);

  const disponiveis = questions.filter((q) => {
    if (selectedSubjects.size === 0) return true;
    return q.subject_id && selectedSubjects.has(q.subject_id);
  });

  function toggleSubject(id: string) {
    setSelectedSubjects((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function gerar() {
    const picked = shuffle(disponiveis).slice(0, qtd);
    setQuiz(picked);
    setAnswers({});
    setCorrected(false);
  }

  function novoSimulado() {
    setQuiz(null);
    setAnswers({});
    setCorrected(false);
  }

  if (quiz) {
    const score = quiz.filter((q) => answers[q.id] === q.correct_index).length;
    const respondidas = Object.keys(answers).length;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-neutral-800">
              {quiz.length} questõe{quiz.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs text-neutral-400">
              {corrected ? `Resultado: ${score}/${quiz.length} corretas` : `${respondidas}/${quiz.length} respondidas`}
            </p>
          </div>
          <div className="flex gap-2">
            {!corrected && (
              <button
                onClick={() => setCorrected(true)}
                disabled={respondidas === 0}
                className="rounded-md bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
              >
                Corrigir
              </button>
            )}
            <button
              onClick={novoSimulado}
              className="rounded-md border border-neutral-300 px-3.5 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50"
            >
              Novo simulado
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {quiz.map((q, i) => {
            const subj = subjects.find((s) => s.id === q.subject_id);
            const picked = answers[q.id];
            return (
              <div key={q.id} className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2 text-xs text-neutral-400">
                  <span className="font-mono font-semibold text-neutral-500">{i + 1}.</span>
                  {subj && <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-medium">{subj.name}</span>}
                </div>
                <p className="whitespace-pre-wrap text-sm text-neutral-800">{q.statement}</p>
                <div className="mt-3 space-y-1.5">
                  {q.alternatives.map((alt, idx) => {
                    const isPicked = picked === idx;
                    const isCorrect = idx === q.correct_index;
                    let cls = "border-neutral-200 hover:bg-neutral-50";
                    if (corrected && isCorrect) cls = "border-emerald-300 bg-emerald-50";
                    else if (corrected && isPicked && !isCorrect) cls = "border-red-300 bg-red-50";
                    else if (!corrected && isPicked) cls = "border-blue-300 bg-blue-50";
                    return (
                      <button
                        key={idx}
                        disabled={corrected}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                        className={`flex w-full items-start gap-2.5 rounded-lg border px-3 py-2 text-left text-sm text-neutral-700 transition-colors disabled:cursor-default ${cls}`}
                      >
                        <span className="font-mono font-semibold text-neutral-400">{LETTERS[idx]}</span>
                        <span className="flex-1">{alt}</span>
                      </button>
                    );
                  })}
                </div>
                {corrected && q.explanation && (
                  <p className="mt-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                    <span className="font-semibold text-neutral-600">Explicação: </span>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Origem</p>
        <div className="flex gap-1.5">
          {(["todas", "colegio", "enem"] as const).map((o) => (
            <button
              key={o}
              onClick={() => {
                setOrigin(o);
                setSelectedSubjects(new Set());
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                origin === o ? "bg-blue-700 text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
              }`}
            >
              {o === "todas" ? "Todas" : ORIGIN_LABELS[o]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Matérias {selectedSubjects.size === 0 && <span className="font-normal normal-case text-neutral-400">(nenhuma selecionada = todas)</span>}
        </p>
        {filteredSubjects.length === 0 ? (
          <p className="text-sm text-neutral-400">Nenhuma matéria cadastrada.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {filteredSubjects.map((s) => {
              const count = questions.filter((q) => q.subject_id === s.id).length;
              const active = selectedSubjects.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.id)}
                  disabled={count === 0}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {s.name} <span className="text-neutral-400">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">Quantidade</p>
          <input
            type="number"
            min={1}
            max={Math.max(disponiveis.length, 1)}
            value={qtd}
            onChange={(e) => setQtd(Math.max(1, Number(e.target.value) || 1))}
            className="w-24 rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
          />
        </div>
        <p className="pb-2 text-xs text-neutral-400">{disponiveis.length} questõe{disponiveis.length === 1 ? "" : "s"} disponíve{disponiveis.length === 1 ? "l" : "is"} com esse filtro</p>
      </div>

      <button
        onClick={gerar}
        disabled={disponiveis.length === 0}
        className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-40"
      >
        Gerar simulado
      </button>
      {disponiveis.length === 0 && (
        <p className="text-xs text-neutral-400">
          Cadastre questões na aba &quot;Minhas questões&quot; antes de montar um simulado com esse filtro.
        </p>
      )}
    </div>
  );
}

// ---------- Minhas questões ----------

function BancoDeQuestoes({
  subjects,
  questions,
  onChange,
}: {
  subjects: SubjectWithTopics[];
  questions: Question[];
  onChange: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [statement, setStatement] = useState("");
  const [alts, setAlts] = useState(["", "", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [source, setSource] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [saving, setSaving] = useState(false);

  const topicsOfSubject = subjects.find((s) => s.id === subjectId)?.topics ?? [];

  function resetForm() {
    setSubjectId("");
    setTopicId("");
    setStatement("");
    setAlts(["", "", "", "", ""]);
    setCorrect(0);
    setExplanation("");
    setSource("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = alts.map((a) => a.trim()).filter(Boolean);
    if (!statement.trim() || cleaned.length < 2) return;
    if (correct >= cleaned.length) return;
    setSaving(true);
    await supabase.from("questions").insert({
      subject_id: subjectId || null,
      topic_id: topicId || null,
      statement: statement.trim(),
      alternatives: cleaned,
      correct_index: correct,
      explanation: explanation.trim() || null,
      source: source.trim() || null,
    });
    setSaving(false);
    resetForm();
    setShowForm(false);
    onChange();
  }

  async function remove(id: string) {
    await supabase.from("questions").delete().eq("id", id);
    onChange();
  }

  const filtered = filterSubject ? questions.filter((q) => q.subject_id === filterSubject) : questions;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
        >
          <option value="">Todas as matérias</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          {showForm ? "Cancelar" : "+ Nova questão"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="flex flex-wrap gap-2">
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setTopicId("");
              }}
              className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            >
              <option value="">Sem matéria</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {AREA_LABELS[s.area]}
                </option>
              ))}
            </select>
            {subjectId && topicsOfSubject.length > 0 && (
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
              >
                <option value="">Sem tópico específico</option>
                {topicsOfSubject.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.text}
                  </option>
                ))}
              </select>
            )}
            <input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Fonte (ex: apostila cap. 3) — opcional"
              className="min-w-0 flex-1 rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            />
          </div>

          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Enunciado da questão"
            rows={3}
            required
            className="w-full rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
          />

          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Alternativas (marque a correta — mínimo 2)
            </p>
            {alts.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  className="h-3.5 w-3.5 accent-blue-700"
                />
                <span className="w-4 font-mono text-xs font-semibold text-neutral-400">{LETTERS[i]}</span>
                <input
                  value={a}
                  onChange={(e) => {
                    const next = [...alts];
                    next[i] = e.target.value;
                    setAlts(next);
                  }}
                  placeholder={i < 2 ? "obrigatória" : "opcional"}
                  className="min-w-0 flex-1 rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
                />
              </div>
            ))}
          </div>

          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explicação da resposta (opcional, aparece na correção)"
            rows={2}
            className="w-full rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar questão"}
          </button>
        </form>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma questão cadastrada ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => {
            const subj = subjects.find((s) => s.id === q.subject_id);
            return (
              <details key={q.id} className="group rounded-lg border border-neutral-200 bg-white px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-neutral-800">{q.statement}</p>
                    <p className="text-xs text-neutral-400">
                      {subj ? subj.name : "sem matéria"}
                      {q.source ? ` · ${q.source}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      remove(q.id);
                    }}
                    className="shrink-0 text-neutral-300 hover:text-red-600"
                  >
                    ✕
                  </button>
                </summary>
                <div className="mt-3 space-y-1 border-t border-dashed border-neutral-100 pt-3">
                  {q.alternatives.map((a, i) => (
                    <p
                      key={i}
                      className={`text-xs ${i === q.correct_index ? "font-semibold text-emerald-700" : "text-neutral-500"}`}
                    >
                      {LETTERS[i]}) {a}
                    </p>
                  ))}
                  {q.explanation && <p className="mt-2 text-xs italic text-neutral-400">{q.explanation}</p>}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
