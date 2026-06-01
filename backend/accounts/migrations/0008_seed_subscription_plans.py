from decimal import Decimal

from django.db import migrations


def seed_subscription_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("accounts", "SubscriptionPlan")
    plans = [
        {
            "name": "Weekly Plan",
            "slug": "weekly-plan",
            "billing_cycle": "weekly",
            "price": Decimal("999.00"),
            "duration_days": 7,
            "description": "Full access to standard laundry service every week.",
            "features": [
                "Full access to all standard services",
                "Easy weekly billing",
                "Cancel or upgrade anytime",
                "Pickup & delivery included",
            ],
            "sort_order": 1,
        },
        {
            "name": "Monthly Plan",
            "slug": "monthly-plan",
            "billing_cycle": "monthly",
            "price": Decimal("3999.00"),
            "duration_days": 30,
            "description": "Most popular plan with priority handling and better savings.",
            "features": [
                "Full service access",
                "Priority support",
                "Predictable monthly billing",
                "Better value than weekly",
            ],
            "sort_order": 2,
        },
        {
            "name": "Yearly Plan",
            "slug": "yearly-plan",
            "billing_cycle": "yearly",
            "price": Decimal("44999.00"),
            "duration_days": 365,
            "description": "Best annual discount with dedicated support.",
            "features": [
                "Full service access",
                "Dedicated support",
                "Locked pricing for 12 months",
                "Best overall discount",
            ],
            "sort_order": 3,
        },
    ]
    for data in plans:
        SubscriptionPlan.objects.update_or_create(slug=data["slug"], defaults=data)


def rollback_subscription_plans(apps, schema_editor):
    SubscriptionPlan = apps.get_model("accounts", "SubscriptionPlan")
    SubscriptionPlan.objects.filter(
        slug__in=["weekly-plan", "monthly-plan", "yearly-plan"]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_subscription_plans"),
    ]

    operations = [
        migrations.RunPython(seed_subscription_plans, rollback_subscription_plans),
    ]
