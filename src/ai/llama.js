import axios from 'axios';
import { record } from './telemetry.js';

const GROQ_BASE    = 'https://api.groq.com/openai/v1';
const TOGETHER_BASE = 'https://api.together.xyz/v1';

// Groq times out at 3 s → triggers fallback. Together gets the full budget.
const GROQ_TIMEOUT_MS    = 3000;
const TOGETHER_TIMEOUT_MS = 15000;

// Together uses different model IDs for the same Llama checkpoints.
const TOGETHER_MODEL_MAP = {
  'llama-3.1-8b-instant':    'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  'llama-3.3-70b-versatile': 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
};

function togetherModel(groqModel) {
  return TOGETHER_MODEL_MAP[groqModel] ?? groqModel;
}

async function callProvider({ baseUrl, apiKey, model, payload, timeoutMs }) {
  const resp = await axios.post(
    `${baseUrl}/chat/completions`,
    { ...payload, model },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: timeoutMs,
    },
  );
  return resp.data;
}

// Returns the raw OpenAI-compatible response object.
// route comes from router.pick(task); task is passed separately for telemetry.
export async function chat({ task, messages, route, tools }) {
  const { provider, model, temperature, response_format } = route;

  const payload = {
    messages,
    temperature,
    ...(response_format ? { response_format } : {}),
    ...(tools?.length   ? { tools, tool_choice: 'auto' } : {}),
  };

  if (provider === 'together') {
    const data = await callProvider({
      baseUrl: TOGETHER_BASE,
      apiKey: process.env.TOGETHER_API_KEY,
      model,
      payload,
      timeoutMs: TOGETHER_TIMEOUT_MS,
    });
    await record({ task, provider: 'together', model, usage: data.usage });
    return data;
  }

  // Groq primary, Together fallback on 429 / 5xx / timeout.
  try {
    const data = await callProvider({
      baseUrl: GROQ_BASE,
      apiKey: process.env.GROQ_API_KEY,
      model,
      payload,
      timeoutMs: GROQ_TIMEOUT_MS,
    });
    await record({ task, provider: 'groq', model, usage: data.usage });
    return data;
  } catch (err) {
    const status = err.response?.status;
    // Client errors (4xx except 429) are not retryable — surface immediately.
    if (status && status !== 429 && status < 500) throw err;

    const fallbackModel = togetherModel(model);
    const data = await callProvider({
      baseUrl: TOGETHER_BASE,
      apiKey: process.env.TOGETHER_API_KEY,
      model: fallbackModel,
      payload,
      timeoutMs: TOGETHER_TIMEOUT_MS,
    });
    await record({ task, provider: 'together', model: fallbackModel, usage: data.usage });
    return data;
  }
}
