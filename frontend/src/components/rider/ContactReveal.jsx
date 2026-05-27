import { Phone, User, MapPin, ShieldCheck, Lock } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Privacy wall UI — masks contact until assignment is accepted.
 */
export default function ContactReveal({ job }) {
  const accepted = Boolean(job?.is_assignment_accepted);

  if (!accepted) {
    return (
      <div className="rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
          <Lock size={16} />
          <p className="text-xs font-bold uppercase tracking-wider">
            Contact locked
          </p>
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-100/90 leading-relaxed">
          Customer phone and full delivery coordinates stay hidden until you accept
          this assignment.
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
          <MapPin size={14} className="text-emerald-400/80" />
          Region only:{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {job?.delivery_region || "—"}
          </span>
        </div>
      </div>
    );
  }

  const phone = job?.customer_phone;
  const telHref = phone ? `tel:${phone.replace(/\s/g, "")}` : undefined;

  return (
    <div className="rounded-2xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 space-y-4">
      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
        <ShieldCheck size={18} />
        <p className="text-xs font-bold uppercase tracking-wider">
          Contact revealed
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <User size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold">
              Customer
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {job?.customer_name || "Guest"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold">
              Delivery address
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">
              {job?.delivery_address || "—"}
            </p>
          </div>
        </div>

        {phone ? (
          <a
            href={telHref}
            className={cn(
              "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
              "bg-[#4c84a4] hover:bg-[#3a6680] text-white font-black text-sm transition-colors",
            )}
          >
            <Phone size={18} />
            Call {phone}
          </a>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">No phone on file for this customer.</p>
        )}
      </div>
    </div>
  );
}
