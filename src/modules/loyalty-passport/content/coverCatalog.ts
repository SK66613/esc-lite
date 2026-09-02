export const PASSPORT_COVER_ASSETS = [
  { id:'generic-star', titleRu:'Звезда', category:'universal', keywords:['звезда','этап','награда'], aspectSupport:'all' },
  { id:'gift-box', titleRu:'Подарок', category:'reward', keywords:['подарок','награда','финал'], aspectSupport:'all' },
  { id:'coffee-cup', titleRu:'Чашка кофе', category:'coffee', keywords:['кофе','чашка','напиток'], aspectSupport:'all' },
  { id:'coffee-beans', titleRu:'Кофейные зёрна', category:'coffee', keywords:['кофе','зёрна','обжарка'], aspectSupport:'all' },
  { id:'sparkles', titleRu:'Сияние', category:'universal', keywords:['сияние','праздник','готово'], aspectSupport:'all' },
  { id:'repair-intake', titleRu:'Приёмка', category:'repair', keywords:['приёмка','заказ','ремонт'], aspectSupport:'all' },
  { id:'repair-tools', titleRu:'Инструменты', category:'repair', keywords:['ремонт','инструмент','мастерская'], aspectSupport:'all' },
  { id:'shoe-polish', titleRu:'Полировка', category:'repair', keywords:['обувь','полировка','уход'], aspectSupport:'all' },
  { id:'shoe-finish', titleRu:'Готовая обувь', category:'repair', keywords:['обувь','готово','результат'], aspectSupport:'all' },
  { id:'beauty-scissors', titleRu:'Стрижка', category:'beauty', keywords:['красота','ножницы','стрижка'], aspectSupport:'all' },
  { id:'beauty-glow', titleRu:'Бьюти-сияние', category:'beauty', keywords:['красота','сияние','уход'], aspectSupport:'all' },
  { id:'crown-gold', titleRu:'Золотая корона', category:'premium', keywords:['корона','премиум','награда'], aspectSupport:'all' },
  { id:'heart-care', titleRu:'Забота', category:'wellness', keywords:['забота','сердце','здоровье'], aspectSupport:'all' },
  { id:'fitness-energy', titleRu:'Энергия', category:'fitness', keywords:['спорт','энергия','тренировка'], aspectSupport:'all' },
  { id:'food-treat', titleRu:'Угощение', category:'food', keywords:['еда','десерт','угощение'], aspectSupport:'all' },
  { id:'ticket-premium', titleRu:'Премиум-билет', category:'events', keywords:['билет','событие','премиум'], aspectSupport:'all' },
] as const;

export type PassportCoverAsset = typeof PASSPORT_COVER_ASSETS[number];
export type PassportCoverAssetId = PassportCoverAsset['id'];
export type PassportCoverAspectSupport = PassportCoverAsset['aspectSupport'];
export const PASSPORT_COVER_ASSET_IDS = PASSPORT_COVER_ASSETS.map(asset=>asset.id) as [PassportCoverAssetId,...PassportCoverAssetId[]];
export const PASSPORT_COVER_ASSET_BY_ID = Object.fromEntries(PASSPORT_COVER_ASSETS.map(asset=>[asset.id,asset])) as Record<PassportCoverAssetId,PassportCoverAsset>;
export const PASSPORT_COVER_FALLBACK_ID:PassportCoverAssetId='generic-star';

/** Bounded, JSON-safe context for AI selection. */
export const buildPassportCoverAIAssets=()=>PASSPORT_COVER_ASSETS.map(({id,titleRu,category,keywords})=>({id,title:titleRu,category,keywords:[...keywords]}));
