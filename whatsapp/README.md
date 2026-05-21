# whatsapp/

WhatsApp Cloud API layer.

## Files to build

- `client.js` — Meta Graph API HTTP client (send message, upload media)
- `webhook.js` — Express webhook: signature verify (`X-Hub-Signature-256`), message routing
- `send.js` — helpers: `sendText()`, `sendInteractive()` (reply buttons / list messages / CTA-URL), `sendTemplate()`, `sendLocation()`
- `flows-endpoint.js` — encrypted Flow data-exchange endpoint (RSA-OAEP + AES-GCM-128)

## Platform constraints

| Feature | Limit |
|---|---|
| Reply buttons | ≤ 3 buttons |
| List message rows | ≤ 10 rows |
| CTA-URL button | 1 per message |
| No embedded maps | Use location pins + `Open in Google Maps ↗` CTA-URL |
| Markup | `*bold*`, `_italic_`, `~strike~` — no HTML |

See `BUILD-PLAN.md` §D-3 for the full interactive-message decision tree.
