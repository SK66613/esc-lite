import type { ModuleInstance } from '../project/schema';
import { isModuleType, moduleRegistry } from '../modules/registry';
import { ModuleErrorBoundary } from '../modules/ModuleErrorBoundary';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function ModuleInspector({ module, onChange, onReset }: {
  module?: ModuleInstance;
  onChange: (config: unknown) => void;
  onReset: () => void;
}) {
  if (!module || !isModuleType(module.type)) return <Card className="empty-state"><h3>Выберите модуль</h3><p>Инспектор настроек откроется здесь.</p></Card>;
  const definition = moduleRegistry[module.type];
  const parsed = definition.ConfigSchema.safeParse(module.config);
  if (!parsed.success) return <Card className="module-error"><strong>Конфигурация модуля повреждена</strong><p>Восстановите безопасные настройки этого модуля. Остальной проект не изменится.</p><Button variant="secondary" onClick={onReset}>Восстановить настройки по умолчанию</Button></Card>;
  return <Card className="inspector"><div className="section-heading"><div><span className="eyebrow">Инспектор</span><h2>{definition.title}</h2></div></div><ModuleErrorBoundary resetKey={JSON.stringify(parsed.data)} onReset={onReset}><definition.InspectorComponent config={parsed.data} onChange={onChange} /></ModuleErrorBoundary></Card>;
}
