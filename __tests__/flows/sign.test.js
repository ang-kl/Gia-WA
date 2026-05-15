import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { verifyHubSignature } from '../../src/flows/sign.js';

const SECRET = 'test-app-secret-do-not-use-in-prod';

function signedHeader(body, secret = SECRET) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8');
  const hex = crypto.createHmac('sha256', secret).update(buf).digest('hex');
  return 'sha256=' + hex;
}

describe('verifyHubSignature', () => {
  it('accepts a correctly signed body', () => {
    const body = JSON.stringify({ hello: 'world' });
    expect(verifyHubSignature(body, signedHeader(body), SECRET)).toBe(true);
  });

  it('accepts a Buffer body', () => {
    const body = Buffer.from('raw bytes 🚀', 'utf8');
    expect(verifyHubSignature(body, signedHeader(body), SECRET)).toBe(true);
  });

  it('rejects when the body is altered', () => {
    const body = '{"a":1}';
    const tamper = '{"a":2}';
    expect(verifyHubSignature(tamper, signedHeader(body), SECRET)).toBe(false);
  });

  it('rejects when the secret is wrong', () => {
    const body = 'x';
    expect(verifyHubSignature(body, signedHeader(body, 'other-secret'), SECRET)).toBe(false);
  });

  it('rejects when the header is missing or malformed', () => {
    expect(verifyHubSignature('x', undefined, SECRET)).toBe(false);
    expect(verifyHubSignature('x', '', SECRET)).toBe(false);
    expect(verifyHubSignature('x', 'sha1=abcd', SECRET)).toBe(false);
    expect(verifyHubSignature('x', 'sha256=nothex', SECRET)).toBe(false);
    expect(verifyHubSignature('x', 'sha256=' + 'a'.repeat(63), SECRET)).toBe(false);
  });

  it('rejects when the app secret is empty', () => {
    const body = 'x';
    expect(verifyHubSignature(body, signedHeader(body), '')).toBe(false);
  });

  it('accepts mixed-case hex from the wire', () => {
    const body = 'mixed';
    const header = signedHeader(body).toUpperCase().replace('SHA256=', 'sha256=');
    expect(verifyHubSignature(body, header, SECRET)).toBe(true);
  });
});
