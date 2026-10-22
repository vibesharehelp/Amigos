/**
 * Centralized Image Utilities & Resilient Fallback Handlers
 * Prevents broken image icons across all tabs (Chats, Friends, Gifts, More, Profile)
 */

export const DEFAULT_AVATAR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFE812"/><circle cx="50" cy="40" r="22" fill="%23191919"/><path d="M22 88 C22 66 35 58 50 58 C65 58 78 66 78 88 Z" fill="%23191919"/></svg>`;

export const CHOONSIK_AVATAR_FALLBACK = '/src/assets/images/kakao_choonsik_avatar_1791097626474.jpg';
export const RYAN_AVATAR_FALLBACK = '/src/assets/images/kakao_ryan_avatar_1791097603606.jpg';
export const APEACH_AVATAR_FALLBACK = '/src/assets/images/kakao_apeach_avatar_1791097615635.jpg';
export const ALEX_AVATAR_FALLBACK = '/src/assets/images/happy_white_kitten_1791348895355.jpg';
export const STARBUCKS_GIFT_FALLBACK = '/src/assets/images/kakao_gift_starbucks_1791097637278.jpg';
export const CAKE_GIFT_FALLBACK = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=80';

// Known broken or expired URLs mapped to reliable replacements
const URL_MAPPINGS: Record<string, string> = {
  'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=400&auto=format&fit=crop&q=80': CAKE_GIFT_FALLBACK,
};

/**
 * Normalizes image URLs to ensure they load in all environments
 */
export function sanitizeImageUrl(url?: string | null, fallback = DEFAULT_AVATAR_SVG): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  const cleanUrl = url.trim();
  if (URL_MAPPINGS[cleanUrl]) {
    return URL_MAPPINGS[cleanUrl];
  }
  return cleanUrl;
}

/**
 * Handle image error for user and friend avatars
 */
export function handleAvatarError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  name?: string
) {
  const target = event.currentTarget;
  // Prevent infinite loops if fallback fails
  if (target.dataset.hasFailedOnce === 'true') {
    target.src = DEFAULT_AVATAR_SVG;
    return;
  }
  target.dataset.hasFailedOnce = 'true';

  const lowerName = (name || '').toLowerCase();
  if (lowerName.includes('choonsik')) {
    target.src = CHOONSIK_AVATAR_FALLBACK;
  } else if (lowerName.includes('ryan')) {
    target.src = RYAN_AVATAR_FALLBACK;
  } else if (lowerName.includes('apeach')) {
    target.src = APEACH_AVATAR_FALLBACK;
  } else if (lowerName.includes('alex')) {
    target.src = ALEX_AVATAR_FALLBACK;
  } else {
    target.src = DEFAULT_AVATAR_SVG;
  }
}

/**
 * Handle image error for gift shop items
 */
export function handleGiftError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  brandOrTitle?: string
) {
  const target = event.currentTarget;
  if (target.dataset.hasFailedOnce === 'true') {
    target.src = STARBUCKS_GIFT_FALLBACK;
    return;
  }
  target.dataset.hasFailedOnce = 'true';

  const lower = (brandOrTitle || '').toLowerCase();
  if (lower.includes('baskin') || lower.includes('cake') || lower.includes('cream')) {
    target.src = CAKE_GIFT_FALLBACK;
  } else if (lower.includes('pillow') || lower.includes('ryan')) {
    target.src = RYAN_AVATAR_FALLBACK;
  } else if (lower.includes('blanket') || lower.includes('potato') || lower.includes('choonsik')) {
    target.src = CHOONSIK_AVATAR_FALLBACK;
  } else {
    target.src = STARBUCKS_GIFT_FALLBACK;
  }
}
