"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ETAPAS } from "@/lib/types";

const NAV = [
  {
    href: "/",
    label: "Painel",
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    ),
  },
  {
    href: "/materias",
    label: "Matérias",
    icon: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2V5Z" />
        <path d="M17 19H6a2 2 0 0 0-2 2" />
      </>
    ),
  },
  {
    href: "/notas",
    label: "Notas",
    icon: (
      <>
        <path d="M4 19V5m5 14v-8m5 8V9m5 10V3" />
      </>
    ),
  },
  {
    href: "/provas",
    label: "Provas",
    icon: (
      <>
        <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
        <path d="M3.5 9.5h17M8 3v3M16 3v3" />
      </>
    ),
  },
];

export default function Sidebar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white sticky top-0">
      <div className="px-5 pt-6 pb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-neutral-400">
          Painel de estudos
        </p>
        <h1 className="mt-1 font-[var(--font-display)] text-xl font-semibold text-neutral-900">
          ENEM 2026
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const isNotas = item.href === "/notas";
          const active = pathname === item.href || (isNotas && pathname.startsWith("/notas"));
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  {item.icon}
                </svg>
                {item.label}
              </Link>
              {isNotas && pathname.startsWith("/notas") && (
                <div className="ml-[27px] mt-1 space-y-0.5 border-l border-neutral-100 pl-3">
                  {ETAPAS.map((et) => {
                    const href = `/notas/${et.n}`;
                    const subActive = pathname === href;
                    return (
                      <Link
                        key={et.n}
                        href={href}
                        className={`block rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          subActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
                        }`}
                      >
                        {et.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 px-5 py-4">
        {userEmail && (
          <p className="mb-2 truncate text-xs text-neutral-500" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="text-xs font-medium text-neutral-400 underline decoration-dotted underline-offset-2 hover:text-red-600"
        >
          Sair
        </button>
      </div>

      <div className="border-t border-neutral-100 px-5 py-5 text-xs leading-relaxed text-neutral-400">
        Colégio Chromos · F3D 2026
        <br />
        3ª série · Unidade Venda Nova
      </div>
    </aside>
  );
}
