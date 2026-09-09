import type { Metadata } from "next";
import "./globals.css";
import AuthGate from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Sistema de Estudos — ENEM 2026",
  description: "Matérias pendentes, notas escolares e contagem regressiva para o ENEM.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
