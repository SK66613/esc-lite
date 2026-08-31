import { moduleRegistry } from '../../modules/registry';
import { toolRegistry } from '../../tools/registry';
import { guardRegistry } from '../../guards/registry';
import { templateRegistry } from '../../templates/registry';

export interface CapabilityManifest {
  modules: Array<{ type: string; title: string; description: string; version: number; defaultConfig: unknown; ai?: { purpose: string; examples?: string[]; keywords?: string[] } }>;
  tools: Array<{ type: string; title: string; description: string; defaultConfig: unknown }>;
  guards: Array<{ type: string; title: string; description: string; defaultConfig: unknown }>;
  templates: Array<{ id: string; title: string; description: string }>;
}

const jsonValue = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

export function buildCapabilityManifest(): CapabilityManifest {
  return {
    modules: Object.entries(moduleRegistry).map(([type, definition]) => ({
      type,
      title: definition.title,
      description: definition.description,
      version: definition.version,
      defaultConfig: jsonValue(definition.createDefaultConfig()),
      ...(definition.ai ? { ai: jsonValue(definition.ai) as CapabilityManifest['modules'][number]['ai'] } : {}),
    })),
    tools: Object.entries(toolRegistry).map(([type, definition]) => ({
      type,
      title: definition.title,
      description: definition.description,
      defaultConfig: jsonValue(definition.createDefaultConfig()),
    })),
    guards: Object.entries(guardRegistry).map(([type, definition]) => ({
      type,
      title: definition.title,
      description: definition.description,
      defaultConfig: jsonValue(definition.createDefaultConfig()),
    })),
    templates: Object.entries(templateRegistry).map(([id, definition]) => ({
      id,
      title: definition.title,
      description: definition.description,
    })),
  };
}
