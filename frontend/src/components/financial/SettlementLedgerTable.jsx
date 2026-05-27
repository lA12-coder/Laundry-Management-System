import { formatMoneyETB } from "../../lib/money";

function SettlementBadge({ status }) {
  const isPaid = status === "paid";
  return (
    <span
      className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
        isPaid
          ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
      }`}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}

export default function SettlementLedgerTable({
  rows = [],
  title = "Settlement ledger",
  summary = null,
}) {
  return (
    <section className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">
          {title}
        </h3>
        {summary && (
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex gap-4">
            <span>
              Paid:{" "}
              <span className="text-emerald-600 dark:text-emerald-300">
                {formatMoneyETB(summary.paid || 0)}
              </span>
            </span>
            <span>
              Unpaid:{" "}
              <span className="text-amber-600 dark:text-amber-300">
                {formatMoneyETB(summary.unpaid || 0)}
              </span>
            </span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-gray-50/80 dark:bg-gray-800/70 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Partner</th>
              <th className="text-left px-4 py-3">Net share</th>
              <th className="text-left px-4 py-3">Paid amount</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Payment date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  No settlement rows found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-50 dark:border-gray-800 text-sm text-gray-700 dark:text-gray-200"
                >
                  <td className="px-4 py-3 font-mono">#{row.order_id}</td>
                  <td className="px-4 py-3">{row.partner_name || "—"}</td>
                  <td className="px-4 py-3 font-semibold">
                    {formatMoneyETB(row.partner_earning)}
                  </td>
                  <td className="px-4 py-3">{formatMoneyETB(row.paid_amount || 0)}</td>
                  <td className="px-4 py-3">
                    <SettlementBadge status={row.settlement_status} />
                  </td>
                  <td className="px-4 py-3">
                    {row.payment_date
                      ? new Date(row.payment_date).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
