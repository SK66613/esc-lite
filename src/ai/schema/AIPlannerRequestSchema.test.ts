import { describe, expect, it } from 'vitest';
import { buildCapabilityManifest } from '../capabilities/buildCapabilityManifest';
import { createDefaultProject } from '../../project/defaults';
import { AIPlannerRequestSchema } from './AIPlannerRequestSchema';

const base = { message:'test', project:createDefaultProject(), capabilities:buildCapabilityManifest() };

describe('AIPlannerRequestSchema conversation', () => {
  it('accepts bounded conversation turns', () => {
    expect(AIPlannerRequestSchema.safeParse({ ...base, conversation:[{role:'user',content:'Привет'},{role:'assistant',content:'Здравствуйте'}] }).success).toBe(true);
  });
  it('rejects too many turns', () => {
    const conversation = Array.from({length:9}, () => ({role:'user' as const,content:'x'}));
    expect(AIPlannerRequestSchema.safeParse({ ...base, conversation }).success).toBe(false);
  });
  it('rejects oversized turns and total conversation', () => {
    expect(AIPlannerRequestSchema.safeParse({ ...base, conversation:[{role:'user',content:'x'.repeat(1501)}] }).success).toBe(false);
    const conversation = Array.from({length:5}, () => ({role:'user' as const,content:'x'.repeat(1300)}));
    expect(AIPlannerRequestSchema.safeParse({ ...base, conversation }).success).toBe(false);
  });
});
