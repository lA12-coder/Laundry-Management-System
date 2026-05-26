from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from orders.models import Order


def _hub_name(order: Order) -> str:
    if order.partner_id:
        return order.partner.business_name
    return "Fua Laundry"


def format_order_status_notification(order: Order) -> str:
    """Localized status copy for customer notification hub."""
    status_token = order.status.upper().replace("-", "_")
    hub = _hub_name(order)
    return (
        f"Your garments entered processing state `{status_token}` at {hub}."
    )
