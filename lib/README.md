# lib/

Platform-agnostic engine modules copied from `gia/` root — the §3a COPY list.

These modules import `data/` + `vault/` and Redis; they have no knowledge of the messaging platform above them.

## Module groups

### Search / discovery
`cuisine-search.js`, `free-text-search.js`, `freetext-classify.js`, `pipeline.js`, `pipeline-task.js`, `hidden-gems.js`, `hidden-verify.js`, `surprise.js`, `tell-gia.js`, `search-conversation.js`, `recognised-seeder.js`, `recognised-store.js`, `gatekeeper.js`, `consultant.js`

### Cuisine knowledge
`cuisines-vault.js`, `cuisine-family.js`, `cuisine-dish-keywords.js`, `cuisine-session.js`, `dish-name.js`, `dish-types.js`, `dessert-drink-keywords.js`, `cooking-methods.js`, `michelin-2025.js`, `michelin-walk.js`, `misrepresented-dishes.js`, `nation-overlay.js`, `heritage-significance.js`, `rarity-score.js`

### Scoring / signals
`venue-filters.js`, `crowd-signal.js`, `footfall-signal.js`, `vibe.js`, `vibe-suggest.js`, `vibe-summary.js`, `buddy-match.js`

### Civic data
`transport.js`, `carpark.js`, `weather.js`, `weather-emoji.js`, `holidays.js`, `mrt-lines.js`, `mrt-engineering.js`, `hawker.js`, `hawker-vault.js`, `sg-address.js`, `travel-times.js`, `healthier-eateries.js`, `buildings.js`

### Utilities / storage
`format.js`, `currency-format.js`, `maps-url.js`, `open-hours.js`, `logger.js`, `sentry.js`, `rate-limit.js`, `response-cache.js`, `request-store.js`, `pick-cache.js`, `recent-picks.js`, `clip-store.js`, `usage-log.js`, `freetext-log.js`, `verbose-log.js`, `vault.js`, `vault-index.js`, `sync-vault.js`, `location-cache.js`, `user-data.js`, `user-prefs.js`, `prompt-builder.js`, `nl-intent.js`

## ADAPT before use (from §3b)

- `i18n.js` — re-audit strings for WhatsApp markup (no `<a>`, no `<b>`, no tables)
- `venue-templates.js` — rebuild formatter for WhatsApp markup (`*bold*`, line breaks)
- `voice-input.js` — Telegram voice-note → WhatsApp audio-message handling

## Copy status

> **TODO:** Copy modules from `gia/` root once the data/ + vault/ placeholders are populated.
> Verify that `nl-intent.js`, `consultant.js`, `prompt-builder.js` do not transitively import
> `gemini-client.js` before treating them as copy-ready. See `llm/README.md`.
