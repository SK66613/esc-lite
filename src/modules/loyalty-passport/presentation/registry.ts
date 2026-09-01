import { ClassicGridPassport } from './ClassicGridPassport'; import { PunchCardPassport } from './PunchCardPassport'; import { JourneyPathPassport } from './JourneyPathPassport'; import { CollectionGalleryPassport } from './CollectionGalleryPassport'; import { MinimalCounterPassport } from './MinimalCounterPassport'; import type { PassportPresentationDefinition } from './types';
const supports=(headerMode:boolean,stampShape:boolean,progressMode:boolean,columns:boolean,imageAspect:boolean)=>({headerMode,stampShape,progressMode,columns,imageAspect});
export const passportPresentationRegistry=[
 {id:'classic_grid',title:'Классическая сетка',description:'Нейтральная сетка отметок',ai:{purpose:'Универсальный привычный паспорт',keywords:['классический','обычная сетка'],bestFor:['универсальный вид']},supports:supports(true,true,true,true,false),Renderer:ClassicGridPassport},
 {id:'punch_card',title:'Карта с печатями',description:'Компактная физическая карта',ai:{purpose:'Тактильная карта постоянного гостя',keywords:['настоящая карточка','печати'],bestFor:['клубная карта']},supports:supports(true,true,true,false,false),Renderer:PunchCardPassport},
 {id:'journey_path',title:'Путь',description:'Последовательный маршрут этапов',ai:{purpose:'Прогресс как путешествие',keywords:['путь','дорожка','этапы'],bestFor:['пошаговый прогресс']},supports:supports(true,false,true,false,false),Renderer:JourneyPathPassport},
 {id:'collection_gallery',title:'Коллекция',description:'Галерея открываемых объектов',ai:{purpose:'Коллекционирование достижений',keywords:['коллекция','галерея'],bestFor:['collectibles']},supports:supports(true,false,true,true,true),Renderer:CollectionGalleryPassport},
 {id:'minimal_counter',title:'Минимальный счётчик',description:'Только главное',ai:{purpose:'Минимум декора и крупный прогресс',keywords:['минималистично','проще','только прогресс'],bestFor:['лаконичный интерфейс']},supports:supports(false,false,true,false,false),Renderer:MinimalCounterPassport},
] as const satisfies readonly PassportPresentationDefinition[];
export const passportPresentationById=passportPresentationRegistry.reduce((result,item)=>{result[item.id]=item;return result},{ } as Record<PassportPresentationDefinition['id'],PassportPresentationDefinition>);
export const passportPresentationConfigOptions={
 'presentation.visualVariant':{values:passportPresentationRegistry.map(x=>x.id),description:'Композиция паспорта'},
 'presentation.headerMode':{values:['compact','standard','hero'],description:'Размер шапки'},
 'presentation.stampShape':{values:['circle','rounded','square'],description:'Форма отметок'},
 'presentation.progressMode':{values:['bar','counter','ring','hidden'],description:'Отображение прогресса'},
 'presentation.columns':{values:[2,3,4],description:'Колонки'},
 'presentation.imageAspect':{values:['square','portrait','landscape'],description:'Пропорции коллекционных объектов'},
} as const;
