from decimal import Decimal

from django.db import migrations


def recalculate_with_config(apps, schema_editor):
    SystemConfiguration = apps.get_model("core", "SystemConfiguration")
    TransactionLog = apps.get_model("orders", "TransactionLog")

    config = SystemConfiguration.objects.filter(pk=1).first()
    if not config:
        config = SystemConfiguration.objects.create(
            pk=1,
            rider_fee_mode="percent",
            rider_fee_percent=Decimal("10.00"),
            rider_fee_fixed_amount=Decimal("50.00"),
        )

    for log in TransactionLog.objects.select_related("order").iterator():
        order = log.order
        total = Decimal(str(order.total_amount)).quantize(Decimal("0.01"))
        base = Decimal(str(order.base_price)).quantize(Decimal("0.01"))

        if config.rider_fee_mode == "fixed":
            rider = Decimal(str(config.rider_fee_fixed_amount)).quantize(Decimal("0.01"))
        else:
            rate = Decimal(str(config.rider_fee_percent)) / Decimal("100")
            rider = (total * rate).quantize(Decimal("0.01"))

        commission = max(Decimal("0.00"), total - base - rider).quantize(Decimal("0.01"))
        partner = max(Decimal("0.00"), total - commission - rider).quantize(Decimal("0.01"))
        log.rider_fee = rider
        log.fualaundry_commission = commission
        log.partner_earning = partner
        log.save(update_fields=["rider_fee", "fualaundry_commission", "partner_earning"])


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_systemconfiguration"),
        ("orders", "0011_recalculate_commission_markup"),
    ]

    operations = [
        migrations.RunPython(recalculate_with_config, migrations.RunPython.noop),
    ]
