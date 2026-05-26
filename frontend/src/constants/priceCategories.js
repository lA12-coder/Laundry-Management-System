/**
 * Cloth sizes — still fixed on PriceList model (backend Size TextChoices).
 */
export const ClothSize = Object.freeze({
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
});

export const CLOTH_SIZE_VALUES = Object.freeze(Object.values(ClothSize));

export const CLOTH_SIZE_LABELS = Object.freeze({
  [ClothSize.SMALL]: "Small",
  [ClothSize.MEDIUM]: "Medium",
  [ClothSize.LARGE]: "Large",
});
