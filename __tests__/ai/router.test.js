import { describe, it, expect } from 'vitest';
import { pick } from '../../src/ai/router.js';

describe('router.pick', () => {
  it('classify → groq llama-3.1-8b-instant with json_object', () => {
    const r = pick('classify');
    expect(r.provider).toBe('groq');
    expect(r.model).toBe('llama-3.1-8b-instant');
    expect(r.response_format).toEqual({ type: 'json_object' });
    expect(r.temperature).toBe(0);
  });

  it('converse → groq llama-3.3-70b-versatile, no json_object', () => {
    const r = pick('converse');
    expect(r.provider).toBe('groq');
    expect(r.model).toBe('llama-3.3-70b-versatile');
    expect(r.response_format).toBeNull();
  });

  it('stage-a → groq llama-3.3-70b-versatile with json_object', () => {
    const r = pick('stage-a');
    expect(r.provider).toBe('groq');
    expect(r.model).toBe('llama-3.3-70b-versatile');
    expect(r.response_format).toEqual({ type: 'json_object' });
  });

  it('sanctuary → groq llama-3.3-70b-versatile', () => {
    const r = pick('sanctuary');
    expect(r.provider).toBe('groq');
    expect(r.model).toBe('llama-3.3-70b-versatile');
  });

  it('vision → together', () => {
    const r = pick('vision');
    expect(r.provider).toBe('together');
  });

  it('unknown task → throws', () => {
    expect(() => pick('unknown')).toThrow('Unknown task: unknown');
  });

  it('returns a copy — mutating result does not affect next call', () => {
    const r = pick('classify');
    r.model = 'hacked';
    expect(pick('classify').model).toBe('llama-3.1-8b-instant');
  });
});
