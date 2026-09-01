import { describe,expect,it } from 'vitest'; import { LoyaltyPassportConfigSchema } from '../schema'; import { normalizePassportPresentation } from './normalizePresentation'; import { passportPresentationRegistry } from './registry'; import { buildPassportViewModel } from './buildPassportViewModel';
const legacy={name:'Ремонт+',description:'После пяти визитов',goal:5,reward:'Скидка 30%',showProgress:true,offers:false,active:true,balance:3,unit:'ремонтов'};
describe('passport presentation',()=>{
 it('parses legacy config and supplies presentation defaults',()=>expect(LoyaltyPassportConfigSchema.parse(legacy).presentation).toEqual({visualVariant:'classic_grid',headerMode:'standard',stampShape:'circle',progressMode:'bar',columns:3,imageAspect:'square'}));
 it('normalizes malformed values without throwing',()=>expect(normalizePassportPresentation({visualVariant:'premium_card',columns:99}).visualVariant).toBe('classic_grid'));
 it('registers exactly five unique variants',()=>{expect(passportPresentationRegistry.map(x=>x.id)).toEqual(['classic_grid','punch_card','journey_path','collection_gallery','minimal_counter']);expect(new Set(passportPresentationRegistry.map(x=>x.id)).size).toBe(5)});
 it.each([[1,8,1,0],[30,41,30,0],[30,4.9,4,26]] as const)('builds bounded view model for goal %s',(goal,balance,filled,remaining)=>{const vm=buildPassportViewModel({...legacy,goal,balance});expect(vm.filled).toBe(filled);expect(vm.remaining).toBe(remaining);expect(vm.stamps).toHaveLength(goal)});
});
