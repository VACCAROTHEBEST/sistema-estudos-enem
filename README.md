# Sistema de Estudos — ENEM 2026

Painel pessoal de estudos: contagem regressiva do ENEM, matérias pendentes por tópico, notas escolares e próximas provas.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com) (Postgres) como banco de dados

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

As credenciais do Supabase já estão em `.env.local` (não versionado). Para outro ambiente, copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Banco de dados

Projeto Supabase: `sistema-estudos-enem` (região `sa-east-1`).

Tabelas: `subjects`, `topics`, `grades`, `exams`, `config` (guarda as datas do ENEM em `config.enem_dates`).

## Deploy

Pensado para deploy na [Vercel](https://vercel.com): importe o repositório e configure as duas variáveis de ambiente acima nas configurações do projeto.
