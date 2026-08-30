import { Tag } from 'lucide-react';import type { OffersConfig } from './schema';
export function OffersPreview({config:c}:{config:OffersConfig}){return <article className="offers-preview"><Tag/><div><h3>{c.title}</h3><p>{c.activeCount?`${c.activeCount} активных предложений`:c.emptyText}</p></div></article>}
