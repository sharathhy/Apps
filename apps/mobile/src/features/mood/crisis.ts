/**
 * Spots writing that may be about self-harm, so the app can show support
 * lines. Runs only on the device; nothing is sent or stored about it. It is
 * a prompt to offer help, not an assessment, and errs toward showing help.
 */
const patterns: RegExp[] = [
  /\bsuicid/i,
  /\bkill(ing)? my ?self\b/i,
  /\bend(ing)? (it all|my life)\b/i,
  /\bself[- ]?harm/i,
  /\bhurt(ing)? my ?self\b/i,
  /\bcut(ting)? my ?self\b/i,
  /\b(want|wanted|going) to die\b/i,
  /\bno reason to live\b/i,
  /\bbetter off (dead|without me)\b/i,
  /\bkhud ?kushi\b/i,
  /\bmar jaana?\b/i,
  /आत्महत्या/,
  /ख़ुदकुशी|खुदकुशी/,
  /(खुद|ख़ुद) को (नुकसान|चोट)/,
  /मर जा(ना|ऊँ|ऊं|उं)/,
  /जीना नहीं चाह/,
];

export function mentionsSelfHarm(text: string): boolean {
  return patterns.some((p) => p.test(text));
}

/** Support lines shown with any self-harm mention, and from the Mood screen at any time. */
export const supportLines = [
  { id: 'teleManas', region: 'IN', number: '14416', alt: '1-800-891-4416', tel: 'tel:14416' },
  { id: 'lifeline988', region: 'US', number: '988', alt: null, tel: 'tel:988', sms: 'sms:988' },
] as const;
