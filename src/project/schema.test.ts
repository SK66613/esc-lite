import { describe,expect,it } from 'vitest';import { ProjectSchema } from './schema';import { createDefaultProject } from './defaults';
describe('ProjectSchema',()=>{it('accepts the default project',()=>expect(ProjectSchema.safeParse(createDefaultProject()).success).toBe(true))});
