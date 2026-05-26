from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0006_order_rider_accepted_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="pricelist",
            name="category",
            field=models.CharField(
                choices=[
                    ("regular", "Regular"),
                    ("premium", "Premium"),
                    ("delicate", "Delicate"),
                    ("household", "Household"),
                ],
                default="regular",
                max_length=20,
            ),
        ),
    ]
