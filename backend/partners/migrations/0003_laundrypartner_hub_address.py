from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("partners", "0002_remove_laundrypartner_commission_rate"),
    ]

    operations = [
        migrations.AddField(
            model_name="laundrypartner",
            name="hub_address",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
