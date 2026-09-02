export const PROJECT_ID_PATTERN = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/;
export const isProjectId = (value: unknown): value is string =>
  typeof value === 'string' && value.length >= 1 && value.length <= 128 && PROJECT_ID_PATTERN.test(value);

export const createId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
