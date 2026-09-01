/** Worker-safe authorization allowlist. Keep in sync when a registry capability ships. */
export const SERVER_ALLOWED_CAPABILITY_IDS = {
  modules: new Set(['loyalty_passport', 'offers_placeholder']),
  tools: new Set(['qr_sales']),
  guards: new Set(['telegram_subscription']),
  templates: new Set(['coffee_house', 'beauty_salon', 'store', 'restaurant']),
} as const;
