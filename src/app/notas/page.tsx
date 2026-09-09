"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { finaisPorMateriaEtapa, mediaDaEtapa, mediaGeral } from "@/lib/grades";
import { ETAPAS, type Grade } from "@/lib/types";
import BoletimAnual from "@/components/BoletimAnual";

export default function NotasOverviewPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    supabase
      .from("grades")
      .select("*")
      .order("grade_date", { ascending: false })
      .then(({ data }) => {
        setGrades((data as Grade[]) ?? []);
        setLoading(false);
      });
  }, []);

  const allSubjects = useMemo(() => Array.from(new Set(grades.map((g) => g.subject))).sort(), [grades]);
  const finalsBySubjectEtapa = useMemo(() => finaisPorMateriaEtapa(grades), [grades]);
  const avg = mediaGeral(grades);

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

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ETAPAS.map((et) => {
          const m = mediaDaEtapa(grades, et.n);
          return (
            <Link
              key={et.n}
              href={`/notas/${et.n}`}
              className="rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{et.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-blue-700">
                {m !== null ? m.toFixed(1) : "—"}
                <span className="ml-1 text-sm font-medium text-neutral-400">/ {et.max}</span>
              </p>
              <p className="mt-1 text-xs text-neutral-400">ver notas da etapa →</p>
            </Link>
          );
        })}
      </section>

      {loading ? (
        <p className="text-sm text-neutral-400">Carregando…</p>
      ) : allSubjects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-sm text-neutral-400">
          Nenhuma nota lançada ainda — escolha uma etapa acima pra começar.
        </p>
      ) : (
        <BoletimAnual allSubjects={allSubjects} finalsBySubjectEtapa={finalsBySubjectEtapa} etapas={ETAPAS} />
      )}
    </div>
  );
}
