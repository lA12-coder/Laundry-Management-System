/**
 * Mirrors backend accounts.models.User.Role (TextChoices).
 * Values MUST stay identical to Django — used in API payloads and JWT claims.
 */
export const UserRole = Object.freeze({
  ADMIN: "admin",
  RIDER: "rider",
  CUSTOMER: "customer",
  PARTNER: "partner",
});

/** All backend role string values */
export const USER_ROLE_VALUES = Object.freeze(Object.values(UserRole));

/**
 * Frontend access tiers derived from JWT/user metadata.
 * Maps hierarchical controls (SUPERADMIN → CUSTOMER) onto Django fields:
 *   - is_superuser → SUPERADMIN
 *   - role=admin + is_staff → ADMIN (aligns with IsStaffAdminRole)
 *   - role=admin + !is_staff → STAFF
 *   - role field otherwise → RIDER | CUSTOMER | PARTNER
 */
export const AccessLevel = Object.freeze({
  SUPERADMIN: "SUPERADMIN",
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  RIDER: "RIDER",
  CUSTOMER: "CUSTOMER",
  PARTNER: "PARTNER",
});

export const ACCESS_LEVEL_VALUES = Object.freeze(Object.values(AccessLevel));

/** Human-readable labels for UI */
export const ACCESS_LEVEL_LABELS = Object.freeze({
  [AccessLevel.SUPERADMIN]: "Super Admin",
  [AccessLevel.ADMIN]: "Administrator",
  [AccessLevel.STAFF]: "Operations Staff",
  [AccessLevel.RIDER]: "Delivery Rider",
  [AccessLevel.CUSTOMER]: "Customer",
  [AccessLevel.PARTNER]: "Partner Laundry",
});

/**
 * @param {string} role - Raw role from API/JWT
 * @returns {boolean}
 */
export function isValidUserRole(role) {
  return USER_ROLE_VALUES.includes(role);
}
