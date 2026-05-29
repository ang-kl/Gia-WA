import axios from 'axios';
import { record } from './telemetry.js';

// Google AI Studio OpenAI-compatible endpoint.
// Single provider — no Groq/Together fallback.
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai';
const TIMEOUT_MS = 30000;

export async function chat({ task, messages, route, tools }) {
  const { model, temperature, response_format } = route;

  const resp = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model,
      messages,
      temperature,
      ...(response_format ? { response_format } : {}),
      ...(tools?.length   ? { tools, tool_choice: 'auto' } : {}),
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT_MS,
    },
  );

  await record({ task, provider: 'gemini', model, usage: resp.data.usage });
  return resp.data;
}
