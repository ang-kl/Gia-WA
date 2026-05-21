# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Gia-WA is the WhatsApp-native port of Soleat ("Gia4lunch"), a conversational
lunch-venue recommender for Raffles Place. The Telegram original lives in a
separate repo, `ang-kl/gia`, and **must never be edited from Gia-WA work** —
this repo only reads Soleat's data via a read-only bridge (BUILD-PLAN §8.1).

The project is built in numbered phases. As of this writing it is at Phase 1
(skeleton + transport + format): the inbound webhook routes are
signature-verifying stubs, `sendText` works, and there is no AI integration yet.

## Authoritative documents — read before non-trivial work

- **`BUILD-PLAN.md`** — the single source of truth for architecture, phase
  order, module responsibilities, and operator directives. Sections 1–4 are
  context, 5–12 are the build, 13–16 are operational.
- **`1st_Setup.MD`** — the copy manifest: which `ang-kl/gia` folders to copy,
  adapt, rebuild, or skip.
- **`CLAUDE-FULL.md`** — the documentation/version-control contract (serial
  numbers, journal HDR blocks, file naming). It is a project-agnostic template,
  not Gia-WA-specific instructions.

If chat instructions conflict with `BUILD-PLAN.md`, the operator wins — but log
the deviation as a numbered ADR in `doc/decisions/` (see ADR-001 for the
format).

## Commands

```bash
npm install            # deps: axios, express, ioredis (+ vitest dev)
npm test               # vitest run — full suite
npm run test:watch     # vitest watch mode
npm run syntax         # node --check on every .js (not under node_modules)
npm start              # boot Express on $PORT (default 3000)
```

Run a single test file or test:

```bash
npx vitest run __tests__/transport/format.test.js
npx vitest run -t 'escapeMarkup'        # by test-name pattern
```

Before every commit/PR run the `gia-preflight` checklist (BUILD-PLAN §10.4):
`npm run syntax` clean, `npm test` 100% green, no user text logged unescaped,
no handler that returns without sending a message, no empty `catch {}`.

## Architecture

Long-running Express server (`server.js#buildApp`) — **not** serverless; the
Flow Data Channel needs warm RSA key state. Three routes plus a health probe:

- `GET /webhook` — Meta verify-token echo (`WA_VERIFY_TOKEN`).
- `POST /webhook` — inbound messages + Flow `nfm_reply`; verifies
  `x-hub-signature-256` before any processing.
- `POST /flows/data` — encrypted Flow Data Channel; verifies signature, then
  (Phase 4+) decrypts and routes `INIT`/`data_exchange`/`BACK`/`ping`.

`express.json()` is configured with a `verify` callback that stashes the raw
body on `req.rawBody`. **Signature verification must use the raw bytes** — any
JSON re-stringification breaks the HMAC. Don't remove that callback.

Actual source lives under `src/` (per BUILD-PLAN §6.1):
`src/transport/` (Cloud API client + markup formatter), `src/flows/`
(signature verify, and later crypto + handler), and — in later phases —
`src/handlers/`, `src/ai/`, `src/data/`, `src/user/`.

Note the **layout tension**: the top-level scaffold dirs (`whatsapp/`, `llm/`,
`lib/`, `flows/`, `data/`, `geoloc/`, etc.) were created from `1st_Setup.MD` §4
and currently hold only `README.md`/`.gitkeep` placeholders. `BUILD-PLAN.md`
§6.1 is the layout that the working code follows — everything goes under
`src/`. Treat the top-level dirs as staging areas for copied Soleat modules,
not as where new Gia-WA code lives, unless the operator says otherwise.

## Non-negotiable constraints (BUILD-PLAN §2)

- **D-1 — Llama only.** No `@anthropic-ai/sdk`, no Claude API calls, no Gemini.
  AI is Meta Llama via Groq (primary) / Together AI (fallback).
- **D-2 — Zero edits to `ang-kl/gia`.** Read its data only via the §8.1 bridge.
- **D-4 — Per-PR Journal.** After opening any PR and after a PR merges, append
  an `[HDR]` block to `doc/Journal/journal-<v>-<dd_mm_yy-hhmm>.md`.
- One branch + one draft PR per phase: `claude/phase-<N>-<slug>` (BUILD-PLAN
  §12). ADR-001 records the current single-branch deviation.

## WhatsApp-specific gotchas

- **Markup escaping.** WhatsApp renders `*bold*`, `_italic_`, `~strike~`,
  `` `mono` `` — no HTML. Any of those chars inside venue/user strings corrupts
  rendering. Route data-derived strings through `src/transport/format.js`
  (`escapeMarkup` wraps each markup char in a zero-width-space sandwich). This
  is the WhatsApp analog of Soleat's HTML-escape risk.
- **Text length.** Cloud API body limit ~4096 chars; UI splits past ~1024. Use
  `format.chunkForWhatsApp` to split long bodies.
- **Flow crypto (Phase 4).** Responses are AES-GCM encrypted with the request
  IV **bit-flipped** (XOR every byte with `0xFF`), and the bare base64
  ciphertext is the raw HTTP body — never wrapped in JSON. Both are classic
  day-1 bugs.
- **Identity.** Users are keyed by E.164 phone number. All Redis keys are
  `wa:`-prefixed and use a separate DB number from any Telegram workload —
  never share a key with Soleat.

## Conventions

- ES modules (`"type": "module"`), Node ≥ 20.
- Outbound Cloud API calls retry with jittered backoff on 429/5xx
  (`src/transport/whatsapp.js#postWithRetry`).
- Unimplemented methods `throw new Error('... not implemented (Phase N)')`
  rather than silently no-op, so an unfinished surface fails loud.
- The `doc/` system tracks serial numbers in `doc/.serial-state.yml` — read it
  before generating a new serial, increment, write back. Deviations from
  `BUILD-PLAN.md` become numbered ADRs under `doc/decisions/`.
