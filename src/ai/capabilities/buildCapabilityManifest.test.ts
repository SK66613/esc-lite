import { describe, expect, it } from 'vitest';
import { buildCapabilityManifest } from './buildCapabilityManifest';

const containsFunction = (value: unknown): boolean => {
  if (typeof value === 'function') return true;
  if (!value || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).some(containsFunction);
};

describe('buildCapabilityManifest', () => {
  it('contains registered capabilities', () => {
    const manifest = buildCapabilityManifest();
    expect(manifest.modules.map((item) => item.type)).toContain('loyalty_passport');
    expect(manifest.tools.map((item) => item.type)).toContain('qr_sales');
    expect(manifest.guards.map((item) => item.type)).toContain('telegram_subscription');
    expect(manifest.templates.map((item) => item.id)).toContain('coffee_house');
  });
  it('contains JSON-compatible metadata only', () => {
    const manifest = buildCapabilityManifest();
    expect(containsFunction(manifest)).toBe(false);
    expect(() => JSON.stringify(manifest)).not.toThrow();
  });
});
