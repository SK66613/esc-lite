import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../project/defaults';
import { publishProject } from '../../project/operations';
import { applyAIPlan } from './applyAIPlan';

const plan = (actions: unknown[]) => ({ id: 'plan-1', userIntent: 'test', summary: 'Test plan', explanation: '', actions, missingInformation: [], suggestedQuestions: [], riskLevel: 'low' });

describe('applyAIPlan', () => {
  it('applies a valid config patch atomically', () => {
    const project = createDefaultProject();
    const next = applyAIPlan(project, plan([{ type: 'patch_module_config', payload: { moduleType: 'loyalty_passport', patch: { goal: 9, reward: 'Подарок' } } }]));
    expect(next.draftRevision).toBe(project.draftRevision + 1);
    expect(next.modules.find((item) => item.type === 'loyalty_passport')?.config).toMatchObject({ goal: 9, reward: 'Подарок' });
  });
  it('rejects unknown capabilities', () => {
    const project = createDefaultProject();
    expect(() => applyAIPlan(project, plan([{ type: 'add_module', payload: { moduleType: 'booking' } }]))).toThrow(/Unknown module/);
    expect(project.modules.some((item) => item.type === 'booking')).toBe(false);
  });
  it('rejects an invalid patch without mutating the original project', () => {
    const project = createDefaultProject();
    const before = JSON.stringify(project);
    expect(() => applyAIPlan(project, plan([{ type: 'patch_module_config', payload: { moduleType: 'loyalty_passport', patch: { goal: 999 } } }]))).toThrow(/Invalid config/);
    expect(JSON.stringify(project)).toBe(before);
  });
  it('preserves project identity and published snapshot', () => {
    const project = publishProject(createDefaultProject(), new Date('2026-08-31T00:00:00Z'));
    const published = structuredClone(project.published);
    const next = applyAIPlan(project, plan([{ type: 'create_from_template', payload: { templateId: 'beauty_salon' } }]));
    expect(next.id).toBe(project.id);
    expect(next.published).toEqual(published);
    expect(next.metadata.name).toBe('Beauty Space');
  });
  it('increments revision once for a multi-action plan', () => {
    const project = createDefaultProject();
    const next = applyAIPlan(project, plan([{ type: 'set_metadata', payload: { name: 'Coffee 13' } }, { type: 'set_theme', payload: { primaryColor: '#111111' } }, { type: 'set_tool_enabled', payload: { toolType: 'qr_sales', enabled: true } }]));
    expect(next.draftRevision).toBe(project.draftRevision + 1);
  });
  it('returns the original project for a no-op plan', () => {
    const project = createDefaultProject();
    const next = applyAIPlan(project, plan([]));
    expect(next).toBe(project);
    expect(next.draftRevision).toBe(project.draftRevision);
  });
});
