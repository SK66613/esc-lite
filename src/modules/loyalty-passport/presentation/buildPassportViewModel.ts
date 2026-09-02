import type { PassportConfigInput, PassportViewModel } from './types';
export function buildPassportViewModel(config:PassportConfigInput):PassportViewModel {
  const filled=Math.min(config.goal,Math.max(0,Math.floor(config.balance)));
  return {...config,showProgress:config.showProgress,filled,remaining:config.goal-filled,progressPercent:Math.round(filled/config.goal*100),stamps:Array.from({length:config.goal},(_,index)=>{const override=config.stampContent?.[String(index+1)];return {index,completed:index<filled,title:override?.title??`Отметка ${index+1}`,iconKey:override?.iconKey??'star',cover:override?.cover?.source==='catalog'?{assetId:override.cover.assetId}:null}})};
}
