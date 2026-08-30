import type { ModuleInstance, Project, ProjectSnapshot } from './schema';
import { isModuleType, moduleRegistry } from '../modules/registry';
export const snapshotProject=(project:Project):ProjectSnapshot=>{const {published:_,...snapshot}=project;return structuredClone(snapshot)};
export const publishProject=(project:Project,now=new Date()):Project=>({...project,published:{revision:project.draftRevision,publishedAt:now.toISOString(),snapshot:snapshotProject(project)}});
export const reorderModules=(modules:ModuleInstance[],activeId:string,overId:string):ModuleInstance[]=>{const sorted=[...modules].sort((a,b)=>a.order-b.order);const from=sorted.findIndex(x=>x.id===activeId),to=sorted.findIndex(x=>x.id===overId);if(from<0||to<0||from===to)return modules;const [moved]=sorted.splice(from,1);sorted.splice(to,0,moved);return sorted.map((module,order)=>({...module,order}));};

export function reorderProjectModules(project: Project, activeId: string, overId: string): Project {
  const modules = reorderModules(project.modules, activeId, overId);
  return modules === project.modules ? project : { ...project, modules, draftRevision: project.draftRevision + 1 };
}

export function updateProjectModuleConfig(project: Project, id: string, config: unknown): Project {
  const module = project.modules.find((item) => item.id === id);
  if (!module || !isModuleType(module.type)) return project;
  const parsed = moduleRegistry[module.type].ConfigSchema.safeParse(config);
  if (!parsed.success) return project;
  return {
    ...project,
    modules: project.modules.map((item) => item.id === id ? { ...item, config: parsed.data } : item),
    draftRevision: project.draftRevision + 1,
  };
}

export function applyProjectBlueprint(current: Project, blueprint: Project): Project {
  return {
    ...current,
    metadata: structuredClone(blueprint.metadata), theme: structuredClone(blueprint.theme),
    navigation: structuredClone(blueprint.navigation), modules: structuredClone(blueprint.modules),
    guards: structuredClone(blueprint.guards), tools: structuredClone(blueprint.tools),
    draftRevision: current.draftRevision + 1,
  };
}
