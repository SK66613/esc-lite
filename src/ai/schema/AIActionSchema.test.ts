import { describe, expect, it } from 'vitest';
import { AIActionSchema } from './AIActionSchema';

describe('AIActionSchema', () => {
  it('accepts a valid action', () => {
    expect(AIActionSchema.parse({ type: 'set_metadata', payload: { name: 'Coffee 13' } }).type).toBe('set_metadata');
  });
  it('rejects malformed actions', () => {
    expect(AIActionSchema.safeParse({ type: 'set_theme', payload: { primaryColor: 'blue' } }).success).toBe(false);
    expect(AIActionSchema.safeParse({ type: 'execute_code', payload: {} }).success).toBe(false);
  });
});
