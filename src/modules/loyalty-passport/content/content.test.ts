import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {LoyaltyPassportConfigSchema,PassportStampContentMapSchema,createLoyaltyConfig} from '../schema';
import {buildPassportViewModel} from '../presentation/buildPassportViewModel';
import {normalizePassportPresentation} from '../presentation/normalizePresentation';
import {passportPresentationRegistry} from '../presentation/registry';

describe('Passport stamp content schema',()=>{
 it('defaults legacy content and accepts boundary positions and null resets',()=>{expect(LoyaltyPassportConfigSchema.parse({...createLoyaltyConfig(),stampContent:undefined}).stampContent).toEqual({});expect(PassportStampContentMapSchema.parse({'1':{title:' Первый '},'30':null})).toEqual({'1':{title:'Первый'},'30':null});});
 it.each(['0','31','foo'])('rejects position %s',key=>expect(PassportStampContentMapSchema.safeParse({[key]:{title:'Этап'}}).success).toBe(false));
 it('validates titles, icons, strict fields and non-empty items',()=>{expect(PassportStampContentMapSchema.safeParse({'1':{title:'Этап',iconKey:'tool'},'2':{title:null},'3':{iconKey:null}}).success).toBe(true);for(const item of [{title:''},{title:'x'.repeat(61)},{iconKey:'custom_svg'},{}, {title:'Этап',imageUrl:'x'}])expect(PassportStampContentMapSchema.safeParse({'1':item}).success).toBe(false);});
 it('accepts typed catalog covers and explicit clearing',()=>{expect(PassportStampContentMapSchema.parse({'1':{cover:{source:'catalog',assetId:'repair-intake'}},'2':{cover:null}})).toEqual({'1':{cover:{source:'catalog',assetId:'repair-intake'}},'2':{cover:null}});});
 it.each([{source:'external',assetId:'gift-box'},{source:'catalog',assetId:'invented'},{source:'catalog',assetId:'gift-box',url:'https://example.test'},{source:'catalog'},'gift-box',42])('rejects malformed cover %j',cover=>expect(PassportStampContentMapSchema.safeParse({'1':{cover}}).success).toBe(false));
});

describe('Passport authored content view model',()=>{
 const config={...createLoyaltyConfig(),goal:5,balance:2,stampContent:{'2':{title:'Диагностика',iconKey:'tool' as const,cover:{source:'catalog' as const,assetId:'repair-tools' as const}},'5':{title:'Готово',iconKey:'gift' as const}}};
 it('uses sparse cover overrides, no-cover fallbacks, and balance-only completion',()=>{const vm=buildPassportViewModel(config);expect(vm.stamps).toHaveLength(5);expect(vm.stamps[0]).toMatchObject({title:'Отметка 1',iconKey:'star',cover:null,completed:true});expect(vm.stamps[1]).toMatchObject({title:'Диагностика',iconKey:'tool',cover:{assetId:'repair-tools'},completed:true});expect(vm.stamps[4]).toMatchObject({title:'Готово',iconKey:'gift',cover:null,completed:false});});
 it.each(passportPresentationRegistry.map(x=>x.id))('renders authored content in %s',id=>{const definition=passportPresentationRegistry.find(x=>x.id===id)!;const markup=renderToStaticMarkup(createElement(definition.Renderer,{viewModel:buildPassportViewModel({...config,balance:1}),presentation:normalizePassportPresentation({visualVariant:id})}));expect(markup).toContain('Диагностика');expect(markup).toContain('lucide-wrench');});
 it.each(passportPresentationRegistry.map(x=>x.id))('meaningfully consumes the authored cover in %s',id=>{const definition=passportPresentationRegistry.find(x=>x.id===id)!;const markup=renderToStaticMarkup(createElement(definition.Renderer,{viewModel:buildPassportViewModel({...config,balance:1}),presentation:normalizePassportPresentation({visualVariant:id})}));expect(markup).toContain('data-cover-asset="repair-tools"');});
});
