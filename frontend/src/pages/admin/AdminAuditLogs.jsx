import { useAuth } from "../../hooks/useAuth";
import { Permission } from "../../lib/rbac";
import AuditLogsWorkspace from "../../components/admin/audit/AuditLogsWorkspace";

export default function AdminAuditLogs() {
  const { hasPermission } = useAuth();

  if (!hasPermission(Permission.DELETE_AUDIT_LOGS)) {
    return null;
  }

  return (
    <AuditLogsWorkspace />
  );
}
