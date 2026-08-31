import { guardRegistry } from '../../guards/registry';
import { isModuleType, moduleRegistry } from '../../modules/registry';
import { createId } from '../../project/id';
import type { Project } from '../../project/schema';
import { validateProjectRuntime } from '../../project/validation/validateProjectRuntime';
import { templateRegistry, type TemplateId } from '../../templates/registry';
import { toolRegistry } from '../../tools/registry';
import { AIActionSchema, type AIAction } from '../schema/AIActionSchema';
import { AIPlanSchema } from '../schema/AIPlanSchema';

const objectConfig = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};

function applyAction(project: Project, rawAction: unknown): void {
  const action: AIAction = AIActionSchema.parse(rawAction);
  switch (action.type) {
    case 'create_from_template': {
      const blueprint = templateRegistry[action.payload.templateId as TemplateId];
      if (!blueprint) throw new Error(`Unknown template: ${action.payload.templateId}`);
      const next = blueprint.createProject();
      project.metadata = structuredClone(next.metadata);
      project.theme = structuredClone(next.theme);
      project.navigation = structuredClone(next.navigation);
      project.modules = structuredClone(next.modules);
      project.tools = structuredClone(next.tools);
      project.guards = structuredClone(next.guards);
      return;
    }
    case 'set_metadata':
      project.metadata = { ...project.metadata, ...action.payload };
      return;
    case 'set_theme':
      project.theme = { ...project.theme, ...action.payload };
      return;
    case 'add_module': {
      if (!isModuleType(action.payload.moduleType)) throw new Error(`Unknown module: ${action.payload.moduleType}`);
      if (project.modules.some((item) => item.type === action.payload.moduleType)) return;
      const definition = moduleRegistry[action.payload.moduleType];
      project.modules.push({
        id: createId(action.payload.moduleType), type: action.payload.moduleType, version: definition.version,
        enabled: true, order: project.modules.length, config: definition.createDefaultConfig(),
      });
      return;
    }
    case 'remove_module': {
      if (!isModuleType(action.payload.moduleType)) throw new Error(`Unknown module: ${action.payload.moduleType}`);
      project.modules = project.modules.filter((item) => item.type !== action.payload.moduleType).map((item, order) => ({ ...item, order }));
      return;
    }
    case 'set_module_enabled': {
      if (!isModuleType(action.payload.moduleType)) throw new Error(`Unknown module: ${action.payload.moduleType}`);
      const module = project.modules.find((item) => item.type === action.payload.moduleType);
      if (!module) throw new Error(`Module is not installed: ${action.payload.moduleType}`);
      module.enabled = action.payload.enabled;
      return;
    }
    case 'patch_module_config': {
      if (!isModuleType(action.payload.moduleType)) throw new Error(`Unknown module: ${action.payload.moduleType}`);
      const module = project.modules.find((item) => item.type === action.payload.moduleType);
      if (!module) throw new Error(`Module is not installed: ${action.payload.moduleType}`);
      const definition = moduleRegistry[action.payload.moduleType];
      const parsed = definition.ConfigSchema.safeParse({ ...objectConfig(module.config), ...action.payload.patch });
      if (!parsed.success) throw new Error(`Invalid config for module: ${action.payload.moduleType}`);
      module.config = parsed.data;
      return;
    }
    case 'reorder_module': {
      if (!isModuleType(action.payload.moduleType)) throw new Error(`Unknown module: ${action.payload.moduleType}`);
      const sorted = [...project.modules].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((item) => item.type === action.payload.moduleType);
      if (index < 0) throw new Error(`Module is not installed: ${action.payload.moduleType}`);
      const [module] = sorted.splice(index, 1);
      sorted.splice(Math.min(action.payload.order, sorted.length), 0, module);
      project.modules = sorted.map((item, order) => ({ ...item, order }));
      return;
    }
    case 'set_tool_enabled': {
      const definition = toolRegistry[action.payload.toolType as keyof typeof toolRegistry];
      if (!definition) throw new Error(`Unknown tool: ${action.payload.toolType}`);
      let tool = project.tools.find((item) => item.type === action.payload.toolType);
      if (!tool && action.payload.enabled) {
        tool = { id: createId(action.payload.toolType), type: action.payload.toolType, enabled: true, config: definition.createDefaultConfig() };
        project.tools.push(tool);
      }
      if (tool) tool.enabled = action.payload.enabled;
      return;
    }
    case 'patch_tool_config': {
      const definition = toolRegistry[action.payload.toolType as keyof typeof toolRegistry];
      if (!definition) throw new Error(`Unknown tool: ${action.payload.toolType}`);
      let tool = project.tools.find((item) => item.type === action.payload.toolType);
      if (!tool) {
        tool = { id: createId(action.payload.toolType), type: action.payload.toolType, enabled: true, config: definition.createDefaultConfig() };
        project.tools.push(tool);
      }
      const parsed = definition.ConfigSchema.safeParse({ ...objectConfig(tool.config), ...action.payload.patch });
      if (!parsed.success) throw new Error(`Invalid config for tool: ${action.payload.toolType}`);
      tool.config = parsed.data;
      return;
    }
    case 'set_guard_enabled': {
      const definition = guardRegistry[action.payload.guardType as keyof typeof guardRegistry];
      if (!definition) throw new Error(`Unknown guard: ${action.payload.guardType}`);
      let guard = project.guards.find((item) => item.type === action.payload.guardType);
      if (!guard && action.payload.enabled) {
        guard = { id: createId(action.payload.guardType), type: action.payload.guardType, enabled: true, scope: 'app', config: definition.createDefaultConfig() };
        project.guards.push(guard);
      }
      if (guard) guard.enabled = action.payload.enabled;
      return;
    }
    case 'patch_guard_config': {
      const definition = guardRegistry[action.payload.guardType as keyof typeof guardRegistry];
      if (!definition) throw new Error(`Unknown guard: ${action.payload.guardType}`);
      let guard = project.guards.find((item) => item.type === action.payload.guardType);
      if (!guard) {
        guard = { id: createId(action.payload.guardType), type: action.payload.guardType, enabled: true, scope: 'app', config: definition.createDefaultConfig() };
        project.guards.push(guard);
      }
      const parsed = definition.ConfigSchema.safeParse({ ...objectConfig(guard.config), ...action.payload.patch });
      if (!parsed.success) throw new Error(`Invalid config for guard: ${action.payload.guardType}`);
      guard.config = parsed.data;
      return;
    }
  }
}

export function applyAIPlan(current: Project, rawPlan: unknown): Project {
  const plan = AIPlanSchema.parse(rawPlan);
  const working = structuredClone(current);
  for (const rawAction of plan.actions) applyAction(working, rawAction);
  const validated = validateProjectRuntime(working).project;
  if (JSON.stringify(validated) === JSON.stringify(current)) return current;
  validated.draftRevision = current.draftRevision + 1;
  return validateProjectRuntime(validated).project;
}
