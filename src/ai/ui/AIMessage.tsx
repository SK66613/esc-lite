import type {ReactNode} from 'react';
export function AIMessage({role,children}:{role:'user'|'assistant';children:ReactNode}){return <div className={`ai-message ${role}`}><span>{role==='assistant'?'✨':'Вы'}</span><div>{children}</div></div>}
