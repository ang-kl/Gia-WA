import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
vi.mock('../../src/ai/telemetry.js', () => ({ record: vi.fn() }));

import axios from 'axios';
import { chat } from '../../src/ai/llama.js';
import { pick } from '../../src/ai/router.js';

const OK = {
  choices: [{ message: { role: 'assistant', content: '{"intent":"venue"}' } }],
  usage: { prompt_tokens: 100, completion_tokens: 20 },
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'test-gemini-key';
});

describe('chat', () => {
  it('calls Gemini OpenAI-compat endpoint', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    const result = await chat({ task: 'classify', messages: [{ role: 'user', content: 'sushi' }], route: pick('classify') });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toContain('generativelanguage.googleapis.com');
    expect(result).toBe(OK);
  });

  it('sends Authorization: Bearer GEMINI_API_KEY', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await chat({ task: 'classify', messages: [], route: pick('classify') });
    const headers = axios.post.mock.calls[0][2].headers;
    expect(headers.Authorization).toBe('Bearer test-gemini-key');
  });

  it('includes response_format when route has it', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await chat({ task: 'classify', messages: [], route: pick('classify') });
    expect(axios.post.mock.calls[0][1].response_format).toEqual({ type: 'json_object' });
  });

  it('omits response_format when route has none', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await chat({ task: 'converse', messages: [], route: pick('converse') });
    expect(axios.post.mock.calls[0][1].response_format).toBeUndefined();
  });

  it('sends tools in payload when provided', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    const tools = [{ type: 'function', function: { name: 'lookup', parameters: {} } }];
    await chat({ task: 'sanctuary', messages: [], route: pick('sanctuary'), tools });
    const body = axios.post.mock.calls[0][1];
    expect(body.tools).toEqual(tools);
    expect(body.tool_choice).toBe('auto');
  });

  it('omits tools field when none provided', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await chat({ task: 'classify', messages: [], route: pick('classify') });
    expect(axios.post.mock.calls[0][1].tools).toBeUndefined();
  });

  it('propagates errors — no fallback provider', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 429 } });
    await expect(
      chat({ task: 'classify', messages: [], route: pick('classify') }),
    ).rejects.toMatchObject({ response: { status: 429 } });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});
