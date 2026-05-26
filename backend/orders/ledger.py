from decimal import Decimal

from core.rider_fee import calculate_rider_fee

TWOPLACES = Decimal("0.01")


def _quantize(amount: Decimal) -> Decimal:
    from decimal import ROUND_HALF_UP

    return amount.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def compute_transaction_split(
    total_amount: Decimal,
    base_price: Decimal,
) -> dict[str, Decimal]:
    """
    Automated split ledger for a settled order.

    - rider_fee from SystemConfiguration (fixed ETB or % of total)
    - fualaundry_commission = max(0, total_amount - base_price - rider_fee)
    - partner_earning = max(0, total_amount - commission - rider_fee)
    """
    total = _quantize(Decimal(total_amount))
    base = _quantize(Decimal(base_price))
    rider_fee = calculate_rider_fee(total)
    commission = _quantize(max(Decimal("0.00"), total - base - rider_fee))
    partner_earning = _quantize(max(Decimal("0.00"), total - commission - rider_fee))
    return {
        "fualaundry_commission": commission,
        "rider_fee": rider_fee,
        "partner_earning": partner_earning,
    }
