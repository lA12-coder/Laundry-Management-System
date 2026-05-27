function onlyDigits(value) {
  return (value || "").replace(/\D/g, "");
}

export function normalizePhoneInput(raw) {
  const value = String(raw || "").trim();
  if (!value) {
    throw new Error("Phone number is required.");
  }

  let digits = onlyDigits(value);
  if (!digits) {
    throw new Error("Phone number is required.");
  }

  if (digits.startsWith("0")) {
    digits = `251${digits.slice(1)}`;
  } else if (digits.startsWith("251")) {
    // already has country prefix without plus
  } else if (digits.length === 9 && digits.startsWith("9")) {
    digits = `251${digits}`;
  }

  const normalized = `+${digits}`;
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Use 09XXXXXXXX or +2519XXXXXXXX.");
  }
  return normalized;
}

export function isValidPhoneInput(raw) {
  try {
    normalizePhoneInput(raw);
    return true;
  } catch {
    return false;
  }
}
