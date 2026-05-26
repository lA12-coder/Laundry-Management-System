from decimal import Decimal
from django.db.models import Count, Q
from .models import Order, ClothItem, TransactionLog, PriceList


URGENT_FEE = Decimal('20.00')

def calculate_order_price(items_data, is_urgent=False):
    """
    Calculates total_amount (customer-facing) and base_price (our partner cost)
    for an order by looking up prices from the PriceList catalogue.

    Each item dict must contain:
        - price_list_entry_id  (int) — FK to PriceList
        - quantity             (int)

    Returns a tuple: (total_amount, base_price)
    Raises ValueError if any price_list_entry_id is missing or inactive.
    """
    total_amount = Decimal('0.00')
    base_price = Decimal('0.00')

    # Bulk-fetch all needed PriceList entries in one query
    entry_ids = [item.get('price_list_entry_id') for item in items_data if item.get('price_list_entry_id')]
    price_map = {
        entry.pk: entry
        for entry in PriceList.objects.filter(pk__in=entry_ids, is_active=True)
    }

    for item in items_data:
        entry_id = item.get('price_list_entry_id')
        qty = int(item.get('quantity', 1))

        if not entry_id:
            raise ValueError(
                f"Item '{item.get('cloth_name', '?')}' is missing a price_list_entry_id. "
                "All items must reference a valid PriceList entry."
            )

        entry = price_map.get(entry_id)
        if not entry:
            raise ValueError(
                f"PriceList entry #{entry_id} does not exist or is inactive. "
                "Please select a valid item from the catalogue."
            )

        total_amount += entry.fua_price * qty
        base_price += entry.partner_price * qty

    if is_urgent:
        total_amount += URGENT_FEE

    return total_amount, base_price


def build_cloth_items(order, items_data, price_map):
    """
    Bulk-creates ClothItem rows from items_data using pre-fetched price_map.
    Called inside a transaction.atomic() block during order creation.
    """
    cloth_items = []
    for item in items_data:
        entry = price_map[item['price_list_entry_id']]
        cloth_items.append(ClothItem(
            order=order,
            price_list_entry=entry,
            cloth_name=entry.cloth_name,
            size=entry.size,
            quantity=int(item.get('quantity', 1)),
            fua_price=entry.fua_price,
            partner_price=entry.partner_price,
        ))
    ClothItem.objects.bulk_create(cloth_items)


def assign_least_loaded_rider(available_riders_qs, *, prefer_urgent=False):
    """
    Finds the active rider with the fewest non-delivered orders (load balancing).
    When prefer_urgent is True, riders with fewer active urgent assignments are favored.
    """
    if not available_riders_qs.exists():
        return None

    queryset = available_riders_qs.annotate(
        active_order_count=Count(
            "rider_orders",
            filter=~Q(rider_orders__status=Order.Status.DELIVERED),
        )
    )
    if prefer_urgent:
        queryset = queryset.annotate(
            urgent_order_count=Count(
                "rider_orders",
                filter=Q(rider_orders__urgency=Order.Urgency.URGENT)
                & ~Q(rider_orders__status=Order.Status.DELIVERED),
            )
        ).order_by("urgent_order_count", "active_order_count")
    else:
        queryset = queryset.order_by("active_order_count")
    return queryset.first()


def create_order_transaction_record(order):
    """
    Calculates revenue split and persists a TransactionLog for the given order.
    Called by the post_save signal when status → WASHING or DELIVERED.
    """
    from .ledger import compute_transaction_split

    split = compute_transaction_split(order.total_amount, order.base_price)
    return TransactionLog.objects.create(
        order=order,
        partner_earning=split["partner_earning"],
        fualaundry_commission=split["fualaundry_commission"],
        rider_fee=split["rider_fee"],
    )
