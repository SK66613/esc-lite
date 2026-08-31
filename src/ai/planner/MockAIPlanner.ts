import { createId } from '../../project/id';
import { AIPlanSchema, type AIPlan } from '../schema/AIPlanSchema';
import type { AIAction } from '../schema/AIActionSchema';
import type { AIPlanner, AIPlannerInput } from './AIPlanner';

const includesAny = (text: string, parts: string[]) => parts.some((part) => text.includes(part));

export class MockAIPlanner implements AIPlanner {
  async plan(input: AIPlannerInput): Promise<AIPlan> {
    const message = input.message.trim();
    const text = message.toLowerCase();
    const actions: AIAction[] = [];
    const missingInformation: string[] = [];
    const suggestedQuestions: string[] = [];
    const availableModule = (type: string) => input.capabilities.modules.some((item) => item.type === type);
    const availableTool = (type: string) => input.capabilities.tools.some((item) => item.type === type);
    const availableTemplate = (id: string) => input.capabilities.templates.some((item) => item.id === id);
    const wantsNewApp = includesAny(text, ['сделай приложение', 'создай приложение', 'собери приложение', 'сделай mini', 'создай mini', 'сделай мини', 'создай мини']);

    let selectedTemplate: string | undefined;
    if (includesAny(text, ['кофейн', 'кофейня']) && availableTemplate('coffee_house')) selectedTemplate = 'coffee_house';
    else if (includesAny(text, ['салон красоты', 'beauty', 'маникюр']) && availableTemplate('beauty_salon')) selectedTemplate = 'beauty_salon';
    else if (includesAny(text, ['ресторан', 'кафе']) && availableTemplate('restaurant')) selectedTemplate = 'restaurant';
    else if (wantsNewApp && includesAny(text, ['магазин', 'store']) && availableTemplate('store')) selectedTemplate = 'store';

    if (selectedTemplate && (wantsNewApp || actions.length === 0)) {
      actions.push({ type: 'create_from_template', payload: { templateId: selectedTemplate } });
    }

    const rewardNumber = text.match(/\b(\d{1,2})\b/)?.[1];
    const wantsLoyalty = includesAny(text, ['бесплатн', 'лояльн', 'бонус', 'каждый']) && includesAny(text, ['коф', 'визит', 'покуп']);
    if (wantsLoyalty && availableModule('loyalty_passport')) {
      const templateWillHaveLoyalty = selectedTemplate === 'coffee_house' || selectedTemplate === 'beauty_salon' || selectedTemplate === 'restaurant';
      const projectHasLoyalty = input.project.modules.some((item) => item.type === 'loyalty_passport');
      if (!templateWillHaveLoyalty && !projectHasLoyalty) actions.push({ type: 'add_module', payload: { moduleType: 'loyalty_passport' } });
      actions.push({
        type: 'patch_module_config',
        payload: {
          moduleType: 'loyalty_passport',
          patch: {
            ...(rewardNumber ? { goal: Math.max(1, Math.min(30, Number(rewardNumber))) } : {}),
            ...(includesAny(text, ['коф']) && text.includes('бесплат') ? { reward: 'Бесплатный кофе' } : {}),
          },
        },
      });
    }

    if (includesAny(text, ['qr', 'куар', 'кьюар']) && availableTool('qr_sales')) {
      actions.push({ type: 'set_tool_enabled', payload: { toolType: 'qr_sales', enabled: true } });
    }

    if (includesAny(text, ['убери акции', 'удали акции', 'выключи акции', 'убери предложения']) && availableModule('offers_placeholder')) {
      if (input.project.modules.some((item) => item.type === 'offers_placeholder') || selectedTemplate) {
        actions.push({ type: 'set_module_enabled', payload: { moduleType: 'offers_placeholder', enabled: false } });
      }
    }

    const nameMatch = message.match(/(?:сделай\s+)?названи[ея]\s+(?:на\s+)?[«"]?([^»"\n]+)[»"]?$/i) ?? message.match(/назови\s+(?:приложение\s+)?[«"]?([^»"\n]+)[»"]?$/i);
    if (nameMatch?.[1]?.trim()) {
      actions.push({ type: 'set_metadata', payload: { name: nameMatch[1].trim() } });
    }

    const color = message.match(/#[0-9a-fA-F]{6}/)?.[0];
    if (color) actions.push({ type: 'set_theme', payload: { primaryColor: color } });

    if (includesAny(text, ['онлайн-запис', 'запись', 'booking', 'записаться'])) {
      missingInformation.push('Онлайн-запись пока недоступна в текущем наборе возможностей.');
      suggestedQuestions.push('Я могу пока настроить лояльность, акции и внешний вид приложения.');
    }

    const asksShopFeature = includesAny(text, ['корзин', 'каталог товаров', 'добавь магазин', 'shop']);
    if (asksShopFeature && !(wantsNewApp && selectedTemplate === 'store')) {
      missingInformation.push('Полноценный магазин пока недоступен в текущем наборе возможностей.');
      suggestedQuestions.push('Можно подготовить витрину предложений, пока Shop не подключён.');
    }

    const uniqueActions = actions.filter((action, index) => JSON.stringify(action) !== JSON.stringify(actions[index - 1]));
    const templateTitle = selectedTemplate ? input.capabilities.templates.find((item) => item.id === selectedTemplate)?.title : undefined;
    const summary = templateTitle
      ? `Соберу ${templateTitle} и применю ваши настройки`
      : uniqueActions.length
        ? 'Подготовил изменения для вашего Mini App'
        : missingInformation.length
          ? 'Часть запроса пока нельзя собрать автоматически'
          : 'Нужно чуть точнее описать желаемое изменение';

    return AIPlanSchema.parse({
      id: createId('ai-plan'),
      userIntent: message,
      summary,
      explanation: uniqueActions.length ? 'Изменения будут применены только после вашего подтверждения.' : 'Проект останется без изменений.',
      actions: uniqueActions,
      missingInformation,
      suggestedQuestions,
      riskLevel: selectedTemplate ? 'medium' : 'low',
    });
  }
}
