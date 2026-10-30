# Deployment Guide

KnowledgeGraph is a static site. The included workflow deploys it to GitHub Pages.

## GitHub Pages

1. Push to `main`.
2. **Settings > Pages > Source**: GitHub Actions.
3. The `Deploy to GitHub Pages` workflow runs `npm ci`, typecheck, tests, build, then deploys `dist/`.

No secrets are needed. **Do not add a Gemini key to the build.** Anything prefixed `VITE_` is inlined into the public JavaScript, so a key set in CI would be readable by every visitor. Users enter their own key in the app; it is stored in their browser only.

`base` in `vite.config.ts` must equal the repository name (`/KnowledgeGraph/`). Change it for a different repo or a custom domain.

## Vercel / Netlify

Build command `npm run build`, output directory `dist`, and set `base` to `/` in `vite.config.ts`. No environment variables.

## If you later want a shared key (paid tier)

Put the key behind a small proxy (Cloudflare Worker, Vercel function) that adds auth and rate limits, and point `geminiService.ts` at it. Never ship a shared key to the browser.

## Troubleshooting

- **Blank page after deploy:** `base` does not match the repo name.
- **"Gemini rejected the API key":** re-enter it in the key dialog; check it is enabled for the Gemini API.
- **"Gemini is busy":** transient 429/503; the app already retried twice.
