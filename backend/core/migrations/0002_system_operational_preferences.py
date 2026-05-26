from decimal import Decimal

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_systemconfiguration"),
    ]

    operations = [
        migrations.AddField(
            model_name="systemconfiguration",
            name="auto_assign_riders",
            field=models.BooleanField(default=True, help_text="Automatically assign least-loaded rider on new orders."),
        ),
        migrations.AddField(
            model_name="systemconfiguration",
            name="dispatch_radius_km",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("15.00"),
                help_text="Preferred dispatch boundary radius in kilometres.",
                max_digits=6,
            ),
        ),
        migrations.AddField(
            model_name="systemconfiguration",
            name="max_daily_orders_cap",
            field=models.PositiveIntegerField(
                default=500,
                help_text="Maximum new orders accepted per calendar day (0 = unlimited).",
            ),
        ),
        migrations.AddField(
            model_name="systemconfiguration",
            name="urgent_orders_first",
            field=models.BooleanField(
                default=True,
                help_text="Prioritize urgent orders in rider auto-assignment.",
            ),
        ),
        migrations.AddField(
            model_name="systemconfiguration",
            name="default_notify_channel",
            field=models.CharField(
                choices=[("sms", "SMS"), ("email", "Email"), ("both", "SMS and Email")],
                default="both",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="systemconfiguration",
            name="platform_sms_enabled",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="systemconfiguration",
            name="platform_email_enabled",
            field=models.BooleanField(default=True),
        ),
    ]
