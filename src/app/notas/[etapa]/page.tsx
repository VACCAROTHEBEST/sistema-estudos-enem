"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ETAPAS, numeroDaEtapa, type Grade, type TipoAvaliacao } from "@/lib/types";
import EtapaSection from "@/components/EtapaSection";

export default function EtapaPage() {
  const params = useParams<{ etapa: string }>();
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  const etapaN = Number(params.etapa);
  const etapa = ETAPAS.find((e) => e.n === etapaN);

  async function load() {
    const { data } = await supabase.from("grades").select("*").order("grade_date", { ascending: false });
    setGrades((data as Grade[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // Busca inicial ao montar a página; state é atualizado só depois do await interno.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  useEffect(() => {
    if (!etapa) router.replace("/notas");
  }, [etapa, router]);

  const allSubjects = useMemo(() => Array.from(new Set(grades.map((g) => g.subject))).sort(), [grades]);

  async function addGrade(subject: string, tipo: TipoAvaliacao, value: number, date: string) {
    if (!etapa) return;
    await supabase.from("grades").insert({
      subject: subject.trim(),
      term: etapa.term,
      tipo,
      value,
      grade_date: date || new Date().toISOString().slice(0, 10),
    });
    load();
  }

  async function deleteGrade(id: string) {
    await supabase.from("grades").delete().eq("id", id);
    load();
  }

  if (!etapa) return null;

  return (
    <EtapaSection
      etapa={etapa}
      grades={grades.filter((g) => numeroDaEtapa(g.term) === etapa.n)}
      allSubjects={allSubjects}
      onAdd={addGrade}
      onDelete={deleteGrade}
      loading={loading}
    />
  );
}
