declare global {
  interface Window { Telegram?: { WebApp?: { initData?: string; ready?: () => void; expand?: () => void } } }
}

/** Signed launch data only; initDataUnsafe must never be used for authentication. */
export const getTelegramInitData = (): string =>
  typeof window === 'undefined' ? '' : window.Telegram?.WebApp?.initData ?? '';
