# flows/

WhatsApp Flow JSON definitions + the encrypted data-exchange endpoint.

Flows replace the 5 Telegram Mini Apps (TMAs) that WhatsApp cannot run.

| Flow file | Replaces TMA | Notes |
|---|---|---|
| `cuisine-flow.json` | `web/cuisine` — filter UI → results | Filter screens → result screen |
| `hawker-flow.json` | `web/hawker` — nearby centres → save | Or a List message — TBD |

The `web/menu` TMA (6-tile hub) → a single List message (no Flow needed).
The `web/transport` TMA (live MRT/bus) → text + buttons + Google Maps deep links (live arrivals don't fit Flow's static-screen model).
The `web/oversight` TMA (admin) → not ported, or a plain web page outside WhatsApp.

See `1st_Setup.MD` §1 for the full TMA → "its own way" mapping.
