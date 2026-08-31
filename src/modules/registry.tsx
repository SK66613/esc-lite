import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { CreditCard, Tags } from 'lucide-react';
import type { output, ZodTypeAny } from 'zod';
import { LoyaltyPassportConfigSchema, createLoyaltyConfig } from './loyalty-passport/schema';
import { LoyaltyPassportPreview } from './loyalty-passport/LoyaltyPassportPreview';
import { LoyaltyPassportInspector } from './loyalty-passport/LoyaltyPassportInspector';
import { OffersConfigSchema, createOffersConfig } from './offers-placeholder/schema';
import { OffersPreview } from './offers-placeholder/OffersPreview';
import { OffersInspector } from './offers-placeholder/OffersInspector';

export interface ModuleViewProps<TConfig> { config: TConfig }
export interface ModuleInspectorProps<TConfig> extends ModuleViewProps<TConfig> {
  onChange: (config: TConfig) => void;
}

interface TypedModuleDefinition<TSchema extends ZodTypeAny> {
  type: string; title: string; description: string; icon: LucideIcon; version: number;
  createDefaultConfig: () => output<TSchema>;
  ConfigSchema: TSchema;
  PreviewComponent: ComponentType<ModuleViewProps<output<TSchema>>>;
  InspectorComponent: ComponentType<ModuleInspectorProps<output<TSchema>>>;
  ai?: ModuleAIMetadata;
}

export interface ModuleAIMetadata { purpose: string; examples?: string[]; keywords?: string[] }

export interface ModuleDefinition {
  type: string; title: string; description: string; icon: LucideIcon; version: number;
  createDefaultConfig: () => unknown;
  ConfigSchema: ZodTypeAny;
  PreviewComponent: ComponentType<ModuleViewProps<unknown>>;
  InspectorComponent: ComponentType<ModuleInspectorProps<unknown>>;
  ai?: ModuleAIMetadata;
}

/** The single controlled type-erasure boundary for this heterogeneous registry. */
function defineModule<TSchema extends ZodTypeAny>(definition: TypedModuleDefinition<TSchema>): ModuleDefinition {
  const TypedPreview = definition.PreviewComponent;
  const TypedInspector = definition.InspectorComponent;
  return {
    ...definition,
    PreviewComponent: ({ config }) =>
      <TypedPreview config={definition.ConfigSchema.parse(config)} />,
    InspectorComponent: ({ config, onChange }) =>
      <TypedInspector
        config={definition.ConfigSchema.parse(config)}
        onChange={(next) => onChange(next)}
      />,
  };
}

export const moduleRegistry = {
  loyalty_passport: defineModule({
    type: 'loyalty_passport', title: 'Loyalty Passport',
    description: 'Визиты, прогресс и награда', icon: CreditCard, version: 1,
    createDefaultConfig: createLoyaltyConfig, ConfigSchema: LoyaltyPassportConfigSchema,
    PreviewComponent: LoyaltyPassportPreview, InspectorComponent: LoyaltyPassportInspector,
    ai:{purpose:'Программа лояльности по визитам или покупкам',examples:['Каждый шестой кофе бесплатно'],keywords:['бонус','лояльность','кофе в подарок','штампы','визиты']},
  }),
  offers_placeholder: defineModule({
    type: 'offers_placeholder', title: 'Offers',
    description: 'Foundation для предложений', icon: Tags, version: 1,
    createDefaultConfig: createOffersConfig, ConfigSchema: OffersConfigSchema,
    PreviewComponent: OffersPreview, InspectorComponent: OffersInspector,
    ai:{purpose:'Акции и специальные предложения',keywords:['акции','скидки','предложения']},
  }),
} satisfies Record<string, ModuleDefinition>;

export type ModuleType = keyof typeof moduleRegistry;
export const isModuleType = (value: string): value is ModuleType => value in moduleRegistry;
