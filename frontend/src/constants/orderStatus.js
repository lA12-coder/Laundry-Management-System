/**
 * Mirrors backend orders.models.Order.Status (TextChoices).
 * API values are lowercase snake_case.
 */
export const OrderStatus = Object.freeze({
  PENDING: "pending",
  PICKED_UP: "picked_up",
  WASHING: "washing",
  READY: "ready",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
});

export const ORDER_STATUS_VALUES = Object.freeze(Object.values(OrderStatus));

export const ORDER_STATUS_LABELS = Object.freeze({
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.PICKED_UP]: "Picked Up",
  [OrderStatus.WASHING]: "Washing",
  [OrderStatus.READY]: "Ready",
  [OrderStatus.OUT_FOR_DELIVERY]: "Out for Delivery",
  [OrderStatus.DELIVERED]: "Delivered",
  [OrderStatus.CANCELLED]: "Cancelled",
});

export const OrderUrgency = Object.freeze({
  REGULAR: "regular",
  URGENT: "urgent",
});

export const ORDER_STATUS_STYLES = Object.freeze({
  [OrderStatus.PENDING]: "bg-amber-100 text-amber-800 border-amber-200",
  [OrderStatus.PICKED_UP]: "bg-blue-100 text-blue-800 border-blue-200",
  [OrderStatus.WASHING]: "bg-purple-100 text-purple-800 border-purple-200",
  [OrderStatus.READY]: "bg-cyan-100 text-cyan-800 border-cyan-200",
  [OrderStatus.OUT_FOR_DELIVERY]: "bg-orange-100 text-orange-800 border-orange-200",
  [OrderStatus.DELIVERED]: "bg-green-100 text-green-800 border-green-200",
  [OrderStatus.CANCELLED]: "bg-red-100 text-red-800 border-red-200",
});

/** Statuses that require explicit confirmation before override */
export const ORDER_STATUS_REQUIRES_CONFIRMATION = Object.freeze([
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
]);

export function formatOrderStatus(status) {
  return ORDER_STATUS_LABELS[status] || String(status || "").replace(/_/g, " ");
}
