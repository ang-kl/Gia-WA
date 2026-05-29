import { createHash } from 'crypto';

// 60-second (lang, sha256(text)) → response cache.
// Catches refresh-spam / double-tap; the only "prompt caching" available
// under D-1 (no Anthropic SDK, no native Groq cache).

const TTL_SECONDS = 60;

function key(lang, text) {
  const hash = createHash('sha256').update(text).digest('hex').slice(0, 16);
  return `wa:dedup:${lang}:${hash}`;
}

export function makeDedup(redis) {
  return {
    async get(lang, text) {
      const raw = await redis.get(key(lang, text));
      return raw ? JSON.parse(raw) : null;
    },
    async set(lang, text, response) {
      await redis.set(key(lang, text), JSON.stringify(response), 'EX', TTL_SECONDS);
    },
  };
}
