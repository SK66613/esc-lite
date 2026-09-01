import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../project/defaults';
import { buildCapabilityManifest } from '../capabilities/buildCapabilityManifest';
import { AIPlannerRequestSchema, MAX_CONVERSATION_TURNS } from './AIPlannerRequestSchema';
const base = { message:'Темнее', project:createDefaultProject(), capabilities:buildCapabilityManifest() };
describe('AI planner conversation schema', () => {
  it('accepts valid turns', () => expect(AIPlannerRequestSchema.safeParse({...base,conversation:[{role:'user',content:'Сделай кофе'}]}).success).toBe(true));
  it('rejects too many turns', () => expect(AIPlannerRequestSchema.safeParse({...base,conversation:Array.from({length:MAX_CONVERSATION_TURNS+1},()=>({role:'user',content:'x'}))}).success).toBe(false));
  it('rejects an oversized turn', () => expect(AIPlannerRequestSchema.safeParse({...base,conversation:[{role:'user',content:'x'.repeat(1501)}]}).success).toBe(false));
});
