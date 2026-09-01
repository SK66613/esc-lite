import {PASSPORT_COLUMNS,PASSPORT_HEADER_MODES,PASSPORT_IMAGE_ASPECTS,PASSPORT_PROGRESS_MODES,PASSPORT_STAMP_SHAPES,PASSPORT_VISUAL_VARIANTS} from '../../modules/loyalty-passport/presentation/options';
export const SERVER_MODULE_CONFIG_OPTION_POLICY={loyalty_passport:{
 'presentation.visualVariant':PASSPORT_VISUAL_VARIANTS,'presentation.headerMode':PASSPORT_HEADER_MODES,'presentation.stampShape':PASSPORT_STAMP_SHAPES,
 'presentation.progressMode':PASSPORT_PROGRESS_MODES,'presentation.columns':PASSPORT_COLUMNS,'presentation.imageAspect':PASSPORT_IMAGE_ASPECTS,
}} as const;
