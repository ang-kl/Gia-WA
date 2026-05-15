# Gia-WA

WhatsApp-native equivalent of Soleat ("Gia4lunch"), a conversational lunch-venue
recommender for Raffles Place. Same problem domain and data as the Telegram
product in [`ang-kl/gia`](https://github.com/ang-kl/gia); different transport
(WhatsApp Business Cloud API) and different AI vendor (Meta Llama via
Groq / Together AI — no Anthropic SDK).

The canonical build plan lives in [`BUILD-PLAN.md`](./BUILD-PLAN.md). Project
conventions (folder structure, serial-number protocol, version control rules)
live in [`CLAUDE-FULL.md`](./CLAUDE-FULL.md). Read both before contributing.

## Status

Phase 1 (skeleton + transport + format). Inbound webhook routes are stubbed;
`sendText` works; WhatsApp markup escaping is unit-tested. No AI integration
yet (Phase 2).

## Quick start (local)

```bash
npm install
cp .env.example .env   # fill in WA_* and provider keys
npm test               # vitest
npm run syntax         # node --check on every .js
npm start              # boots Express on $PORT (default 3000)
```

You'll need:
- A WhatsApp Business Cloud API test number (Meta Business Manager).
- A public HTTPS tunnel pointing at `POST /webhook` for inbound messages.
- The `WA_VERIFY_TOKEN` you choose must match what you enter in Meta's
  webhook config; `GET /webhook` performs the verify-token echo.

## Routes (server.js)

| Method | Path           | Purpose                                                     |
|--------|----------------|-------------------------------------------------------------|
| GET    | `/webhook`     | Meta webhook verify-token echo                              |
| POST   | `/webhook`     | Inbound messages + Flow `nfm_reply` submissions             |
| POST   | `/flows/data`  | Encrypted Flow Data Channel (`INIT` / `data_exchange` / `BACK` / `ping`) |
| GET    | `/health`      | Liveness probe                                              |

## Directory layout

See `BUILD-PLAN.md` §6.1 for the full tree. Source under `src/`, tests under
`__tests__/`, build/operational docs under `doc/`.

## Contributing

1. Branch from `main`: `claude/phase-<N>-<slug>` per BUILD-PLAN §12.
2. Run the [`gia-preflight`](./BUILD-PLAN.md#104-pre-commit--pre-pr-checklist-gia-preflight-ported)
   checklist before every PR.
3. Open as a draft. After opening any PR, and after a PR merges, append a
   `[HDR]` block to `doc/Journal/journal-<vN>-<dd_mm_yy-hhmm>.md` (D-4).

## License

MIT. See [`LICENSE`](./LICENSE).
