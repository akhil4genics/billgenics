import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import geoip from 'geoip-lite';
import { Request } from 'express';
import {
  ELoginActivityStatus,
  ILoginActivityEntry,
  IUser,
} from '../models/User';

// Tunables — kept local so the lockout policy is one place to edit.
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
export const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const ACTIVITY_LOG_CAP = 50;
export const KNOWN_IPS_CAP = 10;
export const KNOWN_COUNTRIES_CAP = 10;

export interface RequestContext {
  ip: string;
  country?: string;
  userAgent?: string;
}

export function extractRequestContext(req: Request): RequestContext {
  // app.set('trust proxy', true) makes req.ip honour X-Forwarded-For correctly.
  const ip = (req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
  const userAgent = req.get('user-agent') || undefined;
  let country: string | undefined;
  if (ip && !isLocalIp(ip)) {
    const geo = geoip.lookup(ip);
    if (geo?.country) country = geo.country;
  }
  return { ip, country, userAgent };
}

function isLocalIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}

export function isLocked(user: IUser): boolean {
  const lockedUntil = user.loginSecurity?.lockedUntil;
  return Boolean(lockedUntil && new Date(lockedUntil) > new Date());
}

/** Record a failed password attempt. Locks account after MAX_FAILED_ATTEMPTS. */
export function registerFailedAttempt(user: IUser): { locked: boolean } {
  user.loginSecurity.failedLoginAttempts = (user.loginSecurity.failedLoginAttempts || 0) + 1;
  if (user.loginSecurity.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    user.loginSecurity.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    user.loginSecurity.failedLoginAttempts = 0;
    return { locked: true };
  }
  return { locked: false };
}

/** Reset the failed-attempt counter after a successful password validation. */
export function clearFailedAttempts(user: IUser): void {
  user.loginSecurity.failedLoginAttempts = 0;
  user.loginSecurity.lockedUntil = null;
}

/**
 * Has this user signed in successfully from this country/IP before?
 * "Trust on first use" — first ever sign-in counts as known so newly-verified
 * users aren't immediately challenged on their next login.
 */
export function isKnownDevice(user: IUser, ctx: RequestContext): boolean {
  const sec = user.loginSecurity;
  const noHistoryYet =
    (sec.knownCountries?.length || 0) === 0 && (sec.knownIPs?.length || 0) === 0;
  if (noHistoryYet) return true;
  if (ctx.country && sec.knownCountries?.includes(ctx.country)) return true;
  if (ctx.ip && sec.knownIPs?.includes(ctx.ip)) return true;
  return false;
}

/** Promote the current device to "known" so future logins skip the challenge. */
export function markDeviceKnown(user: IUser, ctx: RequestContext): void {
  const sec = user.loginSecurity;
  if (ctx.country) {
    if (!sec.knownCountries.includes(ctx.country)) sec.knownCountries.push(ctx.country);
    if (sec.knownCountries.length > KNOWN_COUNTRIES_CAP) {
      sec.knownCountries.splice(0, sec.knownCountries.length - KNOWN_COUNTRIES_CAP);
    }
  }
  if (ctx.ip) {
    if (!sec.knownIPs.includes(ctx.ip)) sec.knownIPs.push(ctx.ip);
    if (sec.knownIPs.length > KNOWN_IPS_CAP) {
      sec.knownIPs.splice(0, sec.knownIPs.length - KNOWN_IPS_CAP);
    }
  }
}

/** Append an activity entry, FIFO-capped at ACTIVITY_LOG_CAP. */
export function recordActivity(
  user: IUser,
  status: ELoginActivityStatus,
  ctx: RequestContext
): void {
  const entry: ILoginActivityEntry = {
    ipAddress: ctx.ip || undefined,
    country: ctx.country,
    userAgent: ctx.userAgent,
    status,
    timestamp: new Date(),
  };
  user.loginSecurity.recentActivity.push(entry);
  if (user.loginSecurity.recentActivity.length > ACTIVITY_LOG_CAP) {
    user.loginSecurity.recentActivity.splice(
      0,
      user.loginSecurity.recentActivity.length - ACTIVITY_LOG_CAP
    );
  }
}

/** Generate a 6-digit numeric code; store its bcrypt hash on the user. */
export async function issueLoginChallenge(
  user: IUser,
  ctx: RequestContext
): Promise<{ challengeId: string; code: string }> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const codeHash = await bcrypt.hash(code, 10);
  const challengeId = crypto.randomBytes(16).toString('hex');
  user.loginSecurity.pendingLoginChallenge = {
    id: challengeId,
    codeHash,
    expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
    ipAddress: ctx.ip,
    country: ctx.country,
    userAgent: ctx.userAgent,
  };
  return { challengeId, code };
}

export type ChallengeOutcome =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'expired' | 'mismatch' };

/** Verify a submitted challenge code against the stored hash. */
export async function verifyLoginChallenge(
  user: IUser,
  challengeId: string,
  code: string
): Promise<ChallengeOutcome> {
  const challenge = user.loginSecurity.pendingLoginChallenge;
  if (!challenge || !challenge.id) return { ok: false, reason: 'invalid' };
  if (challenge.id !== challengeId) return { ok: false, reason: 'mismatch' };
  if (new Date(challenge.expiresAt) < new Date()) return { ok: false, reason: 'expired' };
  const matches = await bcrypt.compare(code, challenge.codeHash);
  if (!matches) return { ok: false, reason: 'mismatch' };
  return { ok: true };
}

export function clearLoginChallenge(user: IUser): void {
  user.loginSecurity.pendingLoginChallenge = null;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
}
