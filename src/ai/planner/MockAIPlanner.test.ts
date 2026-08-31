import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../../project/defaults';
import { buildCapabilityManifest } from '../capabilities/buildCapabilityManifest';
import { MockAIPlanner } from './MockAIPlanner';

const planner = new MockAIPlanner();
const input = (message: string) => ({ message, project: createDefaultProject(), capabilities: buildCapabilityManifest() });

describe('MockAIPlanner', () => {
  it('builds a coffee proposal from natural language', async () => {
    const plan = await planner.plan(input('Сделай приложение кофейни. Каждый 6 кофе бесплатно. Добавь QR.'));
    expect(plan.actions).toContainEqual({ type: 'create_from_template', payload: { templateId: 'coffee_house' } });
    expect(plan.actions.some((action) => action.type === 'patch_module_config')).toBe(true);
    expect(plan.actions).toContainEqual({ type: 'set_tool_enabled', payload: { toolType: 'qr_sales', enabled: true } });
  });
  it('does not invent Booking', async () => {
    const plan = await planner.plan(input('Добавь онлайн-запись'));
    expect(plan.actions.some((action) => 'payload' in action && 'moduleType' in action.payload && action.payload.moduleType === 'booking')).toBe(false);
    expect(plan.missingInformation.join(' ')).toContain('Онлайн-запись');
  });
  it('can change an existing app name without recreating it', async () => {
    const plan = await planner.plan(input('Сделай название Barber Club'));
    expect(plan.actions).toEqual([{ type: 'set_metadata', payload: { name: 'Barber Club' } }]);
  });
});
