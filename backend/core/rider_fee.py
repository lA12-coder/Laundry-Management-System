from decimal import Decimal, ROUND_HALF_UP

from .models import SystemConfiguration

TWOPLACES = Decimal("0.01")


def _quantize(amount: Decimal) -> Decimal:
    return amount.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def calculate_rider_fee(total_amount: Decimal) -> Decimal:
    """
    Rider payout for one order from system configuration.
    - fixed: flat ETB per order
    - percent: % of customer total_amount (default 10%)
    """
    config = SystemConfiguration.load()
    total = _quantize(Decimal(total_amount))

    if config.rider_fee_mode == SystemConfiguration.RiderFeeMode.FIXED:
        return _quantize(config.rider_fee_fixed_amount)

    rate = config.rider_fee_percent / Decimal("100")
    return _quantize(total * rate)
