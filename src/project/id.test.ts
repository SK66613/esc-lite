import { describe, expect, it } from 'vitest';
import { createId, isProjectId } from './id';
describe('project id contract', () => {
  it('accepts generated project ids', () => expect(isProjectId(createId('project'))).toBe(true));
  it.each(['', '../secret', 'a/b', 'with space', 'x'.repeat(129)])('rejects unsafe id %j', value => expect(isProjectId(value)).toBe(false));
});
