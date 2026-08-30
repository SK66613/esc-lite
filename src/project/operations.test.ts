import { describe, expect, it } from 'vitest';
import { createDefaultProject } from './defaults';
import { applyProjectBlueprint, publishProject, reorderModules, reorderProjectModules, updateProjectModuleConfig } from './operations';

describe('project operations', () => {
  it('publishes a detached snapshot at the current revision', () => {
    const project = createDefaultProject();
    const published = publishProject(project, new Date('2026-08-30T12:00:00Z'));
    expect(published.published?.revision).toBe(project.draftRevision);
    expect(published.published?.snapshot).not.toBe(project);
    project.metadata.name = 'Changed later';
    expect(published.published?.snapshot.metadata.name).not.toBe('Changed later');
  });
  it('reorders without losing modules or configs', () => {
    const modules = createDefaultProject().modules;
    const configs = modules.map((module) => module.config);
    const reordered = reorderModules(modules, modules[0].id, modules[1].id);
    expect(reordered.map((module) => module.id)).toEqual([modules[1].id, modules[0].id]);
    expect(reordered.map((module) => module.config)).toEqual([configs[1], configs[0]]);
  });
  it('rejects invalid module config and accepts a default reset', () => {
    const project = createDefaultProject();
    const id = project.modules[0].id;
    expect(updateProjectModuleConfig(project, id, { goal: -1 })).toBe(project);
    const broken = structuredClone(project);
    broken.modules[0].config = { broken: true };
    const reset = updateProjectModuleConfig(broken, id, createDefaultProject().modules[0].config);
    expect(reset).not.toBe(broken);
    expect(reset.draftRevision).toBe(broken.draftRevision + 1);
  });
  it('does not revise a no-op reorder', () => {
    const project = createDefaultProject();
    const result = reorderProjectModules(project, project.modules[0].id, project.modules[0].id);
    expect(result).toBe(project);
    expect(result.draftRevision).toBe(project.draftRevision);
  });
  it('applies a template while retaining identity and publication', () => {
    const published = publishProject(createDefaultProject(), new Date('2026-08-30T12:00:00Z'));
    const publication = structuredClone(published.published);
    const blueprint = createDefaultProject();
    blueprint.modules = [blueprint.modules[1]];
    const result = applyProjectBlueprint(published, blueprint);
    expect(result.id).toBe(published.id);
    expect(result.published).toEqual(publication);
    expect(result.draftRevision).toBe(published.draftRevision + 1);
    expect(result.modules.map((module) => module.type)).toEqual(['offers_placeholder']);
  });
});
