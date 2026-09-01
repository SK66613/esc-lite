import {useState} from 'react';
import {buildCapabilityManifest} from '../capabilities/buildCapabilityManifest';
import {aiPlanner} from '../planner';
import type {AIConversationTurn} from '../planner/AIPlanner';
import type {AIPlan} from '../schema/AIPlanSchema';
import {useProjectStore} from '../../project/store';
import type {Project} from '../../project/schema';
import {useEditorStore} from '../../app/editorStore';
import {AIChat,type ConversationItem} from './AIChat';
import {AIComposer} from './AIComposer';

const conversationFromItems=(items:ConversationItem[]):AIConversationTurn[]=>items
  .filter(item=>!item.retryMessage&&item.text.trim())
  .map(item=>({role:item.role,content:item.text.trim()}));

const withoutCurrentRetry=(turns:AIConversationTurn[],message:string):AIConversationTurn[]=>{
  const next=[...turns];
  for(let index=next.length-1;index>=0;index-=1){
    if(next[index].role==='user'&&next[index].content===message){next.splice(index,1);break;}
  }
  return next;
};

export function AIPage(){
  const applyAIPlan=useProjectStore(s=>s.applyAIPlan),restoreDraft=useProjectStore(s=>s.restoreDraft),setRoute=useEditorStore(s=>s.setRoute);
  const [items,setItems]=useState<ConversationItem[]>([]),[busy,setBusy]=useState(false),[undo,setUndo]=useState<Project>();

  const runPlanner=async(message:string,{addUser=true,retryErrorId}:{addUser?:boolean;retryErrorId?:string}={})=>{
    if(busy)return;
    const cleanItems=retryErrorId?items.filter(item=>item.id!==retryErrorId):items;
    let conversation=conversationFromItems(cleanItems);
    if(!addUser)conversation=withoutCurrentRetry(conversation,message);
    if(addUser)setItems([...cleanItems,{id:`u-${Date.now()}`,role:'user',text:message}]);else setItems(cleanItems);
    setBusy(true);
    try{
      const plan=await aiPlanner.plan({message,project:useProjectStore.getState().project,capabilities:buildCapabilityManifest(),conversation});
      setItems(value=>[...value.filter(item=>item.id!==retryErrorId),{id:plan.id,role:'assistant',text:plan.summary,plan}]);
    }catch(error){
      const text=error instanceof Error?error.message:'Не удалось подготовить план.';
      setItems(value=>[...value.filter(item=>item.id!==retryErrorId),{id:`err-${Date.now()}`,role:'assistant',text,retryMessage:message}]);
    }finally{setBusy(false);}
  };

  const apply=(plan:AIPlan)=>{
    const current=useProjectStore.getState().project;
    const result=applyAIPlan(plan);
    if(!result.ok){setItems(value=>[...value,{id:`err-${Date.now()}`,role:'assistant',text:'Не удалось безопасно применить изменения.'}]);return;}
    setUndo(result.changed?structuredClone(current):undefined);
    setItems(value=>value.map(item=>item.plan?.id===plan.id?{...item,plan:undefined,applied:true,text:result.changed?`Применено: ${plan.summary}`:'Изменения уже были применены ранее.'}:item));
  };

  const undoChange=()=>{if(!undo)return;restoreDraft(undo);setUndo(undefined);setItems(value=>[...value,{id:`undo-${Date.now()}`,role:'assistant',text:'Последнее изменение отменено.'}]);};

  return <div className="page ai-page"><header className="ai-hero"><span>✨</span><div><span className="eyebrow">Escalita AI Composer</span><h1>Создадим ваше приложение</h1><p>Расскажите о своём бизнесе и что должно быть в Mini App.</p></div></header>{items.length===0?<AIComposer onSubmit={message=>runPlanner(message)} busy={busy}/>:<><AIChat items={items} busy={busy} onApply={apply} onCancel={id=>setItems(value=>value.filter(item=>item.id!==id))} onPreview={()=>setRoute('preview')} onContinue={()=>document.querySelector<HTMLTextAreaElement>('.ai-composer textarea')?.focus()} onUndo={undoChange} onRetry={(id,message)=>runPlanner(message,{addUser:false,retryErrorId:id})} canUndo={Boolean(undo)}/><AIComposer compact onSubmit={message=>runPlanner(message)} busy={busy}/></>}</div>;
}
