# llm/

Llama client layer — replaces `llm-client.js` + `gemini-client.js` from Soleat.

**Constraint:** Gia-WA is Meta Llama only. No Anthropic SDK. No Gemini.

## Files to build

- `llm-client.js` — unified Llama client with retry/fallback shape from Soleat's `gemini-retry.js`
- `groq-client.js` — Groq primary (fastest inference)
- `together-client.js` — Together.ai fallback

## Provider stack

| Provider | Role | Model |
|---|---|---|
| Groq | Primary | `meta-llama/llama-4-...` (latest) |
| Together.ai | Fallback | `meta-llama/Llama-4-...` |

## Modules that call the LLM (from §3b of 1st_Setup.MD)

These were in §3a (copy as-is) but may transitively import the old LLM layer:
- `nl-intent.js`
- `consultant.js`
- `prompt-builder.js`

Verify imports before treating them as "copy, runs untouched".

See `BUILD-PLAN.md` §D-1 for the full AI/LLM decision.
