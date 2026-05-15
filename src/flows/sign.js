// x-hub-signature-256 verification for WhatsApp Cloud API webhooks.
//
// Meta signs every webhook POST body with HMAC-SHA256 keyed by your App
// Secret. The signature is delivered in the `x-hub-signature-256` header
// formatted as `sha256=<hex>`. Verification must be done over the RAW
// request body — any JSON re-stringification will break the HMAC.

import crypto from 'node:crypto';

/**
 * Verify a webhook request signature.
 *
 * @param {Buffer | string} rawBody Raw request body bytes.
 * @param {string | undefined} header Value of the `x-hub-signature-256` header.
 * @param {string} appSecret The Meta App Secret.
 * @returns {boolean}
 */
export function verifyHubSignature(rawBody, header, appSecret) {
  if (!appSecret) return false;
  if (typeof header !== 'string' || !header.startsWith('sha256=')) return false;
  const provided = header.slice('sha256='.length).trim();
  if (!/^[0-9a-f]{64}$/i.test(provided)) return false;

  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody ?? ''), 'utf8');
  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(bodyBuf)
    .digest('hex');

  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided.toLowerCase(), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
