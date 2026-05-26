import { UserRole } from "../constants/roles";

/**
 * Decode JWT payload without verification (client-side metadata only).
 * Authorization remains enforced server-side.
 *
 * @param {string|null} token
 * @returns {Record<string, unknown>|null}
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Merge API user profile with JWT claims (role, active flags).
 *
 * @param {object|null} user
 * @param {string|null} token
 * @returns {object|null}
 */
export function enrichUserFromToken(user, token) {
  if (!user) return null;
  const claims = decodeJwtPayload(token);
  if (!claims) return user;

  return {
    ...user,
    role: user.role ?? claims.role,
    is_verified: user.is_verified ?? claims.is_verified,
    is_active: user.is_active ?? claims.is_active,
    is_staff: user.is_staff ?? claims.is_staff,
    is_superuser: user.is_superuser ?? claims.is_superuser,
  };
}

/**
 * @param {object|null} user
 * @returns {boolean}
 */
export function isSessionActive(user) {
  return Boolean(user && user.is_active !== false);
}

/**
 * @param {object|null} user
 * @returns {boolean}
 */
export function isInternalOperator(user) {
  return (
    user?.is_superuser ||
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.RIDER ||
    user?.role === UserRole.PARTNER
  );
}
