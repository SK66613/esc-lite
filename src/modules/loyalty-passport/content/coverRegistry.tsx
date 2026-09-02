import type { ImgHTMLAttributes } from 'react';
import type { PassportCoverReference } from '../schema';
import {PASSPORT_COVER_ASSET_BY_ID,PASSPORT_COVER_FALLBACK_ID,type PassportCoverAssetId} from './coverCatalog';
import genericStar from './assets/generic-star.svg'; import giftBox from './assets/gift-box.svg';
import coffeeCup from './assets/coffee-cup.svg'; import coffeeBeans from './assets/coffee-beans.svg'; import sparkles from './assets/sparkles.svg';
import repairIntake from './assets/repair-intake.svg'; import repairTools from './assets/repair-tools.svg'; import shoePolish from './assets/shoe-polish.svg'; import shoeFinish from './assets/shoe-finish.svg';
import beautyScissors from './assets/beauty-scissors.svg'; import beautyGlow from './assets/beauty-glow.svg'; import crownGold from './assets/crown-gold.svg'; import heartCare from './assets/heart-care.svg'; import fitnessEnergy from './assets/fitness-energy.svg'; import foodTreat from './assets/food-treat.svg'; import ticketPremium from './assets/ticket-premium.svg';

const sources:Record<PassportCoverAssetId,string>={
 'generic-star':genericStar,'gift-box':giftBox,'coffee-cup':coffeeCup,'coffee-beans':coffeeBeans,sparkles,
 'repair-intake':repairIntake,'repair-tools':repairTools,'shoe-polish':shoePolish,'shoe-finish':shoeFinish,
 'beauty-scissors':beautyScissors,'beauty-glow':beautyGlow,'crown-gold':crownGold,'heart-care':heartCare,
 'fitness-energy':fitnessEnergy,'food-treat':foodTreat,'ticket-premium':ticketPremium,
};
export function getPassportCoverAsset(assetId:PassportCoverAssetId|string){const safeId=assetId in sources?assetId as PassportCoverAssetId:PASSPORT_COVER_FALLBACK_ID;return {...PASSPORT_COVER_ASSET_BY_ID[safeId],src:sources[safeId]};}
export function PassportCoverImage({cover,...props}:{cover:PassportCoverReference}&Omit<ImgHTMLAttributes<HTMLImageElement>,'src'>){if(cover.source==='media')return <img {...props} src={`/api/media/passport-covers/${encodeURIComponent(cover.mediaId)}`} data-cover-media={cover.mediaId}/>;const asset=getPassportCoverAsset(cover.assetId);return <img {...props} src={asset.src} data-cover-asset={asset.id}/>;}
