from django.db import migrations, models
import django.db.models.deletion


DEFAULT_CATEGORIES = [
    ("regular", "Regular", 10),
    ("premium", "Premium", 20),
    ("delicate", "Delicate", 30),
    ("household", "Household", 40),
]


def seed_categories_and_link(apps, schema_editor):
    ClothCategory = apps.get_model("orders", "ClothCategory")
    PriceList = apps.get_model("orders", "PriceList")

    slug_to_id = {}
    for slug, name, order in DEFAULT_CATEGORIES:
        cat, _ = ClothCategory.objects.get_or_create(
            slug=slug,
            defaults={"name": name, "sort_order": order, "is_active": True},
        )
        slug_to_id[slug] = cat.id

    for entry in PriceList.objects.all():
        legacy = getattr(entry, "category_legacy", None) or "regular"
        entry.category_id = slug_to_id.get(legacy, slug_to_id["regular"])
        entry.save(update_fields=["category_id"])


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0007_pricelist_category"),
    ]

    operations = [
        migrations.CreateModel(
            name="ClothCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("slug", models.SlugField(max_length=50, unique=True)),
                ("description", models.TextField(blank=True, default="")),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Cloth category",
                "verbose_name_plural": "Cloth categories",
                "ordering": ["sort_order", "name"],
            },
        ),
        migrations.RenameField(
            model_name="pricelist",
            old_name="category",
            new_name="category_legacy",
        ),
        migrations.AddField(
            model_name="pricelist",
            name="category",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="price_entries",
                to="orders.clothcategory",
            ),
        ),
        migrations.RunPython(seed_categories_and_link, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="pricelist",
            name="category_legacy",
        ),
        migrations.AlterField(
            model_name="pricelist",
            name="category",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name="price_entries",
                to="orders.clothcategory",
            ),
        ),
    ]
