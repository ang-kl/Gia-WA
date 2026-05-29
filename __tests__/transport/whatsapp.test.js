import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
import axios from 'axios';

import { sendButtons, sendList, sendLocationRequest } from '../../src/transport/whatsapp.js';

const OK = { messages: [{ id: 'wamid.test' }] };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.WA_PHONE_NUMBER_ID = '123456';
  process.env.WA_BUSINESS_TOKEN  = 'test-token';
});

describe('sendButtons', () => {
  it('sends correct interactive button payload', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await sendButtons('+6591234567', 'Pick one', [
      { id: 'yes', title: 'Yes' },
      { id: 'no',  title: 'No'  },
    ]);
    const body = axios.post.mock.calls[0][1];
    expect(body.type).toBe('interactive');
    expect(body.interactive.type).toBe('button');
    expect(body.interactive.action.buttons).toHaveLength(2);
    expect(body.interactive.action.buttons[0]).toEqual({ type: 'reply', reply: { id: 'yes', title: 'Yes' } });
    expect(body.to).toBe('6591234567'); // leading + stripped
  });

  it('throws on 0 buttons', async () => {
    await expect(sendButtons('+65', 'body', [])).rejects.toThrow('1–3 buttons');
  });

  it('throws on 4 buttons', async () => {
    await expect(sendButtons('+65', 'body', [{},{},{},{}])).rejects.toThrow('1–3 buttons');
  });
});

describe('sendList', () => {
  it('sends correct interactive list payload', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await sendList('+6591234567', 'Choose a venue', [
      { title: 'Japanese', rows: [{ id: 'r1', title: 'Sushi Tei', description: 'Level 2' }] },
    ]);
    const body = axios.post.mock.calls[0][1];
    expect(body.interactive.type).toBe('list');
    expect(body.interactive.action.button).toBe('View options');
    expect(body.interactive.action.sections[0].rows[0].id).toBe('r1');
  });

  it('throws on empty sections', async () => {
    await expect(sendList('+65', 'body', [])).rejects.toThrow('sections required');
  });
});

describe('sendLocationRequest', () => {
  it('sends correct location_request_message payload', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await sendLocationRequest('+6591234567', 'Share your location');
    const body = axios.post.mock.calls[0][1];
    expect(body.interactive.type).toBe('location_request_message');
    expect(body.interactive.action.name).toBe('send_location');
    expect(body.interactive.body.text).toBe('Share your location');
  });

  it('throws on missing body', async () => {
    await expect(sendLocationRequest('+65', '')).rejects.toThrow('body required');
  });
});
