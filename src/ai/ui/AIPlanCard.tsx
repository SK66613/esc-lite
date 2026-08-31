import { AlertTriangle, Check, X } from 'lucide-react';
import { moduleRegistry, isModuleType } from '../../modules/registry';
import { templateRegistry, type TemplateId } from '../../templates/registry';
import { toolRegistry } from '../../tools/registry';
import { guardRegistry } from '../../guards/registry';
import type { AIAction } from '../schema/AIActionSchema';
import type { AIPlan } from '../schema/AIPlanSchema';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';

const actionLabel = (action: AIAction): string => {
  switch (action.type) {
    case 'create_from_template': return `Возьму за основу ${templateRegistry[action.payload.templateId as TemplateId]?.title ?? 'подходящий шаблон'}`;
    case 'set_metadata': return action.payload.name ? `Поменяю название на «${action.payload.name}»` : 'Обновлю информацию о приложении';
    case 'set_theme': return 'Обновлю внешний вид приложения';
    case 'add_module': return isModuleType(action.payload.moduleType) ? `Добавлю: ${moduleRegistry[action.payload.moduleType].title}` : 'Добавлю новый раздел';
    case 'remove_module': return isModuleType(action.payload.moduleType) ? `Уберу: ${moduleRegistry[action.payload.moduleType].title}` : 'Уберу раздел';
    case 'set_module_enabled': return isModuleType(action.payload.moduleType) ? `${action.payload.enabled ? 'Включу' : 'Выключу'}: ${moduleRegistry[action.payload.moduleType].title}` : 'Изменю раздел';
    case 'patch_module_config': {
      if (action.payload.moduleType === 'loyalty_passport') {
        const goal = action.payload.patch.goal;
        const reward = action.payload.patch.reward;
        if (goal || reward) return `Настрою лояльность${goal ? `: цель ${String(goal)}` : ''}${reward ? ` → ${String(reward)}` : ''}`;
      }
      return isModuleType(action.payload.moduleType) ? `Настрою: ${moduleRegistry[action.payload.moduleType].title}` : 'Настрою раздел';
    }
    case 'reorder_module': return 'Изменю порядок разделов';
    case 'set_tool_enabled': return `${action.payload.enabled ? 'Включу' : 'Выключу'}: ${toolRegistry[action.payload.toolType as keyof typeof toolRegistry]?.title ?? 'бизнес-инструмент'}`;
    case 'patch_tool_config': return `Настрою: ${toolRegistry[action.payload.toolType as keyof typeof toolRegistry]?.title ?? 'бизнес-инструмент'}`;
    case 'set_guard_enabled': return `${action.payload.enabled ? 'Включу' : 'Выключу'} правило доступа: ${guardRegistry[action.payload.guardType as keyof typeof guardRegistry]?.title ?? 'доступ'}`;
    case 'patch_guard_config': return `Настрою доступ: ${guardRegistry[action.payload.guardType as keyof typeof guardRegistry]?.title ?? 'правило доступа'}`;
  }
};

export function AIPlanCard({ plan, onApply, onCancel }: { plan: AIPlan; onApply: () => void; onCancel: () => void }) {
  return <Card className="ai-plan-card"><span className="eyebrow">Предложение AI</span><h2>{plan.summary}</h2><p>{plan.explanation}</p>{plan.actions.length > 0 && <div className="ai-plan-list">{plan.actions.map((action, index) => <div key={`${action.type}-${index}`}><Check /><span>{actionLabel(action)}</span></div>)}</div>}{plan.missingInformation.map((item) => <div className="ai-warning" key={item}><AlertTriangle /><span>{item}</span></div>)}{plan.suggestedQuestions.length > 0 && <div className="ai-suggestions">{plan.suggestedQuestions.map((item) => <small key={item}>{item}</small>)}</div>}<div className="ai-plan-actions"><Button onClick={onApply} disabled={plan.actions.length === 0}><Check /> Применить</Button><Button variant="ghost" onClick={onCancel}><X /> Отменить</Button></div></Card>;
}
