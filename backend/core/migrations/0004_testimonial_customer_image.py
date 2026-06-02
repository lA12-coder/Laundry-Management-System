from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_testimonial_laundrylocation"),
    ]

    operations = [
        migrations.AddField(
            model_name="testimonial",
            name="customer_image",
            field=models.ImageField(blank=True, null=True, upload_to="testimonials/"),
        ),
    ]

