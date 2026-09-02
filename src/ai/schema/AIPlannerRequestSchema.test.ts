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

describe('cover asset metadata bounds',()=>{
 it('accepts the bounded built-in catalog',()=>expect(AIPlannerRequestSchema.safeParse(base).success).toBe(true));
 it('rejects oversized and malformed cover context',()=>{const tooMany=structuredClone(base) as any;tooMany.capabilities.modules.find((m:any)=>m.type==='loyalty_passport').ai.coverAssets=Array.from({length:41},(_,i)=>({id:`a${i}`,title:'A',category:'x',keywords:[]}));expect(AIPlannerRequestSchema.safeParse(tooMany).success).toBe(false);const longKeyword=structuredClone(base) as any;longKeyword.capabilities.modules.find((m:any)=>m.type==='loyalty_passport').ai.coverAssets[0].keywords=['x'.repeat(61)];expect(AIPlannerRequestSchema.safeParse(longKeyword).success).toBe(false);});
});
