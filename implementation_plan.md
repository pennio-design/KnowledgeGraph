# Implementation Status

Single source of truth for what is built. (Replaces the earlier overlapping phase lists.)

## Shipped
- [x] Three-question intake, AI roadmap generation with validation (`lib/graph.ts`)
- [x] Prerequisite-derived edges, cycle-safe layered layout, unlock/complete logic (unit tested)
- [x] Resource panel with search-engineered links, progress tracking, localStorage persistence
- [x] Dashboard: stats, real streaks, achievements
- [x] Tutor mode (lesson + quiz) with error/retry
- [x] Career: resume bullets (honesty-constrained prompt)
- [x] Certificate (PDF, persisted record ID, self-reported wording)
- [x] Daily Wolf brief (per-day cache, targets highest-leverage node when a unified map exists)
- [x] God Mode unified graph (source-node refs, high-leverage filter)
- [x] BYOK Gemini key; no secrets in the bundle
- [x] CI: `npm ci`, typecheck, tests, build, Pages deploy

## Next (ordered by leverage)
1. **Backend proxy + auth** (Cloudflare Worker): unlocks a paid tier, shared key without leaking it, cross-device sync.
2. **Oral Exam / Boss Fight**: the only thing that makes the certificate worth more than self-report.
3. **Export / import progress as JSON**: localStorage is the only copy today.
4. **Learning-velocity chart** from `stats.history`.
5. **Squad Races** (needs 1).
