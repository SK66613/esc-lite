import { Send, Sparkles } from 'lucide-react';
import { Button } from '../../ui/Button';

export function AIComposer({ value, onChange, onSubmit, disabled }: { value: string; onChange: (value: string) => void; onSubmit: () => void; disabled?: boolean }) {
  return <form className="ai-composer" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><div className="ai-composer-label"><Sparkles /><span>Опишите, что нужно сделать</span></div><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder="Например: у меня кофейня. Каждый 6 кофе бесплатно, нужны акции и QR." disabled={disabled} /><Button type="submit" disabled={disabled || !value.trim()}><Send /> {disabled ? 'Готовлю…' : 'Создать с AI'}</Button></form>;
}
