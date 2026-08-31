import { guardRegistry } from '../../guards/registry';
import { isModuleType, moduleRegistry } from '../../modules/registry';
import { createId } from '../../project/id';
import { ProjectSchema, type Project } from '../../project/schema';
import { validateProjectRuntime } from '../../project/validation/validateProjectRuntime';
import { templateRegistry, type TemplateId } from '../../templates/registry';
import { toolRegistry } from '../../tools/registry';
import { AIActionSchema, type AIAction } from '../schema/AIActionSchema';
import { AIPlanSchema, type AIPlan } from '../schema/AIPlanSchema';

export class AIExecutionError extends Error { constructor(message:string){super(message);this.name='AIExecutionError'} }
const fail=(message:string):never=>{throw new AIExecutionError(message)};
const toolDefinition=(type:string)=>toolRegistry[type as keyof typeof toolRegistry]??fail(`Unknown tool type: ${type}`);
const guardDefinition=(type:string)=>guardRegistry[type as keyof typeof guardRegistry]??fail(`Unknown guard type: ${type}`);
const moduleDefinition=(type:string)=>isModuleType(type)?moduleRegistry[type]:fail(`Unknown module type: ${type}`);
const templateDefinition=(id:string)=>templateRegistry[id as TemplateId]??fail(`Unknown template: ${id}`);
const merge=(current:unknown,patch:Record<string,unknown>)=>({...((current&&typeof current==='object'&&!Array.isArray(current))?current:{}),...patch});

function applyAction(project:Project,unsafe:unknown):Project {
 const action:AIAction=AIActionSchema.parse(unsafe);
 switch(action.type){
  case 'create_from_template': {const blueprint=templateDefinition(action.payload.templateId).createProject();return {...project,metadata:structuredClone(blueprint.metadata),theme:structuredClone(blueprint.theme),navigation:structuredClone(blueprint.navigation),modules:structuredClone(blueprint.modules),tools:structuredClone(blueprint.tools),guards:structuredClone(blueprint.guards)};}
  case 'set_metadata': return {...project,metadata:{...project.metadata,...action.payload}};
  case 'set_theme': return {...project,theme:{...project.theme,...action.payload}};
  case 'add_module': {const d=moduleDefinition(action.payload.moduleType);if(project.modules.some(m=>m.type===d.type))return project;return {...project,modules:[...project.modules,{id:createId(d.type),type:d.type,version:d.version,enabled:true,order:project.modules.length,config:d.ConfigSchema.parse(d.createDefaultConfig())}]};}
  case 'remove_module': moduleDefinition(action.payload.moduleType);return {...project,modules:project.modules.filter(m=>m.type!==action.payload.moduleType).map((m,order)=>({...m,order}))};
  case 'set_module_enabled': moduleDefinition(action.payload.moduleType);return {...project,modules:project.modules.map(m=>m.type===action.payload.moduleType?{...m,enabled:action.payload.enabled}:m)};
  case 'patch_module_config': {const d=moduleDefinition(action.payload.moduleType);const found=project.modules.some(m=>m.type===d.type);if(!found)fail(`Module is not present: ${d.type}`);return {...project,modules:project.modules.map(m=>m.type===d.type?{...m,config:d.ConfigSchema.parse(merge(m.config,action.payload.patch))}:m)};}
  case 'reorder_module': {moduleDefinition(action.payload.moduleType);const sorted=[...project.modules].sort((a,b)=>a.order-b.order);const from=sorted.findIndex(m=>m.type===action.payload.moduleType);if(from<0)fail(`Module is not present: ${action.payload.moduleType}`);const [item]=sorted.splice(from,1);sorted.splice(Math.min(action.payload.toIndex,sorted.length),0,item);return {...project,modules:sorted.map((m,order)=>({...m,order}))};}
  case 'set_tool_enabled': {const d=toolDefinition(action.payload.toolType);const exists=project.tools.some(t=>t.type===d.type);return {...project,tools:exists?project.tools.map(t=>t.type===d.type?{...t,enabled:action.payload.enabled}:t):[...project.tools,{id:createId(d.type),type:d.type,enabled:action.payload.enabled,config:d.ConfigSchema.parse(d.createDefaultConfig())}]};}
  case 'patch_tool_config': {const d=toolDefinition(action.payload.toolType);if(!project.tools.some(t=>t.type===d.type))fail(`Tool is not present: ${d.type}`);return {...project,tools:project.tools.map(t=>t.type===d.type?{...t,config:d.ConfigSchema.parse(merge(t.config,action.payload.patch))}:t)};}
  case 'set_guard_enabled': {const d=guardDefinition(action.payload.guardType);const exists=project.guards.some(g=>g.type===d.type);return {...project,guards:exists?project.guards.map(g=>g.type===d.type?{...g,enabled:action.payload.enabled}:g):[...project.guards,{id:createId(d.type),type:d.type,enabled:action.payload.enabled,scope:'app',config:d.ConfigSchema.parse(d.createDefaultConfig())}]};}
  case 'patch_guard_config': {const d=guardDefinition(action.payload.guardType);if(!project.guards.some(g=>g.type===d.type))fail(`Guard is not present: ${d.type}`);return {...project,guards:project.guards.map(g=>g.type===d.type?{...g,config:d.ConfigSchema.parse(merge(g.config,action.payload.patch))}:g)};}
 }
}
const content=(p:Project)=>JSON.stringify({metadata:p.metadata,theme:p.theme,navigation:p.navigation,modules:p.modules,tools:p.tools,guards:p.guards});
export function applyAIPlan(current:Project,untrustedPlan:unknown):Project {
 const plan:AIPlan=AIPlanSchema.parse(untrustedPlan); let next:Project=structuredClone(current);
 for(const action of plan.actions) next=applyAction(next,action);
 if(content(next)===content(current))return current;
 next={...next,id:current.id,published:current.published,draftRevision:current.draftRevision+1};
 return validateProjectRuntime(ProjectSchema.parse(next)).project;
}
