from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_customernotification"),
    ]

    operations = [
        migrations.CreateModel(
            name="SubscriptionPlan",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, unique=True)),
                ("slug", models.SlugField(max_length=50, unique=True)),
                ("billing_cycle", models.CharField(choices=[("weekly", "Weekly"), ("monthly", "Monthly"), ("yearly", "Yearly")], max_length=20)),
                ("price", models.DecimalField(decimal_places=2, max_digits=12)),
                ("duration_days", models.PositiveIntegerField()),
                ("description", models.TextField(blank=True, default="")),
                ("features", models.JSONField(blank=True, default=list)),
                ("is_active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["sort_order", "price"],
            },
        ),
        migrations.CreateModel(
            name="CustomerSubscription",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                ("receipt_image", models.FileField(upload_to="subscription_receipts/")),
                ("status", models.CharField(choices=[("pending_approval", "Pending approval"), ("active", "Active"), ("expired", "Expired"), ("disabled", "Disabled")], default="pending_approval", max_length=30)),
                ("admin_note", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("approved_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="approved_subscriptions", to=settings.AUTH_USER_MODEL)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="subscriptions", to=settings.AUTH_USER_MODEL)),
                ("plan", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="customer_subscriptions", to="accounts.subscriptionplan")),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["status", "-created_at"], name="accounts_cus_status_b1e200_idx"), models.Index(fields=["customer", "-created_at"], name="accounts_cus_custome_452eb6_idx")],
            },
        ),
    ]
