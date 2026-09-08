import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Sistema de Estudos — ENEM 2026",
  description: "Matérias pendentes, notas escolares e contagem regressiva para o ENEM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen bg-white font-sans text-neutral-900 antialiased">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-8 py-9">{children}</div>
        </main>
      </body>
    </html>
  );
}
