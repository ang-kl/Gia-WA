import { describe, it, expect } from 'vitest';
import { makeDedup } from '../../src/ai/dedup.js';

function makeFakeRedis() {
  const store = new Map();
  return {
    async get(key) { return store.get(key) ?? null; },
    async set(key, value, _ex, _ttl) { store.set(key, value); },
  };
}

describe('dedup', () => {
  it('miss on empty cache', async () => {
    const d = makeDedup(makeFakeRedis());
    expect(await d.get('en', 'sushi near me')).toBeNull();
  });

  it('hit after set', async () => {
    const d = makeDedup(makeFakeRedis());
    const resp = { choices: [{ message: { content: 'top picks!' } }] };
    await d.set('en', 'sushi near me', resp);
    expect(await d.get('en', 'sushi near me')).toEqual(resp);
  });

  it('different text → miss', async () => {
    const d = makeDedup(makeFakeRedis());
    await d.set('en', 'sushi', { a: 1 });
    expect(await d.get('en', 'ramen')).toBeNull();
  });

  it('different lang → miss', async () => {
    const d = makeDedup(makeFakeRedis());
    await d.set('en', 'sushi', { a: 1 });
    expect(await d.get('zh', 'sushi')).toBeNull();
  });

  it('same text exact match → hit', async () => {
    const d = makeDedup(makeFakeRedis());
    await d.set('en', 'I want Japanese food', { a: 2 });
    expect(await d.get('en', 'I want Japanese food')).toEqual({ a: 2 });
  });
});
