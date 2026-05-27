import { Package } from "lucide-react";

export default function ClothItemsPanel({ items, riderReviewComment = "", riderReviewRating = null }) {
  if (!items?.length) {
    return (
      <div className="px-6 py-4 bg-gray-50/80 dark:bg-gray-800/60 text-sm text-gray-400 dark:text-gray-500 italic border-t border-gray-100 dark:border-gray-800">
        No cloth line items on this order.
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-gradient-to-r from-blue-50/60 dark:from-sky-950/30 to-transparent border-t border-blue-100 dark:border-gray-800">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <Package size={13} />
        Cloth items ({items.length})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <th className="pb-2 pr-4 font-bold">Item</th>
              <th className="pb-2 pr-4 font-bold">Size</th>
              <th className="pb-2 pr-4 font-bold">Qty</th>
              <th className="pb-2 pr-4 font-bold">Unit (ETB)</th>
              <th className="pb-2 font-bold">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="text-gray-800 dark:text-gray-200">
                <td className="py-2 pr-4 font-semibold">{item.cloth_name}</td>
                <td className="py-2 pr-4 capitalize text-gray-500 dark:text-gray-400">{item.size}</td>
                <td className="py-2 pr-4 font-bold">×{item.quantity}</td>
                <td className="py-2 pr-4">
                  {parseFloat(item.fua_price || 0).toLocaleString()}
                </td>
                <td className="py-2 font-bold text-[#4c84a4] dark:text-sky-300">
                  ETB{" "}
                  {parseFloat(
                    item.line_total ?? item.fua_price * item.quantity,
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(riderReviewComment || riderReviewRating) && (
        <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20 p-3">
          <p className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">
            Customer rider feedback
          </p>
          {riderReviewRating ? (
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 mt-1">
              Rating: {riderReviewRating}/5
            </p>
          ) : null}
          {riderReviewComment ? (
            <p className="text-xs text-amber-900 dark:text-amber-100 mt-1 leading-relaxed">
              {riderReviewComment}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
