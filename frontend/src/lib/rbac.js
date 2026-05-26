import {
  AccessLevel,
  UserRole,
  ACCESS_LEVEL_VALUES,
  USER_ROLE_VALUES,
} from "../constants/roles";
import { isSessionActive } from "./authSession";

/** Fine-grained capability keys used by navigation and feature gates */
export const Permission = Object.freeze({
  VIEW_ADMIN_SHELL: "VIEW_ADMIN_SHELL",
  MANAGE_ORDERS: "MANAGE_ORDERS",
  MANAGE_CUSTOMERS: "MANAGE_CUSTOMERS",
  MANAGE_RIDERS: "MANAGE_RIDERS",
  MANAGE_PARTNERS: "MANAGE_PARTNERS",
  VIEW_FINANCIALS: "VIEW_FINANCIALS",
  EDIT_FINANCIALS: "EDIT_FINANCIALS",
  MANAGE_SETTINGS: "MANAGE_SETTINGS",
  DELETE_AUDIT_LOGS: "DELETE_AUDIT_LOGS",
  OVERRIDE_RIDER: "OVERRIDE_RIDER",
  VIEW_RIDER_QUEUE: "VIEW_RIDER_QUEUE",
  VIEW_CUSTOMER_DASHBOARD: "VIEW_CUSTOMER_DASHBOARD",
  VIEW_PRICING: "VIEW_PRICING",
  EDIT_PRICING: "EDIT_PRICING",
});

const PERMISSION_MATRIX = Object.freeze({
  [Permission.VIEW_ADMIN_SHELL]: [
    AccessLevel.SUPERADMIN,
    AccessLevel.ADMIN,
    AccessLevel.STAFF,
  ],
  [Permission.MANAGE_ORDERS]: [
    AccessLevel.SUPERADMIN,
    AccessLevel.ADMIN,
    AccessLevel.STAFF,
  ],
  [Permission.MANAGE_CUSTOMERS]: [
    AccessLevel.SUPERADMIN,
    AccessLevel.ADMIN,
    AccessLevel.STAFF,
  ],
  [Permission.MANAGE_RIDERS]: [AccessLevel.SUPERADMIN, AccessLevel.ADMIN],
  [Permission.MANAGE_PARTNERS]: [
    AccessLevel.SUPERADMIN,
    AccessLevel.ADMIN,
    AccessLevel.STAFF,
  ],
  [Permission.VIEW_FINANCIALS]: [
    AccessLevel.SUPERADMIN,
    AccessLevel.ADMIN,
    AccessLevel.STAFF,
  ],
  [Permission.EDIT_FINANCIALS]: [AccessLevel.SUPERADMIN, AccessLevel.ADMIN],
  [Permission.MANAGE_SETTINGS]: [AccessLevel.SUPERADMIN],
  [Permission.DELETE_AUDIT_LOGS]: [AccessLevel.SUPERADMIN],
  [Permission.OVERRIDE_RIDER]: [AccessLevel.SUPERADMIN, AccessLevel.ADMIN],
  [Permission.VIEW_RIDER_QUEUE]: [AccessLevel.RIDER],
  [Permission.VIEW_CUSTOMER_DASHBOARD]: [AccessLevel.CUSTOMER],
  [Permission.VIEW_PRICING]: [
    AccessLevel.SUPERADMIN,
    AccessLevel.ADMIN,
    AccessLevel.STAFF,
  ],
  [Permission.EDIT_PRICING]: [AccessLevel.SUPERADMIN, AccessLevel.ADMIN],
});

/**
 * Resolve hierarchical access level from Django user + JWT metadata.
 *
 * @param {object|null|undefined} user
 * @returns {string|null}
 */
export function resolveAccessLevel(user) {
  if (!isSessionActive(user)) return null;

  if (user.is_superuser) return AccessLevel.SUPERADMIN;

  if (user.role === UserRole.ADMIN) {
    return user.is_staff ? AccessLevel.ADMIN : AccessLevel.STAFF;
  }

  const roleMap = {
    [UserRole.RIDER]: AccessLevel.RIDER,
    [UserRole.CUSTOMER]: AccessLevel.CUSTOMER,
    [UserRole.PARTNER]: AccessLevel.PARTNER,
  };

  return roleMap[user.role] ?? null;
}

/**
 * Normalize allowedRoles prop — accepts AccessLevel or UserRole strings.
 *
 * @param {string[]} allowedRoles
 * @returns {string[]}
 */
export function normalizeAllowedLevels(allowedRoles = []) {
  const levels = new Set();

  for (const entry of allowedRoles) {
    if (ACCESS_LEVEL_VALUES.includes(entry)) {
      levels.add(entry);
      continue;
    }
    if (USER_ROLE_VALUES.includes(entry)) {
      if (entry === UserRole.ADMIN) {
        levels.add(AccessLevel.ADMIN);
        levels.add(AccessLevel.STAFF);
        levels.add(AccessLevel.SUPERADMIN);
      } else if (entry === UserRole.RIDER) levels.add(AccessLevel.RIDER);
      else if (entry === UserRole.CUSTOMER) levels.add(AccessLevel.CUSTOMER);
      else if (entry === UserRole.PARTNER) levels.add(AccessLevel.PARTNER);
    }
  }

  return Array.from(levels);
}

/**
 * @param {object|null|undefined} user
 * @param {string[]} allowedRoles
 * @returns {boolean}
 */
export function isAccessAllowed(user, allowedRoles = []) {
  const level = resolveAccessLevel(user);
  if (!level) return false;
  const normalized = normalizeAllowedLevels(allowedRoles);
  if (normalized.length === 0) return true;
  return normalized.includes(level);
}

/**
 * @param {object|null|undefined} user
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(user, permission) {
  const level = resolveAccessLevel(user);
  if (!level) return false;
  const allowed = PERMISSION_MATRIX[permission];
  return Boolean(allowed?.includes(level));
}

/**
 * Post-authentication landing route by access level.
 *
 * @param {object|null|undefined} user
 * @returns {string}
 */
export function getPostLoginPath(user) {
  const level = resolveAccessLevel(user);
  switch (level) {
    case AccessLevel.SUPERADMIN:
    case AccessLevel.ADMIN:
    case AccessLevel.STAFF:
      return "/admin";
    case AccessLevel.RIDER:
      return "/rider";
    case AccessLevel.CUSTOMER:
      return "/dashboard";
    case AccessLevel.PARTNER:
      return "/unauthorized";
    default:
      return "/login";
  }
}

/**
 * Route guard for role-scoped areas (prevents cross-tier URL probing).
 *
 * @param {object|null|undefined} user
 * @param {string} pathname
 * @returns {boolean}
 */
export function canAccessPath(user, pathname) {
  const level = resolveAccessLevel(user);
  if (!level) return false;

  if (pathname.startsWith("/admin")) {
    return hasPermission(user, Permission.VIEW_ADMIN_SHELL);
  }
  if (pathname.startsWith("/rider")) {
    return level === AccessLevel.RIDER;
  }
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/profile")
  ) {
    return level === AccessLevel.CUSTOMER;
  }
  return true;
}
