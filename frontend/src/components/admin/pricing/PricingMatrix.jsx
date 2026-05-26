import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { sortCategories } from "../../../services/categoriesApi";
import { OrderTableSkeleton } from "../orders/SkeletonCard";
import PricingMatrixRow from "./PricingMatrixRow";

export default function PricingMatrix({
  entries,
  categories,
  isLoading,
  canEdit,
  savingId,
  onSaveRow,
  onDeactivateRow,
}) {
  const [collapsed, setCollapsed] = useState({});

  const sortedCategories = useMemo(
    () => sortCategories(categories.filter((c) => c.is_active !== false)),
    [categories],
  );

  const grouped = useMemo(() => {
    const map = {};
    for (const cat of sortedCategories) {
      map[cat.id] = [];
    }
    const uncategorized = [];
    for (const entry of entries) {
      const catId = entry.category;
      if (map[catId]) {
        map[catId].push(entry);
      } else {
        uncategorized.push(entry);
      }
    }
    return { map, uncategorized };
  }, [entries, sortedCategories]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <OrderTableSkeleton rows={10} columns={7} />
      </div>
    );
  }

  if (sortedCategories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400">
        Create at least one category above to organize catalogue items.
      </div>
    );
  }

  const sections = [
    ...sortedCategories.map((cat) => ({ type: "category", data: cat })),
    ...(grouped.uncategorized.length
      ? [{ type: "uncategorized", data: { id: "uncategorized", name: "Uncategorized" } }]
      : []),
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const category = section.data;
        const rows =
          section.type === "uncategorized"
            ? grouped.uncategorized
            : grouped.map[category.id] || [];
        const isOpen = collapsed[category.id] !== true;

        return (
          <section
            key={category.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                setCollapsed((c) => ({
                  ...c,
                  [category.id]: !isOpen ? true : false,
                }))
              }
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#4c84a4]/10 flex items-center justify-center">
                  <Layers size={18} className="text-[#4c84a4]" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-black text-gray-900">{category.name}</h2>
                  <p className="text-xs text-gray-400">
                    {rows.length} SKU{rows.length !== 1 ? "s" : ""}
                    {category.slug && (
                      <span className="ml-2 font-mono text-gray-300">{category.slug}</span>
                    )}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-gray-400">
                {isOpen ? "Collapse" : "Expand"}
              </span>
            </button>

            {isOpen && (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[100px]">Image</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Fua Price ETB</TableHead>
                    <TableHead>Partner ETB</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead className="w-24">{canEdit ? "Actions" : ""}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-sm text-gray-400 italic py-8"
                      >
                        No items in this category yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((entry) => (
                      <PricingMatrixRow
                        key={entry.id}
                        entry={entry}
                        categories={sortedCategories}
                        canEdit={canEdit}
                        isSaving={savingId === entry.id}
                        onSave={onSaveRow}
                        onDeactivate={onDeactivateRow}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </section>
        );
      })}
    </div>
  );
}
