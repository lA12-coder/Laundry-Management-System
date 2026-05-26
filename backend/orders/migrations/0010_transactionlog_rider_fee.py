from decimal import Decimal

from django.db import migrations, models


def backfill_split_fields(apps, schema_editor):
    TransactionLog = apps.get_model("orders", "TransactionLog")
    rider = Decimal("50.00")

    for log in TransactionLog.objects.select_related("order").iterator():
        order = log.order
        total = Decimal(str(order.total_amount))
        base = Decimal(str(order.base_price))
        commission = max(Decimal("0.00"), total - base - rider).quantize(Decimal("0.01"))
        partner = max(Decimal("0.00"), total - commission - rider).quantize(Decimal("0.01"))
        log.fualaundry_commission = commission
        log.rider_fee = rider
        log.partner_earning = partner
        log.save(update_fields=["fualaundry_commission", "rider_fee", "partner_earning"])


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0009_merge_20260525_2336"),
    ]

    operations = [
        migrations.AddField(
            model_name="transactionlog",
            name="rider_fee",
            field=models.DecimalField(decimal_places=2, default=Decimal("50.00"), max_digits=12),
        ),
        migrations.RunPython(backfill_split_fields, migrations.RunPython.noop),
    ]
