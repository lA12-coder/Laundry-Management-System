from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_user_created_at_user_full_name_user_updated_at_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_receipts",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="user",
            name="marketing_updates",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="mfa_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="secondary_addresses",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="user",
            name="sms_notifications",
            field=models.BooleanField(default=True),
        ),
    ]
