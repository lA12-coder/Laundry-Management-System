import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = (
        "Create or update the deploy superuser from DJANGO_SUPERUSER_EMAIL and "
        "DJANGO_SUPERUSER_PASSWORD."
    )

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "").strip().lower()
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "")

        if not email or not password:
            self.stdout.write(
                "Skipping superuser bootstrap (DJANGO_SUPERUSER_EMAIL/PASSWORD not set)."
            )
            return

        User = get_user_model()
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", email.split("@")[0]).strip()
        phone_number = os.getenv("DJANGO_SUPERUSER_PHONE_NUMBER", "+251900000000").strip()
        full_name = os.getenv("DJANGO_SUPERUSER_FULL_NAME", "System Admin").strip()

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "full_name": full_name,
                "phone_number": phone_number,
                "role": User.Role.ADMIN,
                "is_verified": True,
                "is_active": True,
                "is_staff": True,
                "is_superuser": True,
            },
        )

        if not created:
            user.username = username or user.username
            user.full_name = full_name or user.full_name
            user.phone_number = phone_number or user.phone_number
            user.role = User.Role.ADMIN
            user.is_verified = True
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True

        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} superuser: {email}"))
