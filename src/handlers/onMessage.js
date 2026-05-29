import { chat } from '../ai/llama.js';
import { pick } from '../ai/router.js';
import { CLASSIFIER_SYSTEM } from '../ai/prompts/classifier.js';

export async function onMessage(message, wa) {
  const { from, type } = message;

  if (type === 'text') return handleText(from, message.text.body, wa);
  if (type === 'location') return handleLocation(from, wa);
  if (type === 'interactive') return handleInteractive(from, message.interactive, wa);

  // Unknown type — acknowledge so the user isn't left waiting.
  return wa.sendText(from, "I don't understand that type of message yet.");
}

async function handleText(from, text, wa) {
  const classifyResult = await chat({
    task: 'classify',
    messages: [
      { role: 'system', content: CLASSIFIER_SYSTEM },
      { role: 'user', content: text },
    ],
    route: pick('classify'),
  });

  let intent;
  try {
    intent = JSON.parse(classifyResult.choices[0].message.content);
  } catch {
    intent = { intent: 'unknown' };
  }

  if (intent.intent === 'venue') {
    return wa.sendLocationRequest(from, "Share your location and I'll find nearby lunch venues 📍");
  }

  const converseResult = await chat({
    task: 'converse',
    messages: [{ role: 'user', content: text }],
    route: pick('converse'),
  });
  return wa.sendText(from, converseResult.choices[0].message.content);
}

function handleLocation(from, wa) {
  // Phase 4: onLocation.js takes over with Stage-A + vault lookup.
  return wa.sendText(from, 'Got your location! Finding venues nearby…');
}

async function handleInteractive(from, interactive, wa) {
  if (interactive?.type === 'nfm_reply') {
    // Phase 4: onFlowReply.js handles Flow submissions.
    return wa.sendText(from, 'Processing your request…');
  }
  // button_reply / list_reply — Phase 4 routes these.
  return wa.sendText(from, 'Got it!');
}
