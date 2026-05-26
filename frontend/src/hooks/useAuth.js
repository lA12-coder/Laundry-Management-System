import { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { AuthContext } from "../context/AuthContext";
import { enrichUserFromToken } from "../lib/authSession";
import {
  resolveAccessLevel,
  hasPermission,
  getPostLoginPath,
  canAccessPath,
} from "../lib/rbac";
import { ACCESS_LEVEL_LABELS } from "../constants/roles";

/**
 * Unified auth + RBAC hook (Redux session + context actions).
 */
export function useAuth() {
  const context = useContext(AuthContext);
  const { user: rawUser, token, loading, isAuthenticated, error } = useSelector(
    (state) => state.auth,
  );

  const user = useMemo(
    () => enrichUserFromToken(rawUser, token),
    [rawUser, token],
  );

  const accessLevel = useMemo(() => resolveAccessLevel(user), [user]);

  const accessLabel = accessLevel ? ACCESS_LEVEL_LABELS[accessLevel] : null;

  return {
    ...context,
    user,
    token,
    loading,
    isAuthenticated,
    error,
    accessLevel,
    accessLabel,
    homePath: getPostLoginPath(user),
    canAccessPath: (pathname) => canAccessPath(user, pathname),
    hasPermission: (permission) => hasPermission(user, permission),
  };
}
