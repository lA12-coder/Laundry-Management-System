from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0005_alter_order_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="order",
            name="rider_accepted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
