import crypto from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'rege_admin_session';

const DEFAULT_PASSWORD = 'rege2025';
const DEFAULT_SECRET = 'rege_antigravity_secret_key_2025_signature';

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

export function getAdminSecret(): string {
  return process.env.ADMIN_SECRET || DEFAULT_SECRET;
}

/**
 * Creates a signed session token: timestamp.hmac
 */
export function createSessionToken(): string {
  const timestamp = Date.now().toString();
  const secret = getAdminSecret();
  const signature = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  return `${timestamp}.${signature}`;
}

/**
 * Validates session token
 */
export function verifySessionToken(token: string): boolean {
  if (!token || !token.includes('.')) return false;
  const [timestamp, signature] = token.split('.');
  if (!timestamp || !signature) return false;

  // Verify HMAC
  const secret = getAdminSecret();
  const expectedSignature = crypto.createHmac('sha256', secret).update(timestamp).digest('hex');
  if (signature !== expectedSignature) return false;

  // Max age: 7 days
  const time = parseInt(timestamp, 10);
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (isNaN(time) || Date.now() - time > maxAgeMs) {
    return false;
  }

  return true;
}

/**
 * Checks if request has a valid admin session
 */
export function isRequestAuthenticated(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  // Check the new signed session token
  const sessionToken = cookies[ADMIN_COOKIE_NAME];
  if (sessionToken && verifySessionToken(sessionToken)) {
    return true;
  }

  // Fallback compatibility with existing rege_admin cookie
  if (cookies['rege_admin'] === 'ok') {
    return true;
  }

  return false;
}

/**
 * Helper to build Set-Cookie header string
 */
export function buildAuthCookie(token: string, maxAgeSeconds: number = 7 * 86400): string {
  const isProd = process.env.NODE_ENV === 'production';
  return `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isProd ? '; Secure' : ''}`;
}

export function buildClearCookie(): string {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
