export const SERVER_ALLOWED_MODULE_TYPES = ['loyalty_passport', 'offers_placeholder'] as const;
export const SERVER_ALLOWED_TOOL_TYPES = ['qr_sales'] as const;
export const SERVER_ALLOWED_GUARD_TYPES = ['telegram_subscription'] as const;
export const SERVER_ALLOWED_TEMPLATE_IDS = ['coffee_house', 'beauty_salon', 'store', 'restaurant'] as const;

export const SERVER_ALLOWED_CAPABILITY_IDS = {
  modules: new Set<string>(SERVER_ALLOWED_MODULE_TYPES),
  tools: new Set<string>(SERVER_ALLOWED_TOOL_TYPES),
  guards: new Set<string>(SERVER_ALLOWED_GUARD_TYPES),
  templates: new Set<string>(SERVER_ALLOWED_TEMPLATE_IDS),
};
