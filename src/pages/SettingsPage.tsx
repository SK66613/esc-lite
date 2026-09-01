import { RotateCcw } from 'lucide-react';
import { useEditorStore } from '../app/editorStore';
import { useProjectStore } from '../project/store';
import { Button } from '../ui/Button';
import { useState } from 'react';

type Health = { ok: boolean; aiConfigured: boolean; telegramAuthConfigured: boolean };

export function SettingsPage() {
  const setRoute = useEditorStore((state) => state.setRoute);
  const { project, updateProjectDetails, reset } = useProjectStore();
  const [health, setHealth] = useState<Health | 'error'>();
  const [checking, setChecking] = useState(false);
  const checkAI = async () => {
    setChecking(true);
    try { const response = await fetch('/api/health', { headers:{ accept:'application/json' } }); setHealth(response.ok ? await response.json() as Health : 'error'); }
    catch { setHealth('error'); } finally { setChecking(false); }
  };
  const updateMetadata = (patch: Partial<typeof project.metadata>) =>
    updateProjectDetails({ metadata: { ...project.metadata, ...patch }, theme: project.theme });
  const updateTheme = (patch: Partial<typeof project.theme>) =>
    updateProjectDetails({ metadata: project.metadata, theme: { ...project.theme, ...patch } });
  return <div className="page narrow"><div className="page-title"><div><span className="eyebrow">Workspace & project</span><h1>Настройки</h1></div></div><div className="settings-panel">
    <label>Название проекта<input value={project.metadata.name} onChange={(event) => updateMetadata({ name: event.target.value })} /></label>
    <label>Категория<input value={project.metadata.category ?? ''} onChange={(event) => updateMetadata({ category: event.target.value })} /></label>
    <label>Основной цвет<input type="color" value={project.theme.primaryColor ?? '#2563eb'} onChange={(event) => updateTheme({ primaryColor: event.target.value })} /></label>
    <div className="danger-zone"><h3>Статус AI</h3><p>Проверка подключения не отправляет запрос AI и не расходует токены.</p>
      {health && <p>{health === 'error' ? 'AI backend: ошибка подключения' : `AI подключён: ${health.aiConfigured ? 'да' : 'нет'} · Telegram подтверждён: ${health.telegramAuthConfigured ? 'да' : 'нет'}`}</p>}
      <Button variant="secondary" disabled={checking} onClick={checkAI}>{checking ? 'Проверяем…' : 'Проверить AI'}</Button>
    </div>
    <div className="danger-zone"><h3>Ручной редактор</h3><p>Расширенный режим для точной настройки состава и параметров приложения.</p><Button variant="secondary" onClick={() => setRoute('builder')}>Открыть ручной редактор</Button></div>
    <div className="danger-zone"><h3>Локальное демо</h3><p>Удалит v2 проект и legacy state, затем создаст Coffee House.</p><Button variant="danger" onClick={() => confirm('Сбросить локальное демо?') && reset()}><RotateCcw /> Сбросить демо</Button></div>
  </div></div>;
}
