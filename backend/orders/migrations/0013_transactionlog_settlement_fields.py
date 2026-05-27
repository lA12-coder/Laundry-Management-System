from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0012_recalculate_rider_fee_from_config"),
    ]

    operations = [
        migrations.AddField(
            model_name="transactionlog",
            name="paid_amount",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=12),
        ),
        migrations.AddField(
            model_name="transactionlog",
            name="payment_date",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="transactionlog",
            name="settlement_status",
            field=models.CharField(
                choices=[("unpaid", "Unpaid"), ("paid", "Paid")],
                default="unpaid",
                max_length=20,
            ),
        ),
    ]
