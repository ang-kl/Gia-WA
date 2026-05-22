# ADR-004 — Gemini-first: Google Gemini is the engine for the entire AI layer

- **Status:** Accepted
- **Date:** 2026-05-22
- **Serial:** (№ 9 - 22-05 '26 17:34 SGT)
- **Supersedes:** ADR-002

## Context

Operator directive **D-1** (`BUILD-PLAN.md §2`) originally set the AI posture as
"Meta Llama only": the main layer (`classify` / `converse` / `stage-a` /
`sanctuary`) on Meta Llama via Groq (primary) / Together AI (fallback), with no
Anthropic SDK and no Gemini.

**ADR-002** (2026-05-22) partially revised D-1 — it admitted Google Gemini, but
**solely** for the Hidden-Gems / R.E.D path, with the main layer staying
Llama-only.

In chat on 2026-05-22 the operator went further and chose **"Gemini-first"**:
Google Gemini should run the **entire** AI layer, not just R.E.D. The rationale
the operator weighed:

- **One vendor, one key.** The Llama-first plan needed three provider keys
  (`GROQ_API_KEY`, `TOGETHER_API_KEY`, plus `GEMINI_API_KEY` for R.E.D under
  ADR-002). Gemini-first collapses that to a single `GEMINI_API_KEY` — a plain
  Google AI Studio key the operator already holds.
- **Consistency with Soleat.** `ang-kl/gia` already runs Gemini "plain
  vanilla" (`gemini-client.js`); Gia-WA reuses the same posture.
- **Simplicity over cross-vendor failover.** The Llama-first plan's main
  resilience story was Groq→Together failover; the operator accepted dropping
  cross-vendor failover in exchange for a far simpler key/vendor surface.

## Decision

D-1 is **revised again** (second revision; ADR-002 was the first):

1. **The entire AI layer runs on Google Gemini** — `classify`, `converse`,
   `stage-a`, `sanctuary`, and `hidden-gems` / R.E.D. Access is via a plain
   Google AI Studio API key (`GEMINI_API_KEY`) — **not** Vertex AI, **not** a
   GCP service-account.
2. **Llama, Groq and Together AI are dropped entirely.** `GROQ_API_KEY` and
   `TOGETHER_API_KEY` leave the env contract (`§9.1`). `src/ai/llama.js` is
   never built; `src/ai/gemini.js` is the single AI client.
3. **ADR-002 is superseded.** Gemini is no longer scoped to the R.E.D path —
   it is the whole layer. R.E.D (`§12` Phase 5) remains a feature phase but is
   no longer a "special vendor" path.
4. **The Anthropic bar from D-1 still holds** — no `@anthropic-ai/sdk`, no
   Claude API calls anywhere in Gia-WA.
5. **Initial model assignment** (`src/ai/router.js`, the single source of
   truth — confirm exact model IDs against the Google AI Studio catalogue at
   Phase 2 build time):

   | Task | Model |
   |---|---|
   | `classify` | Gemini 2.5 Flash |
   | `converse` | Gemini 2.5 Flash |
   | `stage-a` | Gemini 2.5 Pro |
   | `sanctuary` | Gemini 2.5 Flash |
   | `hidden-gems` (R.E.D) | Gemini 2.5 Pro |

6. **Resilience = a within-Gemini model chain.** With no second vendor there is
   no cross-vendor failover. On 429 / 5xx / timeout, `src/ai/gemini.js` retries
   on the next model in a fallback chain (e.g. `2.5-flash` → `2.5-flash-lite`)
   with jittered backoff — mirroring the `MODEL_CHAIN` pattern in Soleat's
   `gemini-client.js`.
7. **No new npm dependency.** Gemini is called over the existing `axios` dep
   via the Google AI Studio REST API. `@google/generative-ai` is not required;
   the `§6.4` ban on it is lifted (it is simply unused, not barred).

## Consequences

- **`BUILD-PLAN.md` propagation** (this PR): D-1 row marked
  `[REVISED 2026-05-22 (#2)]`; `§7` retitled "AI layer — Google Gemini" and
  rewritten; `§6.1` tree (`llama.js` → `gemini.js`); `§6.2` / `§6.3` / `§6.4`
  relabelled; `§9.1` drops Groq/Together; `§12` Phase 2 retitled "Gemini
  wrapper + router"; `§13` / `§14` / `§15` cross-references updated.
- **`CLAUDE.md`** D-1 bullet rewritten to the Gemini-first wording.
- **ADR-002** keeps its place in the tree with status "superseded by ADR-004"
  so the decision history (Llama-only → Gemini-for-R.E.D → Gemini-first) stays
  legible.
- **`1st_Setup.MD §3b`** ("no Anthropic, no Gemini") — the Gemini clause is now
  fully superseded; the Anthropic clause still holds.
- **Phase 2** changes from a Llama wrapper to a Gemini wrapper. It needs
  `GEMINI_API_KEY` provisioned for a live smoke test; unit tests need no key.
- **Phase 5 (R.E.D)** keeps its slot but is lighter — `src/ai/gemini.js`
  already exists from Phase 2, so Phase 5 is just the R.E.D prompt + the
  vault-miss wiring.
- **Cost / caching.** Gemini bills per token; `telemetry.js` tracks Gemini
  usage. Gemini also offers context caching — a large static prefix (e.g. the
  cuisine catalogue) can be cached for a reduced hit rate. This partially
  restores the prompt-caching capability the Llama-only plan (`§7.6`) had
  written off as a loss.
- **Lost:** cross-vendor failover. If Gemini has a provider-wide outage the
  model-chain fallback does not help. Accepted by the operator as the cost of
  a one-vendor surface.

## Revisit when

The operator decides either (a) to reintroduce a second LLM vendor for
cross-vendor failover (a new ADR), (b) to change the `§7.2` model assignments,
or (c) that Gemini pricing / rate limits force a vendor rethink.
