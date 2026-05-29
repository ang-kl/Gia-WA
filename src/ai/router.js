// Single place to change model assignments. pick() is a pure function —
// trivially testable and greppable.

const ROUTES = {
  classify: {
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    temperature: 0,
    response_format: { type: 'json_object' },
  },
  converse: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    response_format: null,
  },
  'stage-a': {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' },
  },
  sanctuary: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' },
  },
  vision: {
    provider: 'together',
    model: 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
    temperature: 0.2,
    response_format: null,
  },
};

export function pick(task) {
  const route = ROUTES[task];
  if (!route) throw new Error(`Unknown task: ${task}`);
  return { ...route };
}
