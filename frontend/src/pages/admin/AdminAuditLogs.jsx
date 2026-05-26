import { useAuth } from "../../hooks/useAuth";
import { Permission } from "../../lib/rbac";

export default function AdminAuditLogs() {
  const { hasPermission } = useAuth();

  if (!hasPermission(Permission.DELETE_AUDIT_LOGS)) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">Audit logs</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Super Admin only — includes destructive log purge actions.
      </p>
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
        Audit log viewer pending backend integration.
      </div>
    </div>
  );
}
