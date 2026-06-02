from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0014_order_location_dual_delivery_and_riderreview"),
    ]

    operations = [
        migrations.AlterField(
            model_name="adminactionlog",
            name="action",
            field=models.CharField(
                choices=[
                    ("override_status", "Override Status"),
                    ("reassign_rider", "Reassign Rider"),
                    ("assign_partner", "Assign Partner"),
                    ("partner_settlement", "Partner Settlement"),
                    ("partner_approval", "Partner Approval"),
                    ("partner_deactivation", "Partner Deactivation"),
                    ("user_created", "User Created"),
                    ("user_updated", "User Updated"),
                    ("user_deleted", "User Deleted"),
                ],
                max_length=40,
            ),
        ),
    ]

