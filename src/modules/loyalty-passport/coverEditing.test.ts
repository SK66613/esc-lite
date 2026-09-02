import { describe, expect, it } from 'vitest';
import { createLoyaltyConfig } from './schema';
import { applyUploadedPassportCover, getPassportCoverSelectValue, UPLOADED_MEDIA_SELECT_VALUE } from './coverEditing';
const mediaId = 'm1_abcdefghijklmnop_qrstuvwxyzABCDEF_123e4567-e89b-42d3-a456-426614174000';
describe('Passport cover editing', () => {
  it('maps catalog, media and empty states without persisting the sentinel', () => {
    expect(getPassportCoverSelectValue({ source:'catalog', assetId:'gift-box' })).toBe('gift-box');
    expect(getPassportCoverSelectValue({ source:'media', mediaId })).toBe(UPLOADED_MEDIA_SELECT_VALUE);
    expect(getPassportCoverSelectValue(null)).toBe('');
  });
  it('applies upload to latest config without restoring stale fields', () => {
    const latest = { ...createLoyaltyConfig(), reward:'VIP подарок', stampContent:{'2':{title:'Покраска',iconKey:'tool' as const},'3':{title:'Полировка'}} };
    const result = applyUploadedPassportCover(latest, 2, mediaId);
    expect(result.reward).toBe('VIP подарок');
    expect(result.stampContent['2']).toEqual({title:'Покраска',iconKey:'tool',cover:{source:'media',mediaId}});
    expect(result.stampContent['3']).toEqual({title:'Полировка'});
  });
});
