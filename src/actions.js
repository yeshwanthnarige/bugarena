import {validateAction} from './browser.js';

export function parseAction(text, observation) {
  const clean = text.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, '$1');
  let value;
  try { value = JSON.parse(clean); }
  catch { throw new Error('Return exactly one valid JSON object, without commentary.'); }
  return validateAction(value, observation);
}

// Retry formatting/validation failures only. Never execute or invent a repair.
export async function chooseAction({ask, instructions, input, observation, onAttempt = () => {}}) {
  let feedback = '';
  for (let attempt = 1; attempt <= 3; attempt++) {
    const answer = await ask(instructions, JSON.stringify({...input, ...(feedback ? {formatCorrection: feedback} : {})}));
    let action, error;
    try { action = parseAction(answer.text, observation); }
    catch (failure) { error = failure.message; }
    onAttempt({attempt, usage: answer.usage, accepted: !error, ...(error ? {error} : {})});
    if (!error) return action;
    feedback = `Your previous response was rejected: ${error} No action was executed. Choose one action using the unchanged observation and return only its JSON object.`;
  }
  throw new Error('Model returned invalid actions on all 3 attempts. No unvalidated action executed.');
}
