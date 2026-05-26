import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ACCESS_LEVEL_LABELS } from "../constants/roles";

export default function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, accessLevel, accessLabel, homePath } = useAuth();

  const transactionId = `TX-${Date.now().toString(36).toUpperCase()}`;
  const attemptedPath = location.state?.from || location.pathname;
  const requiredRoles = location.state?.requiredRoles ?? [];
  const timestamp = new Date().toISOString();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full border border-white/20 rounded-2xl p-8 sm:p-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <ShieldOff className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">
              Access Denied
            </p>
            <h1 className="text-2xl font-black tracking-tight">Unauthorized</h1>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed mb-8">
          Your credentials are valid, but this resource is outside your assigned
          hierarchy level. Access attempts are logged for security review.
        </p>

        <dl className="space-y-3 text-xs font-mono bg-white/5 border border-white/10 rounded-xl p-4 mb-8">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Transaction</dt>
            <dd className="text-right text-amber-300">{transactionId}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Timestamp</dt>
            <dd className="text-right text-gray-200">{timestamp}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Requested path</dt>
            <dd className="text-right text-gray-200 break-all">{attemptedPath}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Your level</dt>
            <dd className="text-right text-gray-200">
              {accessLabel || ACCESS_LEVEL_LABELS[accessLevel] || user?.role || "unknown"}
            </dd>
          </div>
          {requiredRoles.length > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Required</dt>
              <dd className="text-right text-gray-200">{requiredRoles.join(", ")}</dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Account status</dt>
            <dd className="text-right text-gray-200">
              {user?.is_active === false ? "inactive" : "active"}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
          <Link
            to={homePath || "/"}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-black hover:bg-gray-200 transition-colors text-sm font-bold"
          >
            <Home size={16} />
            Safe home
          </Link>
        </div>
      </div>
    </div>
  );
}
