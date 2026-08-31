import { create } from 'zustand';
import { projectRepository } from './repository';
import type { GuardInstance, Project, ToolInstance } from './schema';
import { applyProjectBlueprint, publishProject, reorderProjectModules, updateProjectModuleConfig } from './operations';
import { createId } from './id';
import { moduleRegistry, type ModuleType } from '../modules/registry';
import { applyAIPlan as executeAIPlan } from '../ai/executor/applyAIPlan';

type ProjectDetails = Pick<Project, 'metadata' | 'theme'>;
interface ProjectStore {
  project: Project;
  applyBlueprint: (blueprint: Project) => void;
  updateProjectDetails: (details: ProjectDetails) => void;
  updateModuleConfig: (id: string, config: unknown) => boolean;
  resetModuleConfig: (id: string) => void;
  setModuleEnabled: (id: string, enabled: boolean) => void;
  addModule: (type: ModuleType) => void;
  deleteModule: (id: string) => void;
  reorderModules: (active: string, over: string) => void;
  updateTool: (tool: ToolInstance) => void;
  updateGuard: (guard: GuardInstance) => void;
  applyAIPlan: (plan: unknown) => { ok: boolean; error?: string };
  restoreDraft: (snapshot: Project) => void;
  publish: () => void;
  reset: () => void;
}

const save = (project: Project) => { projectRepository.saveProject(project); return project; };
export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: projectRepository.loadProject(),
  applyBlueprint: (blueprint) => set((state) => ({ project: save(applyProjectBlueprint(state.project, blueprint)) })),
  updateProjectDetails: (details) => set((state) => ({ project: save({ ...state.project, ...details, draftRevision: state.project.draftRevision + 1 }) })),
  updateModuleConfig: (id, config) => { const current = get().project; const next = updateProjectModuleConfig(current, id, config); if (next === current) return false; set({ project: save(next) }); return true; },
  resetModuleConfig: (id) => { const module = get().project.modules.find((item) => item.id === id); const definition = module && moduleRegistry[module.type as ModuleType]; if (definition) get().updateModuleConfig(id, definition.createDefaultConfig()); },
  setModuleEnabled: (id, enabled) => set((state) => { const module = state.project.modules.find((item) => item.id === id); if (!module || module.enabled === enabled) return state; return { project: save({ ...state.project, modules: state.project.modules.map((item) => item.id === id ? { ...item, enabled } : item), draftRevision: state.project.draftRevision + 1 }) }; }),
  addModule: (type) => set((state) => { const definition = moduleRegistry[type]; return { project: save({ ...state.project, modules: [...state.project.modules, { id: createId(type), type, version: definition.version, enabled: true, order: state.project.modules.length, config: definition.createDefaultConfig() }], draftRevision: state.project.draftRevision + 1 }) }; }),
  deleteModule: (id) => set((state) => { if (!state.project.modules.some((item) => item.id === id)) return state; return { project: save({ ...state.project, modules: state.project.modules.filter((item) => item.id !== id).map((item, order) => ({ ...item, order })), draftRevision: state.project.draftRevision + 1 }) }; }),
  reorderModules: (active, over) => set((state) => { const project = reorderProjectModules(state.project, active, over); return project === state.project ? state : { project: save(project) }; }),
  updateTool: (tool) => set((state) => ({ project: save({ ...state.project, tools: state.project.tools.map((item) => item.id === tool.id ? tool : item), draftRevision: state.project.draftRevision + 1 }) })),
  updateGuard: (guard) => set((state) => ({ project: save({ ...state.project, guards: state.project.guards.map((item) => item.id === guard.id ? guard : item), draftRevision: state.project.draftRevision + 1 }) })),
  applyAIPlan: (plan) => { const current = get().project; try { const next = executeAIPlan(current, plan); if (next !== current) set({ project: save(next) }); return { ok: true }; } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Invalid AI plan' }; } },
  restoreDraft: (snapshot) => set((state) => ({ project: save({ ...state.project, metadata: structuredClone(snapshot.metadata), theme: structuredClone(snapshot.theme), navigation: structuredClone(snapshot.navigation), modules: structuredClone(snapshot.modules), guards: structuredClone(snapshot.guards), tools: structuredClone(snapshot.tools), draftRevision: state.project.draftRevision + 1 }) })),
  publish: () => set((state) => ({ project: save(publishProject(state.project)) })),
  reset: () => set({ project: projectRepository.resetProject() }),
}));
