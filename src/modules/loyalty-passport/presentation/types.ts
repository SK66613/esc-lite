import type { ComponentType } from 'react';
import type { LoyaltyPassportConfig, PassportPresentation } from '../schema';
import type { PassportStampIconKey } from '../content/options';

export interface PassportStamp { index:number; completed:boolean; title:string; iconKey:PassportStampIconKey; imageUrl?:string }
export interface PassportViewModel { name:string; description:string; goal:number; filled:number; remaining:number; progressPercent:number; reward:string; unit:string; showProgress:boolean; stamps:PassportStamp[] }
export interface PassportRendererProps { viewModel:PassportViewModel; presentation:PassportPresentation }
export type PresentationAxis='headerMode'|'stampShape'|'progressMode'|'columns'|'imageAspect';
export interface PassportPresentationDefinition { id:PassportPresentation['visualVariant']; title:string; description:string; ai:{purpose:string;keywords:string[];bestFor:string[]}; supports:Record<PresentationAxis,boolean>; Renderer:ComponentType<PassportRendererProps> }
export type PassportConfigInput=Pick<LoyaltyPassportConfig,'name'|'description'|'goal'|'reward'|'balance'|'unit'|'showProgress'>&Partial<Pick<LoyaltyPassportConfig,'stampContent'>>;
