// Single place to change model assignments.
// GEMINI_MODEL env var overrides the model for all tasks when set —
// useful for Railway deployments where one model handles everything.

const ROUTES = {
  classify: {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    temperature: 0,
    response_format: { type: 'json_object' },
  },
  converse: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    response_format: null,
  },
  'stage-a': {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    temperature: 0.2,
    response_format: { type: 'json_object' },
  },
  sanctuary: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    response_format: { type: 'json_object' },
  },
  vision: {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    temperature: 0.2,
    response_format: null,
  },
};

export function pick(task) {
  const route = ROUTES[task];
  if (!route) throw new Error(`Unknown task: ${task}`);
  const model = process.env.GEMINI_MODEL ?? route.model;
  return { ...route, model };
}
