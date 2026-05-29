// Per-call token telemetry. Appends structured records to a Redis list
// (capped at MAX_ENTRIES). dailySummary() aggregates the last 24 h.

const LIST_KEY = 'wa:telemetry:calls';
const MAX_ENTRIES = 10000;

// USD per 1M tokens — update as provider pricing changes.
const COST_PER_1M = {
  groq: {
    'llama-3.1-8b-instant':    { input: 0.05, output: 0.08 },
    'llama-3.3-70b-versatile': { input: 0.59, output: 0.79 },
  },
  together: {
    'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo':      { input: 0.18, output: 0.18 },
    'meta-llama/Llama-3.3-70B-Instruct-Turbo':           { input: 0.88, output: 0.88 },
    'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo':   { input: 0.18, output: 0.18 },
  },
};

function estimateCost(provider, model, usage) {
  const rates = COST_PER_1M[provider]?.[model];
  if (!rates || !usage) return null;
  return (
    ((usage.prompt_tokens ?? 0) * rates.input +
     (usage.completion_tokens ?? 0) * rates.output) / 1_000_000
  );
}

let _redis = null;

export function init(redis) {
  _redis = redis;
}

export async function record({ task, provider, model, usage }) {
  if (!_redis) return;
  const entry = {
    t: Date.now(),
    task,
    provider,
    model,
    input_tokens:  usage?.prompt_tokens     ?? null,
    output_tokens: usage?.completion_tokens  ?? null,
    cost_usd:      estimateCost(provider, model, usage),
  };
  await _redis.lpush(LIST_KEY, JSON.stringify(entry));
  await _redis.ltrim(LIST_KEY, 0, MAX_ENTRIES - 1);
}

export async function dailySummary() {
  if (!_redis) return null;
  const raw = await _redis.lrange(LIST_KEY, 0, MAX_ENTRIES - 1);
  const cutoff = Date.now() - 86_400_000;
  return raw
    .map(r => JSON.parse(r))
    .filter(e => e.t >= cutoff)
    .reduce(
      (acc, e) => {
        acc.calls++;
        acc.input_tokens  += e.input_tokens  ?? 0;
        acc.output_tokens += e.output_tokens ?? 0;
        acc.cost_usd      += e.cost_usd      ?? 0;
        return acc;
      },
      { calls: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 },
    );
}
