from django.db import migrations, models


def verify_existing_users(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(is_verified=False).update(is_verified=True)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_rename_accounts_cu_user_id_8e2f0a_idx_accounts_cu_user_id_9ada2a_idx_and_more"),
    ]

    operations = [
        migrations.RunPython(verify_existing_users, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="is_verified",
            field=models.BooleanField(default=True),
        ),
    ]
