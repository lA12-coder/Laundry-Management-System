/**
 * Integer-cent money math — avoids IEEE-754 drift in ledger reporting.
 */

const SCALE = 100n;

/** @param {string|number|null|undefined} value */
export function toCents(value) {
  if (value == null || value === "") return 0n;
  const raw = String(value).trim().replace(/,/g, "");
  const negative = raw.startsWith("-");
  const normalized = negative ? raw.slice(1) : raw;
  const [whole = "0", frac = ""] = normalized.split(".");
  const wholeDigits = whole.replace(/\D/g, "") || "0";
  const fracPadded = `${frac.replace(/\D/g, "")}00`.slice(0, 2);
  const cents = BigInt(wholeDigits) * SCALE + BigInt(fracPadded);
  return negative ? -cents : cents;
}

/** @param {bigint} cents */
export function fromCents(cents) {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = abs / SCALE;
  const frac = (abs % SCALE).toString().padStart(2, "0");
  const body = `${whole}.${frac}`;
  return negative ? `-${body}` : body;
}

/** @param {bigint[]} values */
export function sumCents(values) {
  return values.reduce((acc, v) => acc + v, 0n);
}

/**
 * @param {string|number|null|undefined} value
 * @returns {string} ETB display without float conversion
 */
export function formatMoneyETB(value) {
  const cents = toCents(value);
  const amount = fromCents(cents);
  const [whole, frac = "00"] = amount.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmedFrac = frac === "00" ? "" : `.${frac}`;
  return `ETB ${grouped}${trimmedFrac}`;
}

/** CSV-safe decimal string (no thousands separators). */
export function toDecimalString(value) {
  return fromCents(toCents(value));
}
