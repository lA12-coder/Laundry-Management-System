from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0002_system_operational_preferences"),
    ]

    operations = [
        migrations.CreateModel(
            name="LaundryLocation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("hub_name", models.CharField(max_length=120)),
                ("latitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("longitude", models.DecimalField(decimal_places=6, max_digits=9)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["hub_name"],
                "indexes": [models.Index(fields=["is_active", "hub_name"], name="core_laundr_is_acti_cdb470_idx")],
            },
        ),
        migrations.CreateModel(
            name="Testimonial",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("customer_name", models.CharField(max_length=120)),
                ("rating", models.PositiveSmallIntegerField()),
                ("review_text", models.TextField()),
                ("is_approved_for_public", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["is_approved_for_public", "-created_at"], name="core_testim_is_appr_c7606a_idx")],
            },
        ),
        migrations.AddConstraint(
            model_name="testimonial",
            constraint=models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name="testimonial_rating_between_1_5",
            ),
        ),
    ]
