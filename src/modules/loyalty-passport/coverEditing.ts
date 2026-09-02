import type { LoyaltyPassportConfig, PassportCoverReference } from './schema';
export const UPLOADED_MEDIA_SELECT_VALUE = '__uploaded_media__';
export const getPassportCoverSelectValue = (cover: PassportCoverReference | null | undefined) =>
  cover?.source === 'catalog' ? cover.assetId : cover?.source === 'media' ? UPLOADED_MEDIA_SELECT_VALUE : '';
export function applyPassportCoverPatch(config: LoyaltyPassportConfig, position: number, cover: PassportCoverReference | null): LoyaltyPassportConfig {
  const item = config.stampContent[String(position)];
  return { ...config, stampContent: { ...config.stampContent, [position]: { ...item, cover } } };
}
export const applyUploadedPassportCover = (config: LoyaltyPassportConfig, position: number, mediaId: string) =>
  applyPassportCoverPatch(config, position, { source: 'media', mediaId });
