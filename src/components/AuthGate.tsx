"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Verifica a sessão ao montar; o estado real chega depois do await interno.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session && pathname !== "/login") {
      router.replace("/login");
    } else if (session && pathname === "/login") {
      router.replace("/");
    }
  }, [loading, session, pathname, router]);

  // Página de login: sem sidebar, tela cheia — mostra o formulário na hora,
  // sem esperar a checagem de sessão (só redireciona se já estiver logado).
  if (pathname === "/login") {
    return !loading && session ? null : <>{children}</>;
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-400">Carregando…</div>;
  }

  if (!session) {
    // Redirecionando para /login (efeito acima já disparou).
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={session.user.email ?? null} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
            className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-50"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-[var(--font-display)] text-base font-semibold text-neutral-900">ENEM 2026</span>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:px-8 md:py-9">{children}</main>
      </div>
    </div>
  );
}
