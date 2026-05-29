import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/ai/llama.js', () => ({ chat: vi.fn() }));

import { chat } from '../../src/ai/llama.js';
import { onMessage } from '../../src/handlers/onMessage.js';

const wa = {
  sendText: vi.fn(),
  sendButtons: vi.fn(),
  sendList: vi.fn(),
  sendLocationRequest: vi.fn(),
};

const FROM = '+6591234567';

const classifyVenue     = JSON.stringify({ intent: 'venue',    cuisine: 'japanese', lang: 'en' });
const classifyConverse  = JSON.stringify({ intent: 'converse', cuisine: null,       lang: 'en' });
const classifyUnknown   = JSON.stringify({ intent: 'unknown',  cuisine: null,       lang: 'en' });

beforeEach(() => vi.clearAllMocks());

describe('onMessage — text', () => {
  it('venue intent → sendLocationRequest', async () => {
    chat.mockResolvedValueOnce({ choices: [{ message: { content: classifyVenue } }], usage: {} });
    await onMessage({ from: FROM, type: 'text', text: { body: 'sushi near me' } }, wa);
    expect(wa.sendLocationRequest).toHaveBeenCalledWith(FROM, expect.any(String));
    expect(wa.sendText).not.toHaveBeenCalled();
  });

  it('converse intent → classify then converse → sendText', async () => {
    chat
      .mockResolvedValueOnce({ choices: [{ message: { content: classifyConverse } }], usage: {} })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Hello! How can I help?' } }], usage: {} });
    await onMessage({ from: FROM, type: 'text', text: { body: 'hello' } }, wa);
    expect(wa.sendText).toHaveBeenCalledWith(FROM, 'Hello! How can I help?');
    expect(chat).toHaveBeenCalledTimes(2);
  });

  it('unknown intent → falls back to converse path', async () => {
    chat
      .mockResolvedValueOnce({ choices: [{ message: { content: classifyUnknown } }], usage: {} })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Not sure, try again?' } }], usage: {} });
    await onMessage({ from: FROM, type: 'text', text: { body: '???' } }, wa);
    expect(wa.sendText).toHaveBeenCalled();
  });

  it('malformed classifier JSON → falls back to converse path', async () => {
    chat
      .mockResolvedValueOnce({ choices: [{ message: { content: 'not json {{{' } }], usage: {} })
      .mockResolvedValueOnce({ choices: [{ message: { content: 'Hi!' } }], usage: {} });
    await onMessage({ from: FROM, type: 'text', text: { body: 'hi' } }, wa);
    expect(wa.sendText).toHaveBeenCalled();
  });
});

describe('onMessage — other types', () => {
  it('location message → sendText ack', async () => {
    await onMessage({ from: FROM, type: 'location', location: { latitude: 1.28, longitude: 103.85 } }, wa);
    expect(wa.sendText).toHaveBeenCalledWith(FROM, expect.any(String));
  });

  it('interactive nfm_reply → sendText ack', async () => {
    await onMessage({ from: FROM, type: 'interactive', interactive: { type: 'nfm_reply', nfm_reply: {} } }, wa);
    expect(wa.sendText).toHaveBeenCalledWith(FROM, expect.any(String));
  });

  it('interactive button_reply → sendText ack', async () => {
    await onMessage({ from: FROM, type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'btn_0', title: 'Yes' } } }, wa);
    expect(wa.sendText).toHaveBeenCalledWith(FROM, expect.any(String));
  });

  it('unknown message type → sendText ack', async () => {
    await onMessage({ from: FROM, type: 'image', image: {} }, wa);
    expect(wa.sendText).toHaveBeenCalledWith(FROM, expect.any(String));
  });
});
