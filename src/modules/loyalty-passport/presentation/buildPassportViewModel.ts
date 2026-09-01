import type { PassportConfigInput, PassportViewModel } from './types';
export function buildPassportViewModel(config:PassportConfigInput):PassportViewModel {
  const filled=Math.min(config.goal,Math.max(0,Math.floor(config.balance)));
  return {...config,filled,remaining:config.goal-filled,progressPercent:Math.round(filled/config.goal*100),stamps:Array.from({length:config.goal},(_,index)=>({index,completed:index<filled,title:index<filled?`Отметка ${index+1}, получена`:`Отметка ${index+1}`}))};
}
