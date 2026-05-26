import { toDecimalString } from "./money";

const CSV_HEADERS = [
  "Order ID",
  "Base Value",
  "Fua Commission",
  "Operator Fee",
  "Net Laundromat Payout",
  "Processing Datetime",
];

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {Array<{
 *   order_id: number,
 *   base_value: string|number,
 *   fualaundry_commission: string|number,
 *   rider_fee: string|number,
 *   partner_earning: string|number,
 *   created_at: string,
 * }>} rows
 * @returns {string}
 */
export function buildTransactionLogCsv(rows) {
  const lines = [CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.order_id,
        toDecimalString(row.base_value),
        toDecimalString(row.fualaundry_commission),
        toDecimalString(row.rider_fee),
        toDecimalString(row.partner_earning),
        row.created_at,
      ]
        .map(escapeCsvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}

/**
 * @param {string} csv
 * @param {string} [filename]
 */
export function downloadCsvFile(csv, filename = "fua-transaction-ledger.csv") {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
