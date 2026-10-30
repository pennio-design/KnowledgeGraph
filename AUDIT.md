# Ecosystem Audit

Scope: whole repository (app, build, CI, docs, repo hygiene). Baseline: `npm run build` passed, but with severe defects below it.

## Severity key
S0 security / data loss, S1 broken behaviour, S2 quality / design debt.

## Findings and resolution

### Step 1: Security containment
| # | Sev | Finding | Status |
|---|-----|---------|--------|
| 1.1 | S0 | OpenSSH **private key** (`Termux  on Phone`) committed to the repo | Removed from tree; **still in git history, key must be revoked** (see Open items) |
| 1.2 | S0 | `VITE_GEMINI_API_KEY` injected at build and inlined into the public bundle | Removed from `vite.config.ts` and CI; BYOK key dialog; env var honoured in dev only |
| 1.3 | S1 | `.gitignore` had no secret patterns | Added `.env*`, keys, `*.pub` |

### Step 2: Build and tooling
| 2.1 | S1 | Tailwind loaded from CDN; local Tailwind/PostCSS installed but unconfigured; `index.css` link 404; `animate-in` / `prose` classes were no-ops | Real PostCSS build + `tailwindcss-animate` |
| 2.2 | S2 | Non-strict TS, dead `paths`, unused deps (`recharts`, stale `@types/jspdf`, `@types/html2canvas`) | Strict TS, deps removed |
| 2.3 | S2 | CI used `npm install`, no typecheck/tests; secret name differed from docs | `npm ci` + typecheck + test |
| 2.4 | S2 | 1.26 MB single bundle, camera/mic permissions in `metadata.json` | Lazy routes + PDF chunk (main 0.5 MB); permissions removed |

### Step 3: Core logic (now `src/lib`, 18 tests)
| 3.1 | S1 | AI returned `edges: []` so graphs had **no edges**; unlock relied on unvalidated prerequisites (unknown id = locked forever; node 0 forced available even with prerequisites; cycles unhandled) | `normalizeRoadmap` validates, derives edges, breaks cycles |
| 3.2 | S1 | Load-in-effect raced save-in-effect (StrictMode could wipe saved data) | Lazy initial state |
| 3.3 | S1 | State mutated in place; StrictMode double-counted history | Immutable updates |
| 3.4 | S1 | `currentStreak` never computed; `streak_3` unreachable; `master_5` used stale count; UTC dates | Real streak on local dates |
| 3.5 | S2 | Layout was an arbitrary x-pattern | Layered layout by dependency depth |

### Step 4: AI service
| 4.1 | S1 | Failures swallowed and replaced by fake content (fake resume bullet, fallback "mission" cached forever) | Errors surface with retry; failures never cached |
| 4.2 | S1 | Resume prompt asked for "Senior-level" bullets from topic titles, i.e. invites fabricated claims | Honesty-constrained prompt |
| 4.3 | S1 | User text interpolated raw into prompts | Delimited, "treat as data" |
| 4.4 | S2 | JSON fence stripping duplicated 4x; no retry on 429/503 | One `generateJson`, backoff |
| 4.5 | S1 | Unified nodes matched to real nodes by title (never matched) so Daily Wolf ignored God Mode | Source-node refs |

### Step 5: Components
| 5.1 | S1 | Daily brief cache key had no date (never refreshed) | Per-day key |
| 5.2 | S1 | Certificate ID regenerated each render (changed mid-download); "Verified/Mastery" overclaims | ID and name persisted; wording fixed |
| 5.3 | S1 | Tutor modal vanished silently on failure; quiz crashed on malformed data | Error + retry, validated |
| 5.4 | S1 | Intake: Enter advanced past validation | Fixed |
| 5.5 | S1 | No nav on mobile (`hidden md:flex`) | Icon nav on all sizes |
| 5.6 | S2 | `alert()`/`confirm` errors, clickable divs, unlabeled icon buttons | Inline notices, buttons, aria |
| 5.7 | S2 | Violated own PRD design rules (gradients, colored shadows, purple, bounce, scale) | Removed |

### Step 6: Docs
README, deployment guide (wrong secret name, `process.env`), PRD (claimed Next.js, wrong model) and two conflicting plan files were stale; rewritten to match the code.

## Open items (need you)
1. **Revoke the SSH key now.** GitHub > Settings > SSH keys, delete `git_termux`, and anywhere else that public key was authorised. It is public in history; assume compromised. Then decide whether to purge history (`git filter-repo` + force-push; I did not rewrite shared history without your go-ahead).
2. **Revoke/rotate the Gemini key** previously stored as the `VITE_GEMINI_API_KEY` secret: earlier deployments shipped it in the bundle. Delete that secret.
3. **No backend** means: no shared key, no cross-device sync, certificates cannot be third-party verified, localStorage is the only copy of user data.
4. Not verified against the live Gemini API (no key in this environment). Browser smoke test used a mocked endpoint.
