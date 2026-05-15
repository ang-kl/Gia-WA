import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import http from 'node:http';
import { buildApp } from '../server.js';

const APP_SECRET = 'unit-test-secret';
const VERIFY_TOKEN = 'unit-test-verify';

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function fetchJson(port, path, init = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, init);
  const text = await res.text();
  return { status: res.status, text };
}

describe('server routes', () => {
  it('GET /health returns ok', async () => {
    const app = buildApp({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN });
    const { server, port } = await listen(app);
    try {
      const { status, text } = await fetchJson(port, '/health');
      expect(status).toBe(200);
      expect(JSON.parse(text).status).toBe('ok');
    } finally {
      server.close();
    }
  });

  it('GET /webhook echoes hub.challenge on correct verify_token', async () => {
    const app = buildApp({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN });
    const { server, port } = await listen(app);
    try {
      const url = `/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=abc123`;
      const { status, text } = await fetchJson(port, url);
      expect(status).toBe(200);
      expect(text).toBe('abc123');
    } finally {
      server.close();
    }
  });

  it('GET /webhook returns 403 on wrong verify_token', async () => {
    const app = buildApp({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN });
    const { server, port } = await listen(app);
    try {
      const url = `/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc123`;
      const { status } = await fetchJson(port, url);
      expect(status).toBe(403);
    } finally {
      server.close();
    }
  });

  it('POST /webhook accepts a correctly signed body and returns 200', async () => {
    const app = buildApp({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN });
    const { server, port } = await listen(app);
    try {
      const body = JSON.stringify({ entry: [] });
      const sig = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');
      const { status } = await fetchJson(port, '/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
        body,
      });
      expect(status).toBe(200);
    } finally {
      server.close();
    }
  });

  it('POST /webhook rejects unsigned bodies', async () => {
    const app = buildApp({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN });
    const { server, port } = await listen(app);
    try {
      const { status } = await fetchJson(port, '/webhook', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      expect(status).toBe(401);
    } finally {
      server.close();
    }
  });

  it('POST /flows/data returns 503 stub once signature verifies (Phase 4 stub)', async () => {
    const app = buildApp({ appSecret: APP_SECRET, verifyToken: VERIFY_TOKEN });
    const { server, port } = await listen(app);
    try {
      const body = JSON.stringify({ encrypted_flow_data: '...', encrypted_aes_key: '...', initial_vector: '...' });
      const sig = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');
      const { status } = await fetchJson(port, '/flows/data', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-hub-signature-256': sig },
        body,
      });
      expect(status).toBe(503);
    } finally {
      server.close();
    }
  });
});
