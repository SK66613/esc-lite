import type { ReactNode } from 'react';
import { X } from 'lucide-react';
export function Sheet({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){return <div className="overlay" onMouseDown={onClose}><section className="sheet" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e=>e.stopPropagation()}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X/></button></header>{children}</section></div>}
