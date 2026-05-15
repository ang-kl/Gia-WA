import { describe, it, expect } from 'vitest';
import { escapeMarkup, renderVenue, renderVenueList, chunkForWhatsApp } from '../../src/transport/format.js';

describe('escapeMarkup', () => {
  it('passes plain text through unchanged', () => {
    expect(escapeMarkup('Cafe Beijing')).toBe('Cafe Beijing');
  });

  it('returns empty string for null/undefined', () => {
    expect(escapeMarkup(null)).toBe('');
    expect(escapeMarkup(undefined)).toBe('');
  });

  it('isolates strikethrough tildes so they render literally', () => {
    const out = escapeMarkup('Cafe ~Lao~ Beijing');
    expect(out).not.toBe('Cafe ~Lao~ Beijing'); // mutated
    expect(out.replace(/​/g, '')).toBe('Cafe ~Lao~ Beijing'); // visually same
    // No raw tilde without ZWSP sandwich
    for (let i = 0; i < out.length; i++) {
      if (out[i] === '~') {
        expect(out[i - 1] === '​' || out[i + 1] === '​').toBe(true);
      }
    }
  });

  it('isolates every markup character', () => {
    for (const ch of ['*', '_', '~', '`']) {
      const out = escapeMarkup(`x${ch}y`);
      expect(out).toContain('​' + ch + '​');
    }
  });

  it('coerces non-strings', () => {
    expect(escapeMarkup(123)).toBe('123');
    expect(escapeMarkup({ toString: () => 'obj' })).toBe('obj');
  });
});

describe('renderVenue', () => {
  it('renders name, cuisine, distance, rationale, url', () => {
    const out = renderVenue({
      name: 'Sushi Tei',
      cuisine: 'Japanese',
      distance_m: 184.6,
      rationale: 'consistent omakase, quick service',
      url: 'https://example.com/sushi-tei',
    });
    expect(out).toContain('*Sushi Tei*');
    expect(out).toContain('_Japanese_');
    expect(out).toContain('185 m away');
    expect(out).toContain('consistent omakase, quick service');
    expect(out).toContain('https://example.com/sushi-tei');
  });

  it('escapes markup inside venue name', () => {
    const out = renderVenue({ name: 'Cafe ~Lao~ Beijing' });
    // The outer *...* bold must remain intact; only inner tildes are escaped.
    expect(out.startsWith('*')).toBe(true);
    expect(out.endsWith('*')).toBe(true);
    expect(out).toContain('​~​');
  });

  it('handles missing fields without throwing', () => {
    expect(() => renderVenue({})).not.toThrow();
    expect(renderVenue({})).toBe('*Unknown*');
  });

  it('drops non-finite distance', () => {
    expect(renderVenue({ name: 'X', distance_m: NaN })).not.toContain('away');
    expect(renderVenue({ name: 'X', distance_m: Infinity })).not.toContain('away');
  });
});

describe('renderVenueList', () => {
  it('numbers entries from 1 and joins with blank lines', () => {
    const out = renderVenueList([{ name: 'A' }, { name: 'B' }]);
    expect(out.startsWith('1. ')).toBe(true);
    expect(out).toContain('\n\n2. ');
  });
});

describe('chunkForWhatsApp', () => {
  it('returns single chunk under the limit', () => {
    expect(chunkForWhatsApp('hi')).toEqual(['hi']);
  });

  it('splits long bodies on sentence/newline boundaries', () => {
    const body = ('a'.repeat(500) + '. ' + 'b'.repeat(500) + '. ' + 'c'.repeat(500)).slice(0, 1500);
    const chunks = chunkForWhatsApp(body, 600);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(600);
    expect(chunks.join('')).toContain('aaa');
  });

  it('rejects non-strings', () => {
    expect(() => chunkForWhatsApp(123)).toThrow(TypeError);
  });

  it('reassembles to original content up to whitespace trimming', () => {
    const body = 'one\n\ntwo\n\nthree';
    const chunks = chunkForWhatsApp(body, 5);
    expect(chunks.join('')).toMatch(/onetwothree/);
  });
});
