// Gia-WA server entrypoint.
//
// Three routes per BUILD-PLAN §6.2:
//   GET  /webhook       — Meta verify-token echo
//   POST /webhook       — inbound messages + Flow nfm_reply (signature-verified)
//   POST /flows/data    — encrypted Flow Data Channel (signature-verified)
//
// Phase 1 ships GET /webhook fully and POST routes as signature-verifying
// stubs returning 200. Handlers in src/handlers/ + src/flows/handler.js land
// in later phases.

import express from 'express';
import { verifyHubSignature } from './src/flows/sign.js';

export function buildApp({ appSecret = process.env.WA_APP_SECRET, verifyToken = process.env.WA_VERIFY_TOKEN } = {}) {
  const app = express();

  // Capture the raw body for signature verification on the webhook routes.
  // express.json() defaults would consume the stream before we can HMAC it.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gia-wa', version: '0.1.0' });
  });

  // Meta webhook verification handshake.
  app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (!verifyToken) {
      return res.status(500).send('WA_VERIFY_TOKEN not configured');
    }
    if (mode === 'subscribe' && token === verifyToken && typeof challenge === 'string') {
      return res.status(200).type('text/plain').send(challenge);
    }
    return res.status(403).send('Forbidden');
  });

  // Inbound messages + nfm_reply. Signature-verified; handler dispatch in Phase 3+.
  app.post('/webhook', (req, res) => {
    const sigHeader = req.get('x-hub-signature-256');
    if (!verifyHubSignature(req.rawBody, sigHeader, appSecret)) {
      return res.status(401).send('Invalid signature');
    }
    // Always 200 quickly per Meta's guidance; processing is enqueued.
    // Handler dispatch is added in Phase 3 (onMessage, onLocation, onFlowReply).
    return res.status(200).send('OK');
  });

  // Encrypted Flow Data Channel. Signature-verified; crypto + handler land Phase 4.
  app.post('/flows/data', (req, res) => {
    const sigHeader = req.get('x-hub-signature-256');
    if (!verifyHubSignature(req.rawBody, sigHeader, appSecret)) {
      return res.status(401).send('Invalid signature');
    }
    // Phase 4 will decrypt the body, route INIT/data_exchange/BACK/ping,
    // and return base64 ciphertext as the raw body. For now, refuse so we
    // never accidentally publish a Flow that talks to an unfinished endpoint.
    return res.status(503).send('Flows Data Channel not implemented (Phase 4)');
  });

  return app;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const port = Number(process.env.PORT) || 3000;
  const app = buildApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`gia-wa listening on :${port}`);
  });
}
