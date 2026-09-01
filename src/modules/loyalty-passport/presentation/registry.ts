import { ClassicGridPassport } from './ClassicGridPassport'; import { PunchCardPassport } from './PunchCardPassport'; import { JourneyPathPassport } from './JourneyPathPassport'; import { CollectionGalleryPassport } from './CollectionGalleryPassport'; import { MinimalCounterPassport } from './MinimalCounterPassport'; import type { PassportPresentationDefinition } from './types';
import {PASSPORT_COLUMNS,PASSPORT_HEADER_MODES,PASSPORT_IMAGE_ASPECTS,PASSPORT_PROGRESS_MODES,PASSPORT_STAMP_SHAPES,PASSPORT_VARIANT_SUPPORTS,PASSPORT_VISUAL_VARIANTS,type PassportVisualVariant} from './options';
const supports=(variant:PassportVisualVariant)=>{const axes=PASSPORT_VARIANT_SUPPORTS[variant] as readonly string[];return {headerMode:axes.includes('headerMode'),stampShape:axes.includes('stampShape'),progressMode:axes.includes('progressMode'),columns:axes.includes('columns'),imageAspect:axes.includes('imageAspect')}};
export const passportPresentationRegistry=[
 {id:'classic_grid',title:'Классическая сетка',description:'Нейтральная сетка отметок',ai:{purpose:'Универсальный привычный паспорт',keywords:['классический','обычная сетка'],bestFor:['универсальный вид']},supports:supports('classic_grid'),Renderer:ClassicGridPassport},
 {id:'punch_card',title:'Карта с печатями',description:'Компактная физическая карта',ai:{purpose:'Тактильная карта постоянного гостя',keywords:['настоящая карточка','печати'],bestFor:['клубная карта']},supports:supports('punch_card'),Renderer:PunchCardPassport},
 {id:'journey_path',title:'Путь',description:'Последовательный маршрут этапов',ai:{purpose:'Прогресс как путешествие',keywords:['путь','дорожка','этапы'],bestFor:['пошаговый прогресс']},supports:supports('journey_path'),Renderer:JourneyPathPassport},
 {id:'collection_gallery',title:'Коллекция',description:'Галерея открываемых объектов',ai:{purpose:'Коллекционирование достижений',keywords:['коллекция','галерея'],bestFor:['collectibles']},supports:supports('collection_gallery'),Renderer:CollectionGalleryPassport},
 {id:'minimal_counter',title:'Минимальный счётчик',description:'Только главное',ai:{purpose:'Минимум декора и крупный прогресс',keywords:['минималистично','проще','только прогресс'],bestFor:['лаконичный интерфейс']},supports:supports('minimal_counter'),Renderer:MinimalCounterPassport},
] as const satisfies readonly PassportPresentationDefinition[];
export const passportPresentationById=passportPresentationRegistry.reduce((result,item)=>{result[item.id]=item;return result},{ } as Record<PassportPresentationDefinition['id'],PassportPresentationDefinition>);
export const passportPresentationConfigOptions={
 'presentation.visualVariant':{values:PASSPORT_VISUAL_VARIANTS,description:'Композиция паспорта'},
 'presentation.headerMode':{values:PASSPORT_HEADER_MODES,description:'Размер шапки'},
 'presentation.stampShape':{values:PASSPORT_STAMP_SHAPES,description:'Форма отметок'},
 'presentation.progressMode':{values:PASSPORT_PROGRESS_MODES,description:'Отображение прогресса'},
 'presentation.columns':{values:PASSPORT_COLUMNS,description:'Колонки'},
 'presentation.imageAspect':{values:PASSPORT_IMAGE_ASPECTS,description:'Пропорции коллекционных объектов'},
} as const;
export const buildPassportPresentationAICapabilities=()=>passportPresentationRegistry.map(({id,title,description,ai,supports})=>({id,title,description,...ai,supports:(Object.keys(supports) as (keyof typeof supports)[]).filter(key=>supports[key])}));
