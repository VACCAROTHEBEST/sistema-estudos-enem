"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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
      <Sidebar userEmail={session.user.email ?? null} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-5xl px-8 py-9">{children}</div>
      </main>
    </div>
  );
}
