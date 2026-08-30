import { guardRegistry } from '../../guards/registry';
import { isModuleType, moduleRegistry } from '../../modules/registry';
import { toolRegistry } from '../../tools/registry';
import { ProjectSchema, type Project } from '../schema';

export interface ProjectValidationResult { project: Project; warnings: string[] }

/** Validate the generic envelope, then repair malformed known registry entities. */
export function validateProjectRuntime(input: unknown): ProjectValidationResult {
  const project = ProjectSchema.parse(input);
  const warnings: string[] = [];
  project.modules = project.modules.map((module) => {
    if (!isModuleType(module.type)) return module;
    const definition = moduleRegistry[module.type];
    const parsed = definition.ConfigSchema.safeParse(module.config);
    if (parsed.success && module.version === definition.version) return { ...module, config: parsed.data };
    warnings.push(`Модуль ${module.id}: настройки или версия восстановлены`);
    return { ...module, version: definition.version, config: structuredClone(definition.createDefaultConfig()) };
  });
  project.tools = project.tools.map((tool) => {
    const definition = toolRegistry[tool.type as keyof typeof toolRegistry];
    if (!definition) return tool;
    const parsed = definition.ConfigSchema.safeParse(tool.config);
    if (parsed.success) return { ...tool, config: parsed.data };
    warnings.push(`Инструмент ${tool.id}: настройки восстановлены`);
    return { ...tool, config: structuredClone(definition.createDefaultConfig()) };
  });
  project.guards = project.guards.map((guard) => {
    const definition = guardRegistry[guard.type as keyof typeof guardRegistry];
    if (!definition) return guard;
    const parsed = definition.ConfigSchema.safeParse(guard.config);
    if (parsed.success) return { ...guard, config: parsed.data };
    warnings.push(`Guard ${guard.id}: настройки восстановлены`);
    return { ...guard, config: structuredClone(definition.createDefaultConfig()) };
  });
  return { project, warnings };
}
