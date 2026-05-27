import { useState } from "react";
import { MapPin, ShieldCheck, Smartphone } from "lucide-react";
import { getRiderPosition, geolocationErrorMessage } from "../../lib/geolocation";

export default function RiderSettings() {
  const [locationText, setLocationText] = useState("");
  const [checking, setChecking] = useState(false);

  const testLocation = async () => {
    setChecking(true);
    try {
      const coords = await getRiderPosition();
      setLocationText(`GPS ready: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    } catch (error) {
      setLocationText(geolocationErrorMessage(error));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rider settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Device checks and privacy guardrails for secure delivery operations.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 mb-3">
            <MapPin className="text-emerald-600 dark:text-emerald-300" size={18} />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Location diagnostics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Confirm GPS is available before accepting jobs.
          </p>
          <button
            type="button"
            onClick={testLocation}
            disabled={checking}
            className="mt-4 px-4 py-2 rounded-xl bg-[#4c84a4] hover:bg-[#3a6680] text-white font-semibold text-sm disabled:opacity-60"
          >
            {checking ? "Checking..." : "Test location"}
          </button>
          {locationText && (
            <p className="text-xs mt-3 text-slate-600 dark:text-slate-300">{locationText}</p>
          )}
        </article>

        <article className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 mb-3">
            <Smartphone className="text-slate-600 dark:text-slate-300" size={18} />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Device tips</h2>
          <ul className="mt-2 text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <li>Keep battery saver off while navigating.</li>
            <li>Allow precise location for your browser.</li>
            <li>Use stable mobile data for route refresh.</li>
          </ul>
        </article>

        <article className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 mb-3">
            <ShieldCheck className="text-amber-600 dark:text-amber-300" size={18} />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Privacy policy</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Customer contact details are unlocked only after assignment acceptance.
          </p>
        </article>
      </section>
    </div>
  );
}
