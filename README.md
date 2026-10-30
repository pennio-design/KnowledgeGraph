# KnowledgeGraph

Answer three questions, get a dependency-ordered learning roadmap with curated free resources, track progress, and turn finished roadmaps into a certificate and honest resume bullets.

Everything runs in the browser. There is no backend: data lives in `localStorage` and AI calls go straight to Gemini with the **user's own API key**.

## Run locally

```bash
npm install
npm run dev
```

Open the app, click the key icon, and paste a free key from [Google AI Studio](https://aistudio.google.com/apikey).
For local development only you can instead put `VITE_GEMINI_API_KEY=...` in `.env.local` (see `.env.example`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run typecheck` | Strict TypeScript check |
| `npm test` | Unit tests (graph, stats logic) |
| `npm run build` | Typecheck + production build |

## Layout

```
src/lib/graph.ts       validate AI output, derive edges, layout, unlock/complete logic
src/lib/stats.ts       streaks, achievements
src/lib/storage.ts     versioned persistence, API key, daily brief cache
src/services/          Gemini client (retries, validation, prompts)
src/components/        UI
docs: PRD.md, implementation_plan.md, DEPLOYMENT_GUIDE.md, AUDIT.md
```
