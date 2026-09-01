import { LoyaltyPassportPresentationSchema, PassportHeaderModeSchema, PassportImageAspectSchema, PassportProgressModeSchema, PassportStampShapeSchema, PassportVisualVariantSchema, type PassportPresentation } from '../schema';
export function normalizePassportPresentation(value:unknown):PassportPresentation {
  const parsed=LoyaltyPassportPresentationSchema.safeParse(value);
  if(parsed.success)return parsed.data;
  const input=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const defaults=LoyaltyPassportPresentationSchema.parse({});
  return {
    visualVariant:PassportVisualVariantSchema.safeParse(input.visualVariant).success?input.visualVariant as PassportPresentation['visualVariant']:'classic_grid',
    headerMode:PassportHeaderModeSchema.safeParse(input.headerMode).success?input.headerMode as PassportPresentation['headerMode']:defaults.headerMode,
    stampShape:PassportStampShapeSchema.safeParse(input.stampShape).success?input.stampShape as PassportPresentation['stampShape']:defaults.stampShape,
    progressMode:PassportProgressModeSchema.safeParse(input.progressMode).success?input.progressMode as PassportPresentation['progressMode']:defaults.progressMode,
    columns:[2,3,4].includes(input.columns as number)?input.columns as PassportPresentation['columns']:defaults.columns,
    imageAspect:PassportImageAspectSchema.safeParse(input.imageAspect).success?input.imageAspect as PassportPresentation['imageAspect']:defaults.imageAspect,
  };
}
