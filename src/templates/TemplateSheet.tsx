import { useProjectStore } from '../project/store';
import { useEditorStore } from '../app/editorStore';
import { Sheet } from '../ui/Sheet';
import { templateRegistry } from './registry';

export function TemplateSheet() {
  const applyBlueprint = useProjectStore((state) => state.applyBlueprint);
  const setSheet = useEditorStore((state) => state.setSheet);
  return <Sheet title="Применить шаблон" onClose={() => setSheet(undefined)}>
    <p className="sheet-description">Шаблон заменит структуру текущего черновика. Идентификатор проекта и уже опубликованная версия сохранятся.</p>
    <div className="template-grid">{Object.values(templateRegistry).map((template) =>
      <button key={template.id} onClick={() => {
        if (confirm(`Применить шаблон «${template.title}» к текущему черновику?`)) {
          applyBlueprint(template.createProject());
          setSheet(undefined);
        }
      }}><span className={`template-art ${template.id}`} /><span><strong>{template.title}</strong><small>{template.description}</small></span></button>
    )}</div>
  </Sheet>;
}
