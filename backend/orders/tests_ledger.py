from decimal import Decimal

from django.test import TestCase

from core.models import SystemConfiguration
from orders.ledger import compute_transaction_split


class LedgerSplitTests(TestCase):
    def setUp(self):
        SystemConfiguration.objects.update_or_create(
            pk=1,
            defaults={
                "rider_fee_mode": SystemConfiguration.RiderFeeMode.PERCENT,
                "rider_fee_percent": Decimal("10.00"),
                "rider_fee_fixed_amount": Decimal("50.00"),
            },
        )

    def test_markup_split_with_percent_rider_default(self):
        split = compute_transaction_split(Decimal("500.00"), Decimal("340.00"))
        self.assertEqual(split["rider_fee"], Decimal("50.00"))
        self.assertEqual(split["fualaundry_commission"], Decimal("110.00"))
        self.assertEqual(split["partner_earning"], Decimal("340.00"))

    def test_fixed_rider_fee_mode(self):
        config = SystemConfiguration.load()
        config.rider_fee_mode = SystemConfiguration.RiderFeeMode.FIXED
        config.rider_fee_fixed_amount = Decimal("75.00")
        config.save()

        split = compute_transaction_split(Decimal("500.00"), Decimal("340.00"))
        self.assertEqual(split["rider_fee"], Decimal("75.00"))
        self.assertEqual(split["fualaundry_commission"], Decimal("85.00"))

    def test_commission_never_negative(self):
        config = SystemConfiguration.load()
        config.rider_fee_mode = SystemConfiguration.RiderFeeMode.FIXED
        config.rider_fee_fixed_amount = Decimal("50.00")
        config.save()

        split = compute_transaction_split(Decimal("40.00"), Decimal("35.00"))
        self.assertEqual(split["fualaundry_commission"], Decimal("0.00"))
        self.assertEqual(split["partner_earning"], Decimal("0.00"))
