import type { CSSProperties } from 'react';
import type { Project, ProjectSnapshot } from '../project/schema';
import { isModuleType, moduleRegistry } from '../modules/registry';
import { ModuleErrorBoundary } from '../modules/ModuleErrorBoundary';
import { Button } from '../ui/Button';

export function MiniAppPreview({ project, onResetModule }: {
  project: Project | ProjectSnapshot;
  onResetModule?: (id: string) => void;
}) {
  return <div className="miniapp" style={{ '--client-primary': project.theme.primaryColor ?? '#2563eb' } as CSSProperties}>
    <header><span>{project.metadata.name}</span><small>Mini App preview</small></header>
    <main>{[...project.modules].sort((a, b) => a.order - b.order).filter((module) => module.enabled).map((module) => {
      if (!isModuleType(module.type)) return null;
      const definition = moduleRegistry[module.type];
      const parsed = definition.ConfigSchema.safeParse(module.config);
      const reset = () => onResetModule?.(module.id);
      if (!parsed.success) return <div className="module-error" key={module.id}><strong>Конфигурация модуля повреждена</strong>{onResetModule && <Button variant="secondary" onClick={reset}>Восстановить настройки по умолчанию</Button>}</div>;
      return <ModuleErrorBoundary key={module.id} resetKey={JSON.stringify(parsed.data)} onReset={reset}><definition.PreviewComponent config={parsed.data} /></ModuleErrorBoundary>;
    })}</main>
  </div>;
}
