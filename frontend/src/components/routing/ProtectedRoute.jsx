import { Navigate, useLocation } from "react-router-dom";
import LaundryLoader from "../common/LaundryLoader";
import { useAuth } from "../../hooks/useAuth";
import { isAccessAllowed, canAccessPath, resolveAccessLevel } from "../../lib/rbac";
import { isSessionActive } from "../../lib/authSession";
import { UserRole } from "../../constants/roles";

/**
 * State-driven RBAC route guard.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.allowedRoles] - AccessLevel and/or UserRole values
 * @param {boolean} [props.requireActive=true] - Block inactive accounts
 * @param {boolean} [props.allowGhost=false] - Allow inactive ghost customers (temporary link funnel)
 */
export default function ProtectedRoute({
  children,
  allowedRoles = [],
  requireActive = true,
  allowGhost = false,
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LaundryLoader />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isGhostCustomer =
    user?.role === UserRole.CUSTOMER && user?.is_active === false;

  if (requireActive && !isSessionActive(user)) {
    if (allowGhost && isGhostCustomer) {
      return children;
    }
    if (isGhostCustomer) {
      return (
        <Navigate
          to="/claim-account"
          state={{ from: location, phone: user.phone_number }}
          replace
        />
      );
    }
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: "Your account is inactive. Contact support to restore access.",
        }}
        replace
      />
    );
  }

  const accessLevel = resolveAccessLevel(user);

  if (allowedRoles.length > 0 && !isAccessAllowed(user, allowedRoles)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location.pathname,
          requiredRoles: allowedRoles,
          userRole: user.role,
          accessLevel,
        }}
        replace
      />
    );
  }

  if (!canAccessPath(user, location.pathname)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          from: location.pathname,
          requiredRoles: allowedRoles,
          userRole: user.role,
          accessLevel,
        }}
        replace
      />
    );
  }

  return children;
}
