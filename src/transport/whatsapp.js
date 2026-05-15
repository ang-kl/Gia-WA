// WhatsApp Cloud API client.
//
// Methods that are wired in Phase 1: sendText.
// Methods stubbed (throw) until later phases: sendButtons, sendList,
// sendLocationRequest, openFlow, sendImage, sendTemplate.

import axios from 'axios';

const DEFAULT_API_VERSION = 'v21.0';
const MAX_TEXT_BODY = 4096; // Cloud API accepts up to ~4096 for body; UI splits past 1024

function readEnv() {
  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const token = process.env.WA_BUSINESS_TOKEN;
  const apiVersion = process.env.WA_GRAPH_API_VERSION || DEFAULT_API_VERSION;
  if (!phoneNumberId) throw new Error('WA_PHONE_NUMBER_ID not set');
  if (!token) throw new Error('WA_BUSINESS_TOKEN not set');
  return { phoneNumberId, token, apiVersion };
}

function baseUrl({ phoneNumberId, apiVersion }) {
  return `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
}

async function postWithRetry(url, body, token, { retries = 3 } = {}) {
  let attempt = 0;
  let lastErr;
  while (attempt <= retries) {
    try {
      const res = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 10_000,
      });
      return res.data;
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      const retriable = status === 429 || (status >= 500 && status < 600);
      if (!retriable || attempt === retries) throw err;
      const backoff = 250 * Math.pow(2, attempt) + Math.floor(Math.random() * 250);
      await new Promise((r) => setTimeout(r, backoff));
      attempt += 1;
    }
  }
  throw lastErr;
}

/**
 * Send a plain text message.
 * @param {string} to E.164 recipient (with or without leading +).
 * @param {string} body
 * @param {{ previewUrl?: boolean }} [opts]
 */
export async function sendText(to, body, opts = {}) {
  if (typeof to !== 'string' || !to) throw new TypeError('sendText: to required');
  if (typeof body !== 'string' || !body) throw new TypeError('sendText: body required');
  if (body.length > MAX_TEXT_BODY) {
    throw new RangeError(`sendText: body exceeds ${MAX_TEXT_BODY} chars; chunk via format.chunkForWhatsApp`);
  }
  const env = readEnv();
  return postWithRetry(
    baseUrl(env),
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: to.replace(/^\+/, ''),
      type: 'text',
      text: { body, preview_url: opts.previewUrl ?? false },
    },
    env.token,
  );
}

// ---------- Stubs (Phase 3+) ----------

export async function sendButtons(/* to, body, buttons */) {
  throw new Error('sendButtons: not implemented (Phase 3)');
}

export async function sendList(/* to, body, button, sections */) {
  throw new Error('sendList: not implemented (Phase 3)');
}

export async function sendLocationRequest(/* to, body */) {
  throw new Error('sendLocationRequest: not implemented (Phase 3)');
}

export async function openFlow(/* to, flowId, flowToken, initialScreen, data */) {
  throw new Error('openFlow: not implemented (Phase 4)');
}

export async function sendImage(/* to, mediaIdOrLink, caption */) {
  throw new Error('sendImage: not implemented (Phase 5)');
}

export async function sendTemplate(/* to, name, language, components */) {
  throw new Error('sendTemplate: not implemented (Phase 6)');
}

// Exported for tests
export const __internal = { postWithRetry, baseUrl, readEnv };
