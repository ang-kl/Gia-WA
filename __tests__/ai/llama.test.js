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
  process.env.GROQ_API_KEY    = 'test-groq';
  process.env.TOGETHER_API_KEY = 'test-together';
});

describe('chat', () => {
  it('calls Groq for classify task', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    const result = await chat({ task: 'classify', messages: [{ role: 'user', content: 'sushi' }], route: pick('classify') });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toContain('groq.com');
    expect(result).toBe(OK);
  });

  it('falls back to Together on Groq 429', async () => {
    axios.post
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: OK });
    const result = await chat({ task: 'classify', messages: [], route: pick('classify') });
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[1][0]).toContain('together.xyz');
    expect(result).toBe(OK);
  });

  it('falls back to Together on Groq 500', async () => {
    axios.post
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({ data: OK });
    await chat({ task: 'classify', messages: [], route: pick('classify') });
    expect(axios.post.mock.calls[1][0]).toContain('together.xyz');
  });

  it('falls back to Together on network timeout (no response status)', async () => {
    axios.post
      .mockRejectedValueOnce({ code: 'ECONNABORTED' })
      .mockResolvedValueOnce({ data: OK });
    await chat({ task: 'classify', messages: [], route: pick('classify') });
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[1][0]).toContain('together.xyz');
  });

  it('does NOT fall back on Groq 400 (client error)', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 400 } });
    await expect(
      chat({ task: 'classify', messages: [], route: pick('classify') }),
    ).rejects.toMatchObject({ response: { status: 400 } });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it('goes directly to Together for vision tasks', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    await chat({ task: 'vision', messages: [], route: pick('vision') });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post.mock.calls[0][0]).toContain('together.xyz');
  });

  it('sends tools in payload when provided', async () => {
    axios.post.mockResolvedValueOnce({ data: OK });
    const tools = [{ type: 'function', function: { name: 'lookup', parameters: {} } }];
    await chat({ task: 'sanctuary', messages: [], route: pick('sanctuary'), tools });
    const body = axios.post.mock.calls[0][1];
    expect(body.tools).toEqual(tools);
    expect(body.tool_choice).toBe('auto');
  });

  it('maps groq model to together model on fallback', async () => {
    axios.post
      .mockRejectedValueOnce({ response: { status: 429 } })
      .mockResolvedValueOnce({ data: OK });
    await chat({ task: 'classify', messages: [], route: pick('classify') });
    const fallbackBody = axios.post.mock.calls[1][1];
    expect(fallbackBody.model).toBe('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo');
  });
});
