import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0012_recalculate_rider_fee_from_config"),
        ("accounts", "0005_merge_20260506_0607"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomerNotification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=120)),
                ("message", models.TextField()),
                (
                    "notification_type",
                    models.CharField(
                        choices=[("status_change", "Status change"), ("system", "System")],
                        default="status_change",
                        max_length=20,
                    ),
                ),
                ("is_read", models.BooleanField(default=False)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "order",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="customer_notifications",
                        to="orders.order",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notifications",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["user", "is_read", "-created_at"], name="accounts_cu_user_id_8e2f0a_idx"),
                ],
            },
        ),
    ]
