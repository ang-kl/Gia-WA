# ADR-002 — Gemini permitted as a sibling vendor for the Hidden-Gems / R.E.D path

- **Status:** Accepted
- **Date:** 2026-05-22
- **Serial:** (№ 3 - 22-05 '26 06:25 SGT)

## Context

Operator directive **D-1** (`BUILD-PLAN.md §2`) sets the AI posture as "Meta
Llama only" and explicitly bars Gemini: *"No `@anthropic-ai/sdk` dependency.
No Claude API calls. No Gemini."*

Two facts from the source-project audit are relevant:

- `BUILD-PLAN.md §3.2` records that Soleat (`ang-kl/gia`) uses Gemini as a
  **sibling vendor**, independent of its main Claude path: `gemini-client.js`
  drives the **R.E.D** ("Random Excellent Discovery") Hidden-Gems template
  (`HIDDEN_GEMS_PROMPT_TEMPLATE`, ~150 KB).
- `BUILD-PLAN.md §3.4` left an explicit open door: *"The Gemini Hidden-Gems
  R.E.D template path — under D-1, Gia-WA uses Llama everywhere; if the
  operator later wants Gemini parity in Gia-WA, raise it."*

Operator, in chat on 2026-05-22, raised it: Gia-WA should use a **plain Google
AI Studio (Gemini) API key** — "plain vanilla, like the Telegram project" —
for the R.E.D path, while keeping the main AI layer Llama-only.

## Decision

D-1 is **partially revised**:

1. The main conversational / agentic AI layer — `classify`, `converse`,
   `stage-a`, `sanctuary` — **remains Llama-only**, via Groq (primary) /
   Together AI (fallback). Unchanged from `BUILD-PLAN §7`.
2. **Gemini is permitted solely** as the engine for the Hidden-Gems / R.E.D
   template path, mirroring `ang-kl/gia/gemini-client.js`. Access is via a
   plain Google AI Studio API key (`GEMINI_API_KEY`) — **not** Vertex AI and
   **not** GCP service-account auth.
3. The Anthropic bar in D-1 is **untouched**: no `@anthropic-ai/sdk`, no Claude
   API calls anywhere in Gia-WA.

The D-1 row in `BUILD-PLAN.md §2` is marked `[REVISED 2026-05-22]` pointing to
this ADR; the row is not deleted (per the §2 revision rule).

## Consequences

- A new env var `GEMINI_API_KEY` joins the `BUILD-PLAN §9.1` list;
  `.env.example` is updated when the R.E.D path is actually built.
- The R.E.D / Hidden-Gems path is **not** in the current `§12` phase plan
  (Phases 0–7). It needs a phase slot — to be agreed with the operator (e.g. a
  new phase after Phase 4, or folded into a later phase). Until then this ADR
  only authorises the vendor; it does not schedule the build.
- A new module `src/ai/gemini.js` (sibling to `src/ai/llama.js`) plus a Gemini
  prompt under `src/ai/prompts/` will be needed when the path is built.
- `src/ai/telemetry.js` must track Gemini input/output tokens and cost
  alongside Llama.
- `1st_Setup.MD §3b` ("no Anthropic, no Gemini") is **superseded** by this ADR
  for the Gemini clause only; the Anthropic clause still holds.

## Revisit when

The operator decides either (a) to schedule the R.E.D phase into `§12`, or
(b) that Gemini should be removed if Llama later gains an adequate hidden-gems
capability, or (c) to expand Gemini use beyond the R.E.D path (which would be
a further D-1 revision and a new ADR).
