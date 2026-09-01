import { RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { useEditorStore } from '../app/editorStore';
import { useProjectStore } from '../project/store';
import { Button } from '../ui/Button';

type AIHealth={ok:boolean;aiConfigured:boolean;telegramAuthConfigured:boolean};

export function SettingsPage() {
  const setRoute = useEditorStore((state) => state.setRoute);
  const { project, updateProjectDetails, reset } = useProjectStore();
  const [health,setHealth]=useState<AIHealth>();
  const [checking,setChecking]=useState(false);
  const [healthError,setHealthError]=useState('');
  const updateMetadata = (patch: Partial<typeof project.metadata>) => updateProjectDetails({ metadata: { ...project.metadata, ...patch }, theme: project.theme });
  const updateTheme = (patch: Partial<typeof project.theme>) => updateProjectDetails({ metadata: project.metadata, theme: { ...project.theme, ...patch } });
  const checkAI=async()=>{setChecking(true);setHealthError('');try{const response=await fetch('/api/health',{headers:{accept:'application/json'},cache:'no-store'});const data=await response.json() as AIHealth;if(!response.ok||!data.ok)throw new Error();setHealth(data);}catch{setHealth(undefined);setHealthError('Не удалось проверить AI backend.');}finally{setChecking(false);}};
  return <div className="page narrow"><div className="page-title"><div><span className="eyebrow">Workspace & project</span><h1>Настройки</h1></div></div><div className="settings-panel">
    <label>Название проекта<input value={project.metadata.name} onChange={(event) => updateMetadata({ name: event.target.value })} /></label>
    <label>Категория<input value={project.metadata.category ?? ''} onChange={(event) => updateMetadata({ category: event.target.value })} /></label>
    <label>Основной цвет<input type="color" value={project.theme.primaryColor ?? '#2563eb'} onChange={(event) => updateTheme({ primaryColor: event.target.value })} /></label>
    <div><h3>AI status</h3><p className="hint">Проверка не расходует AI-токены.</p>{health&&<p>AI backend: <strong>{health.aiConfigured?'подключён':'не настроен'}</strong><br/>Telegram auth: <strong>{health.telegramAuthConfigured?'настроен':'не настроен'}</strong></p>}{healthError&&<p className="hint">{healthError}</p>}<Button variant="secondary" disabled={checking} onClick={checkAI}>{checking?'Проверяю…':'Проверить AI'}</Button></div>
    <div className="danger-zone"><h3>Ручной редактор</h3><p>Расширенный режим для точной настройки состава и параметров приложения.</p><Button variant="secondary" onClick={() => setRoute('builder')}>Открыть ручной редактор</Button></div>
    <div className="danger-zone"><h3>Локальное демо</h3><p>Удалит v2 проект и legacy state, затем создаст Coffee House.</p><Button variant="danger" onClick={() => confirm('Сбросить локальное демо?') && reset()}><RotateCcw /> Сбросить демо</Button></div>
  </div></div>;
}
