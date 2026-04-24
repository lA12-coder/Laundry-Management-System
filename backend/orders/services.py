from decimal import Decimal

URGENT_FEE = Decimal('10.00')


def calculate_order_price(items, is_urgent=False):
    """
    Calculate total price for an order.
    items: list of dicts with 'price' and 'quantity'.
    is_urgent: bool, if True, add urgent fee.
    """
    total = Decimal('0.00')
    for item in items:
        total += Decimal(str(item.get('price', 0))) * int(item.get('quantity', 1))
    if is_urgent:
        total += URGENT_FEE
    return total


def assign_rider(order, available_riders):
    """
    Simple assignment: pick the first available rider.
    available_riders: list of User objects (riders)
    """
    if not available_riders:
        return None
    # TODO: Replace with nearest/queue-based logic or GPS-based in future
    return available_riders[0]
