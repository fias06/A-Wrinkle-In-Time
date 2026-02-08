// Shared ElevenLabs API key: env first, then fallback so voice works without .env
// Set VITE_ELEVENLABS_API_KEY in .env for production (then remove fallback below)
const FALLBACK = 'sk_b2f7e426e2eef8b2f5f0b02d239a744c04068c80bc3c00a0';
export const ELEVENLABS_API_KEY =
  (import.meta.env && import.meta.env.VITE_ELEVENLABS_API_KEY) ||
  FALLBACK ||
  '';
