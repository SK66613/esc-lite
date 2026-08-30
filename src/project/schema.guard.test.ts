import { describe, expect, it } from 'vitest';
import { GuardInstanceSchema } from './schema';

describe('guard scope invariant', () => {
  const base = { id: 'guard', type: 'test', enabled: true, config: {} };
  it('accepts valid app and module guards', () => {
    expect(GuardInstanceSchema.safeParse({ ...base, scope: 'app' }).success).toBe(true);
    expect(GuardInstanceSchema.safeParse({ ...base, scope: 'module', moduleId: 'module-1' }).success).toBe(true);
  });
  it('rejects invalid scope/moduleId combinations', () => {
    expect(GuardInstanceSchema.safeParse({ ...base, scope: 'app', moduleId: 'module-1' }).success).toBe(false);
    expect(GuardInstanceSchema.safeParse({ ...base, scope: 'module' }).success).toBe(false);
  });
});
