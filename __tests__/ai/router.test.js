import { describe, it, expect, beforeEach } from 'vitest';
import { pick } from '../../src/ai/router.js';

beforeEach(() => {
  delete process.env.GEMINI_MODEL;
});

describe('router.pick', () => {
  it('classify → gemini gemini-2.0-flash with json_object', () => {
    const r = pick('classify');
    expect(r.provider).toBe('gemini');
    expect(r.model).toBe('gemini-2.0-flash');
    expect(r.response_format).toEqual({ type: 'json_object' });
    expect(r.temperature).toBe(0);
  });

  it('converse → gemini gemini-2.5-flash, no json_object', () => {
    const r = pick('converse');
    expect(r.provider).toBe('gemini');
    expect(r.model).toBe('gemini-2.5-flash');
    expect(r.response_format).toBeNull();
  });

  it('stage-a → gemini gemini-2.5-pro with json_object', () => {
    const r = pick('stage-a');
    expect(r.provider).toBe('gemini');
    expect(r.model).toBe('gemini-2.5-pro');
    expect(r.response_format).toEqual({ type: 'json_object' });
  });

  it('sanctuary → gemini gemini-2.5-flash', () => {
    const r = pick('sanctuary');
    expect(r.provider).toBe('gemini');
    expect(r.model).toBe('gemini-2.5-flash');
  });

  it('vision → gemini gemini-2.0-flash', () => {
    const r = pick('vision');
    expect(r.provider).toBe('gemini');
    expect(r.model).toBe('gemini-2.0-flash');
  });

  it('GEMINI_MODEL env var overrides model for all tasks', () => {
    process.env.GEMINI_MODEL = 'gemini-2.5-flash-preview';
    expect(pick('classify').model).toBe('gemini-2.5-flash-preview');
    expect(pick('stage-a').model).toBe('gemini-2.5-flash-preview');
  });

  it('unknown task → throws', () => {
    expect(() => pick('unknown')).toThrow('Unknown task: unknown');
  });

  it('returns a copy — mutating result does not affect next call', () => {
    const r = pick('classify');
    r.model = 'hacked';
    expect(pick('classify').model).toBe('gemini-2.0-flash');
  });
});
