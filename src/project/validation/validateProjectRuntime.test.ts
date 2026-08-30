import { describe, expect, it } from 'vitest';
import { createDefaultProject } from '../defaults';
import { validateProjectRuntime } from './validateProjectRuntime';

describe('registry-aware project validation', () => {
  it('repairs an invalid known module without destroying the project', () => {
    const project = createDefaultProject();
    project.metadata.name = 'Keep me';
    project.modules[0].config = { goal: -100 };
    const result = validateProjectRuntime(project);
    expect(result.project.metadata.name).toBe('Keep me');
    expect(result.project.modules).toHaveLength(2);
    expect(result.warnings).toHaveLength(1);
  });
  it('retains an unknown future module', () => {
    const project = createDefaultProject();
    project.modules.push({ id: 'future', type: 'future_module', version: 7, enabled: true, order: 2, config: { future: true } });
    expect(validateProjectRuntime(project).project.modules.at(-1)?.config).toEqual({ future: true });
  });
});
