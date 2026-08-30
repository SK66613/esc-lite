import { Tag } from 'lucide-react';import { OffersConfigSchema } from './schema';
export function OffersPreview({config}:{config:unknown}){const c=OffersConfigSchema.parse(config);return <article className="offers-preview"><Tag/><div><h3>{c.title}</h3><p>{c.activeCount?`${c.activeCount} активных предложений`:c.emptyText}</p></div></article>}
