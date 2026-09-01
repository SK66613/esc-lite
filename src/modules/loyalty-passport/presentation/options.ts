export const PASSPORT_VISUAL_VARIANTS=['classic_grid','punch_card','journey_path','collection_gallery','minimal_counter'] as const;
export const PASSPORT_HEADER_MODES=['compact','standard','hero'] as const;
export const PASSPORT_STAMP_SHAPES=['circle','rounded','square'] as const;
export const PASSPORT_PROGRESS_MODES=['bar','counter','ring','hidden'] as const;
export const PASSPORT_COLUMNS=[2,3,4] as const;
export const PASSPORT_IMAGE_ASPECTS=['square','portrait','landscape'] as const;
export const PASSPORT_VISUAL_VARIANT_LABELS={classic_grid:'Классическая сетка',punch_card:'Карта с печатями',journey_path:'Путь',collection_gallery:'Коллекция',minimal_counter:'Минимальный счётчик'} as const;
export const PASSPORT_HEADER_MODE_LABELS={compact:'Компактная',standard:'Стандартная',hero:'Крупная'} as const;
export const PASSPORT_STAMP_SHAPE_LABELS={circle:'Круглые',rounded:'Скруглённые',square:'Квадратные'} as const;
export const PASSPORT_PROGRESS_MODE_LABELS={bar:'Полоса',counter:'Счётчик',ring:'Кольцо',hidden:'Скрыт'} as const;
export const PASSPORT_IMAGE_ASPECT_LABELS={square:'Квадрат',portrait:'Вертикальный',landscape:'Горизонтальный'} as const;
export const PASSPORT_COLUMN_LABELS={2:'2',3:'3',4:'4'} as const;

export type PassportVisualVariant = typeof PASSPORT_VISUAL_VARIANTS[number];
export type PassportPresentationAxis = 'headerMode'|'stampShape'|'progressMode'|'columns'|'imageAspect';
export const PASSPORT_VARIANT_SUPPORTS={classic_grid:['headerMode','stampShape','progressMode','columns'],punch_card:['headerMode','stampShape','progressMode'],journey_path:['headerMode','progressMode'],collection_gallery:['headerMode','progressMode','columns','imageAspect'],minimal_counter:['progressMode']} as const satisfies Record<PassportVisualVariant,readonly PassportPresentationAxis[]>;
export const passportVariantSupports=(variant:PassportVisualVariant,axis:PassportPresentationAxis):boolean=>(PASSPORT_VARIANT_SUPPORTS[variant] as readonly PassportPresentationAxis[]).includes(axis);
