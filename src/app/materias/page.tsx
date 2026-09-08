"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AREA_LABELS, AREA_OPTIONS, type Area, type SubjectWithTopics } from "@/lib/types";

export default function MateriasPage() {
  const [subjects, setSubjects] = useState<SubjectWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState<Area>("outra");
  const [topicDraft, setTopicDraft] = useState<Record<string, string>>({});

  async function load() {
    const { data } = await supabase.from("subjects").select("*, topics(*)").order("name");
    setSubjects((data as SubjectWithTopics[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await supabase.from("subjects").insert({ name: newName.trim(), area: newArea });
    setNewName("");
    setNewArea("outra");
    setShowNew(false);
    load();
  }

  async function deleteSubject(id: string) {
    await supabase.from("subjects").delete().eq("id", id);
    load();
  }

  async function addTopic(subjectId: string) {
    const text = (topicDraft[subjectId] || "").trim();
    if (!text) return;
    await supabase.from("topics").insert({ subject_id: subjectId, text });
    setTopicDraft((d) => ({ ...d, [subjectId]: "" }));
    load();
  }

  async function toggleTopic(id: string, done: boolean) {
    await supabase.from("topics").update({ done: !done }).eq("id", id);
    load();
  }

  async function removeTopic(id: string) {
    await supabase.from("topics").delete().eq("id", id);
    load();
  }

  const sorted = [...subjects].sort((a, b) => {
    const pa = a.topics.filter((t) => !t.done).length;
    const pb = b.topics.filter((t) => !t.done).length;
    if (pb !== pa) return pb - pa;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">
            Estudos
          </p>
          <h1 className="mt-1 font-[var(--font-display)] text-3xl font-semibold tracking-tight text-neutral-900">
            Matérias pendentes
          </h1>
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="rounded-md bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          + Nova matéria
        </button>
      </header>

      {showNew && (
        <form
          onSubmit={addSubject}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da matéria"
            className="min-w-0 flex-1 rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
            required
          />
          <select
            value={newArea}
            onChange={(e) => setNewArea(e.target.value as Area)}
            className="rounded border border-neutral-300 px-2.5 py-1.5 text-sm"
          >
            {AREA_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {AREA_LABELS[a]}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-md bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-800">
            Adicionar
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((s) => {
            const open = s.topics.filter((t) => !t.done).length;
            const badgeCls =
              open === 0
                ? "bg-emerald-50 text-emerald-700"
                : open <= 4
                ? "bg-amber-50 text-amber-700"
                : "bg-red-50 text-red-700";
            const items = [...s.topics].sort((a, b) => Number(a.done) - Number(b.done));
            return (
              <div key={s.id} className="flex min-h-[190px] flex-col rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{s.name}</p>
                    <p className="text-[11px] uppercase tracking-wide text-neutral-400">{AREA_LABELS[s.area]}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${badgeCls}`}>
                      {open === 0 ? "em dia" : `${open} pendente${open === 1 ? "" : "s"}`}
                    </span>
                    <button
                      onClick={() => deleteSubject(s.id)}
                      title="excluir matéria"
                      className="text-neutral-300 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <ul className="my-2 flex-1 space-y-1.5">
                  {items.length === 0 && (
                    <li className="py-1 text-[13px] italic text-neutral-400">Nada pendente aqui.</li>
                  )}
                  {items.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-[13.5px]">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => toggleTopic(t.id, t.done)}
                        className="h-3.5 w-3.5 accent-blue-700"
                      />
                      <span className={`flex-1 ${t.done ? "text-neutral-400 line-through" : "text-neutral-700"}`}>
                        {t.text}
                      </span>
                      <button onClick={() => removeTopic(t.id)} className="px-1 text-neutral-300 hover:text-red-600">
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTopic(s.id);
                  }}
                  className="mt-auto flex gap-1.5 border-t border-dashed border-neutral-200 pt-2"
                >
                  <input
                    value={topicDraft[s.id] || ""}
                    onChange={(e) => setTopicDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                    placeholder="novo tópico…"
                    className="min-w-0 flex-1 rounded border border-neutral-200 px-2 py-1 text-[12.5px]"
                  />
                  <button
                    type="submit"
                    className="rounded border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[12.5px] font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Add
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
