import { toneFor } from "@/lib/grades";
import type { EtapaInfo } from "@/lib/types";

export default function BoletimAnual({
  allSubjects,
  finalsBySubjectEtapa,
  etapas,
}: {
  allSubjects: string[];
  finalsBySubjectEtapa: Record<string, number>;
  etapas: EtapaInfo[];
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="font-[var(--font-display)] text-lg font-semibold text-neutral-900">Boletim anual</h2>
        <p className="text-xs text-neutral-400">
          Nota final de cada matéria em cada etapa, e a média entre as etapas já lançadas.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[11px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-2.5 font-semibold">Matéria</th>
              {etapas.map((et) => (
                <th key={et.n} className="px-4 py-2.5 font-semibold">
                  {et.label}
                </th>
              ))}
              <th className="px-4 py-2.5 font-semibold">Média anual</th>
            </tr>
          </thead>
          <tbody>
            {allSubjects.map((subj) => {
              const porEtapa = etapas.map((et) => finalsBySubjectEtapa[`${subj}__${et.n}`]);
              const lancadas = porEtapa.filter((n): n is number => n !== undefined);
              const maxSomado = etapas.filter((_, i) => porEtapa[i] !== undefined).reduce((s, et) => s + et.max, 0);
              const somaTotal = lancadas.reduce((s, n) => s + n, 0);
              const media = lancadas.length ? somaTotal / lancadas.length : null;
              const pct = maxSomado > 0 ? (somaTotal / maxSomado) * 100 : 0;
              const tone = lancadas.length ? toneFor(pct).soft : "text-neutral-300";
              return (
                <tr key={subj} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 text-neutral-700">{subj}</td>
                  {etapas.map((et, i) => (
                    <td key={et.n} className="px-4 py-2 font-mono text-neutral-500">
                      {porEtapa[i] !== undefined ? (
                        <>
                          {porEtapa[i]!.toFixed(1)}
                          <span className="text-neutral-300"> / {et.max}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2">
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-xs font-semibold ${tone}`}>
                      {media !== null ? media.toFixed(1) : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
