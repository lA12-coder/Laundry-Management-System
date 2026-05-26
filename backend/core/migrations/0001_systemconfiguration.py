from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SystemConfiguration",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "rider_fee_mode",
                    models.CharField(
                        choices=[
                            ("fixed", "Fixed amount per order"),
                            ("percent", "Percentage of order total"),
                        ],
                        default="percent",
                        max_length=10,
                    ),
                ),
                (
                    "rider_fee_fixed_amount",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("50.00"),
                        help_text="Flat ETB charged per order when mode is fixed.",
                        max_digits=12,
                    ),
                ),
                (
                    "rider_fee_percent",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("10.00"),
                        help_text="Percent of order total_amount when mode is percent.",
                        max_digits=5,
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "System configuration",
                "verbose_name_plural": "System configuration",
            },
        ),
        migrations.RunPython(
            lambda apps, schema_editor: apps.get_model(
                "core", "SystemConfiguration"
            ).objects.get_or_create(
                pk=1,
                defaults={
                    "rider_fee_mode": "percent",
                    "rider_fee_percent": Decimal("10.00"),
                    "rider_fee_fixed_amount": Decimal("50.00"),
                },
            ),
            migrations.RunPython.noop,
        ),
    ]
