import type {AIPlan} from '../schema/AIPlanSchema';
import {Button} from '../../ui/Button';
import {AIMessage} from './AIMessage';
import {AIPlanCard,AppliedActions} from './AIPlanCard';

export type ConversationItem={id:string;role:'user'|'assistant';text:string;plan?:AIPlan;applied?:boolean;retryMessage?:string};

export function AIChat({items,busy,onApply,onCancel,onPreview,onContinue,onUndo,onRetry,canUndo}:{items:ConversationItem[];busy:boolean;onApply:(p:AIPlan)=>void;onCancel:(id:string)=>void;onPreview:()=>void;onContinue:()=>void;onUndo:()=>void;onRetry:(id:string,message:string)=>void;canUndo:boolean}){
  return <div className="ai-chat">{items.map(item=><AIMessage role={item.role} key={item.id}>{item.text&&<p>{item.text}</p>}{item.plan&&!item.applied&&<AIPlanCard plan={item.plan} onApply={()=>onApply(item.plan!)} onCancel={()=>onCancel(item.id)}/>} {item.applied&&<AppliedActions onPreview={onPreview} onContinue={onContinue} onUndo={onUndo} canUndo={canUndo}/>} {item.retryMessage&&<div className="plan-actions"><Button variant="secondary" disabled={busy} onClick={()=>onRetry(item.id,item.retryMessage!)}>Повторить</Button></div>}</AIMessage>)}{busy&&<AIMessage role="assistant"><div className="ai-loading"><i/><span>Анализирую бизнес… Подбираю структуру…</span></div></AIMessage>}</div>;
}
