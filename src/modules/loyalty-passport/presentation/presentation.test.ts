import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LoyaltyPassportConfigSchema } from '../schema';
import { buildPassportViewModel } from './buildPassportViewModel';
import { normalizePassportPresentation } from './normalizePresentation';
import { passportPresentationRegistry } from './registry';

const legacy = {
  name: 'Ремонт+',
  description: 'После пяти визитов',
  goal: 5,
  reward: 'Скидка 30%',
  showProgress: false,
  offers: false,
  active: true,
  balance: 3,
  unit: 'ремонтов',
};

const progressSurfaceByVariant = {
  classic_grid: 'passport-grid',
  punch_card: 'passport-punch-row',
  journey_path: 'passport-path',
  collection_gallery: 'passport-gallery',
  minimal_counter: 'passport-big-counter',
} as const;

function renderVariant(id: keyof typeof progressSurfaceByVariant, showProgress: boolean, progressMode: 'bar' | 'hidden' = 'bar') {
  const definition = passportPresentationRegistry.find((item) => item.id === id)!;
  const presentation = normalizePassportPresentation({ visualVariant: id, progressMode });
  const viewModel = buildPassportViewModel({ ...legacy, showProgress });
  return renderToStaticMarkup(createElement(definition.Renderer, { presentation, viewModel }));
}

describe('passport presentation', () => {
  it('parses a legacy config with showProgress=false and supplies presentation defaults', () => {
    const parsed = LoyaltyPassportConfigSchema.parse(legacy);
    expect(parsed.showProgress).toBe(false);
    expect(parsed.presentation).toEqual({
      visualVariant: 'classic_grid',
      headerMode: 'standard',
      stampShape: 'circle',
      progressMode: 'bar',
      columns: 3,
      imageAspect: 'square',
    });
  });

  it('preserves showProgress=false in the shared view model', () => {
    expect(buildPassportViewModel(legacy).showProgress).toBe(false);
  });

  it('normalizes malformed values without throwing', () => {
    expect(normalizePassportPresentation({ visualVariant: 'premium_card', columns: 99 }).visualVariant).toBe('classic_grid');
  });

  it('registers exactly five unique variants', () => {
    const ids = passportPresentationRegistry.map((item) => item.id);
    expect(ids).toEqual(['classic_grid', 'punch_card', 'journey_path', 'collection_gallery', 'minimal_counter']);
    expect(new Set(ids).size).toBe(5);
  });

  it.each(Object.entries(progressSurfaceByVariant))('%s hides its progress surfaces when showProgress=false', (id, surfaceClass) => {
    const markup = renderVariant(id as keyof typeof progressSurfaceByVariant, false);
    expect(markup).not.toContain(surfaceClass);
    expect(markup).not.toContain('passport-progress');
    expect(markup).toContain('Ремонт+');
    expect(markup).toContain('passport-qr');
  });

  it.each(Object.entries(progressSurfaceByVariant))('%s keeps its variant surface but hides the meter for progressMode=hidden', (id, surfaceClass) => {
    const markup = renderVariant(id as keyof typeof progressSurfaceByVariant, true, 'hidden');
    expect(markup).toContain(surfaceClass);
    expect(markup).not.toContain('passport-progress');
  });

  it.each([[1, 8, 1, 0], [30, 41, 30, 0], [30, 4.9, 4, 26]] as const)(
    'builds bounded view model for goal %s',
    (goal, balance, filled, remaining) => {
      const viewModel = buildPassportViewModel({ ...legacy, goal, balance });
      expect(viewModel.filled).toBe(filled);
      expect(viewModel.remaining).toBe(remaining);
      expect(viewModel.stamps).toHaveLength(goal);
    },
  );
});

import {PASSPORT_VISUAL_VARIANTS} from './options';
import {buildPassportPresentationAICapabilities} from './registry';
describe('presentation AI vocabulary',()=>{
 it('keeps registry ids equal to pure options',()=>expect(passportPresentationRegistry.map(x=>x.id)).toEqual([...PASSPORT_VISUAL_VARIANTS]));
 it('projects JSON-safe metadata without renderers',()=>{const projection=buildPassportPresentationAICapabilities();expect(projection).toHaveLength(5);expect(JSON.stringify(projection)).not.toContain('Renderer');expect(projection.find(x=>x.id==='minimal_counter')?.supports).toEqual(['progressMode']);});
});
