// =======================================================================
// GEMINI MODEL FALLBACK CHAIN
// Primary: gemini-3.6-flash
// Fallbacks: gemini-3.5-flash, gemini-3.5-flash-lite, gemini-3.1-flash-lite, gemini-3.8-flash
// Extended resilience fallbacks: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
// =======================================================================

export const GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
] as const;

export type GeminiModelName = (typeof GEMINI_MODELS)[number];

