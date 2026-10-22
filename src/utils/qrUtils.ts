import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { KakaoUser } from '../types/kakaotalk';

export interface AmigosQRPayload {
  type: 'amigos_profile' | 'amigos_pay';
  id: string;
  name: string;
  avatar: string;
  kakaoId?: string;
  phone?: string;
  status?: string;
  timestamp?: number;
}

/**
 * Generate a standardized, unique QR payload string for a user
 */
export function generateUserQRData(user?: Partial<KakaoUser> | null): string {
  const safeId = user?.id ? String(user.id) : 'me';
  const safeName = user?.name ? String(user.name) : 'Amigos User';
  const safeAvatar = user?.avatar ? String(user.avatar) : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
  const safeKakaoId = user?.kakaoId ? String(user.kakaoId) : safeId.replace('user_', '');
  const safePhone = user?.phone ? String(user.phone) : '010-0000-0000';
  const safeStatus = user?.statusMessage ? String(user.statusMessage) : 'Connected on Amigos';

  const payload: AmigosQRPayload = {
    type: 'amigos_profile',
    id: safeId,
    name: safeName,
    avatar: safeAvatar,
    kakaoId: safeKakaoId,
    phone: safePhone,
    status: safeStatus,
    timestamp: Date.now(),
  };

  try {
    return `amigos://profile?data=${encodeURIComponent(JSON.stringify(payload))}`;
  } catch {
    return `amigos://profile?id=${encodeURIComponent(safeId)}&name=${encodeURIComponent(safeName)}`;
  }
}

/**
 * Generate unique Amigos Pay merchant/transfer QR payload
 */
export function generatePayQRData(user: KakaoUser, amount?: number): string {
  const payload = {
    type: 'amigos_pay',
    id: user.id,
    name: user.name,
    code: `AP-${user.id.slice(-6).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
    amount: amount || 0,
    timestamp: Date.now(),
  };
  return `amigos://pay?data=${encodeURIComponent(JSON.stringify(payload))}`;
}

/**
 * Parse QR string into Amigos user or payload
 */
export function parseUserQRData(qrString: string): AmigosQRPayload | null {
  if (!qrString || typeof qrString !== 'string') return null;

  try {
    // Format 1: amigos://profile?data=...
    if (qrString.startsWith('amigos://profile?data=')) {
      const encoded = qrString.replace('amigos://profile?data=', '');
      const parsed = JSON.parse(decodeURIComponent(encoded));
      if (parsed && parsed.id && parsed.name) {
        return parsed as AmigosQRPayload;
      }
    }

    // Format 2: Direct JSON
    if (qrString.startsWith('{') && qrString.endsWith('}')) {
      const parsed = JSON.parse(qrString);
      if (parsed && parsed.id && parsed.name) {
        return parsed as AmigosQRPayload;
      }
    }

    // Format 3: URL format https://amigos.app/u/...
    if (qrString.includes('amigos.app') || qrString.includes('profile')) {
      const url = new URL(qrString.startsWith('http') ? qrString : `https://${qrString}`);
      const id = url.searchParams.get('id') || 'scanned_user';
      const name = url.searchParams.get('name') || 'Amigos Friend';
      const avatar = url.searchParams.get('avatar') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
      const handle = url.searchParams.get('handle') || 'amigos_user';
      return {
        type: 'amigos_profile',
        id,
        name,
        avatar,
        kakaoId: handle,
      };
    }
  } catch (err) {
    console.error('Error parsing QR data:', err);
  }

  return null;
}

/**
 * Render QR Code data to a data URL (PNG)
 */
export async function generateQRCodeDataUrl(
  data: string,
  options?: {
    width?: number;
    color?: { dark?: string; light?: string };
  }
): Promise<string> {
  return QRCode.toDataURL(data, {
    width: options?.width || 280,
    margin: 2,
    color: {
      dark: options?.color?.dark || '#191919',
      light: options?.color?.light || '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  });
}

/**
 * Decode QR Code from an HTML Image Element or Canvas
 */
export function decodeQRFromCanvas(canvas: HTMLCanvasElement): string | null {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return code ? code.data : null;
}
