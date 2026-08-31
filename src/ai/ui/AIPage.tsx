import { RotateCcw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useEditorStore } from '../../app/editorStore';
import { createId } from '../../project/id';
import type { Project } from '../../project/schema';
import { useProjectStore } from '../../project/store';
import { Button } from '../../ui/Button';
import { buildCapabilityManifest } from '../capabilities/buildCapabilityManifest';
import { aiPlanner } from '../planner';
import type { AIPlan } from '../schema/AIPlanSchema';
import { AIChat } from './AIChat';
import { AIComposer } from './AIComposer';
import type { AIConversationMessage } from './AIMessage';
import { AIPlanCard } from './AIPlanCard';
import '../../styles/ai.css';

const assistantMessage = (text: string): AIConversationMessage => ({ id: createId('ai-message'), role: 'assistant', text });
const userMessage = (text: string): AIConversationMessage => ({ id: createId('ai-message'), role: 'user', text });

export function AIPage() {
  const { project, applyAIPlan, restoreDraft } = useProjectStore();
  const setRoute = useEditorStore((state) => state.setRoute);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<AIPlan | null>(null);
  const [undoProject, setUndoProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<AIConversationMessage[]>(() => [assistantMessage('Расскажите о своём бизнесе и что должно быть в Mini App. Я соберу доступные части приложения и сначала покажу план.')]);

  const submit = async () => {
    const message = input.trim();
    if (!message || loading) return;
    setMessages((items) => [...items, userMessage(message)]);
    setInput('');
    setPlan(null);
    setLoading(true);
    try {
      const nextPlan = await aiPlanner.plan({ message, project, capabilities: buildCapabilityManifest() });
      setPlan(nextPlan);
      setMessages((items) => [...items, assistantMessage(nextPlan.summary)]);
    } catch (error) {
      setMessages((items) => [...items, assistantMessage(error instanceof Error ? `Не удалось подготовить план: ${error.message}` : 'Не удалось подготовить план.')]);
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!plan) return;
    const before = structuredClone(project);
    const result = applyAIPlan(plan);
    if (!result.ok) {
      setMessages((items) => [...items, assistantMessage(`Не удалось применить изменения: ${result.error ?? 'неизвестная ошибка'}`)]);
      return;
    }
    setUndoProject(before);
    setPlan(null);
    setMessages((items) => [...items, assistantMessage('Готово. Я обновил приложение. Можно открыть Preview или продолжить изменения.')]);
  };

  const undo = () => {
    if (!undoProject) return;
    restoreDraft(undoProject);
    setUndoProject(null);
    setMessages((items) => [...items, assistantMessage('Последнее изменение AI отменено.')]);
  };

  return <div className="page ai-page"><div className="ai-heading"><div><span className="eyebrow">AI Composer</span><h1><Sparkles /> Создадим ваше приложение</h1><p>Опишите результат обычными словами. AI использует только возможности, которые реально есть в Escalita.</p></div><div className="ai-heading-actions"><Button variant="secondary" onClick={() => setRoute('preview')}>Открыть Preview</Button>{undoProject && <Button variant="ghost" onClick={undo}><RotateCcw /> Отменить последнее</Button>}</div></div><div className="ai-workspace"><section><AIChat messages={messages} loading={loading} />{plan && <AIPlanCard plan={plan} onApply={apply} onCancel={() => setPlan(null)} />}<AIComposer value={input} onChange={setInput} onSubmit={submit} disabled={loading} /></section><aside className="ai-help"><strong>Попробуйте написать</strong><button onClick={() => setInput('Сделай приложение кофейни. Каждый 6 кофе бесплатно. Добавь QR.')}>Кофейня с бонусами и QR</button><button onClick={() => setInput('Сделай приложение салона красоты')}>Приложение салона красоты</button><button onClick={() => setInput('Сделай название Barber Club')}>Поменять название</button><small>Booking и полноценный Shop пока не добавлены — AI честно сообщит об этом вместо выдуманного функционала.</small></aside></div></div>;
}
