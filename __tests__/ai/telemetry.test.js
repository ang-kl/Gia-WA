import { describe, it, expect, beforeEach } from 'vitest';
import { init, record, dailySummary } from '../../src/ai/telemetry.js';

function makeListRedis() {
  const lists = new Map();
  return {
    async lpush(key, val) {
      const list = lists.get(key) ?? [];
      list.unshift(val);
      lists.set(key, list);
    },
    async ltrim(key, start, end) {
      const list = lists.get(key) ?? [];
      lists.set(key, list.slice(start, end + 1));
    },
    async lrange(key, start, end) {
      return (lists.get(key) ?? []).slice(start, end + 1);
    },
  };
}

beforeEach(() => init(null));

describe('telemetry', () => {
  it('record is a no-op without redis', async () => {
    await expect(
      record({ task: 'classify', provider: 'gemini', model: 'gemini-2.0-flash', usage: null }),
    ).resolves.toBeUndefined();
  });

  it('dailySummary returns null without redis', async () => {
    expect(await dailySummary()).toBeNull();
  });

  it('record appends a structured entry', async () => {
    const redis = makeListRedis();
    init(redis);
    await record({
      task: 'classify',
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      usage: { prompt_tokens: 100, completion_tokens: 20 },
    });
    const raw = await redis.lrange('wa:telemetry:calls', 0, 0);
    const entry = JSON.parse(raw[0]);
    expect(entry.task).toBe('classify');
    expect(entry.provider).toBe('gemini');
    expect(entry.input_tokens).toBe(100);
    expect(entry.output_tokens).toBe(20);
    expect(typeof entry.cost_usd).toBe('number');
    expect(typeof entry.t).toBe('number');
  });

  it('dailySummary aggregates multiple calls', async () => {
    const redis = makeListRedis();
    init(redis);
    await record({ task: 'classify', provider: 'gemini', model: 'gemini-2.0-flash',  usage: { prompt_tokens: 100, completion_tokens: 20 } });
    await record({ task: 'converse', provider: 'gemini', model: 'gemini-2.5-flash', usage: { prompt_tokens: 500, completion_tokens: 80 } });
    const s = await dailySummary();
    expect(s.calls).toBe(2);
    expect(s.input_tokens).toBe(600);
    expect(s.output_tokens).toBe(100);
    expect(s.cost_usd).toBeGreaterThan(0);
  });

  it('cost_usd sums to 0 for unknown model (no rates)', async () => {
    const redis = makeListRedis();
    init(redis);
    await record({ task: 'classify', provider: 'gemini', model: 'unknown-model', usage: { prompt_tokens: 100, completion_tokens: 10 } });
    const s = await dailySummary();
    expect(s.cost_usd).toBe(0);
  });
});
