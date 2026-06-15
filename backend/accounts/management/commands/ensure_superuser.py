import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import IntegrityError


class Command(BaseCommand):
    help = (
        "Create or update the deploy superuser from DJANGO_SUPERUSER_EMAIL and "
        "DJANGO_SUPERUSER_PASSWORD."
    )

    def _unique_username(self, User, preferred: str) -> str:
        if not User.objects.filter(username=preferred).exists():
            return preferred
        base = preferred[:140] or "admin"
        for suffix in range(1, 1000):
            candidate = f"{base}{suffix}"
            if not User.objects.filter(username=candidate).exists():
                return candidate
        raise RuntimeError("Could not allocate a unique username for superuser.")

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "").strip().lower()
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "")

        if not email or not password:
            self.stdout.write(
                "Skipping superuser bootstrap (DJANGO_SUPERUSER_EMAIL/PASSWORD not set)."
            )
            return

        User = get_user_model()
        preferred_username = os.getenv(
            "DJANGO_SUPERUSER_USERNAME", email.split("@")[0]
        ).strip()
        phone_number = os.getenv("DJANGO_SUPERUSER_PHONE_NUMBER", "+251900000000").strip()
        full_name = os.getenv("DJANGO_SUPERUSER_FULL_NAME", "System Admin").strip()

        user = User.objects.filter(email=email).first()
        created = False

        if user is None:
            user = User.objects.filter(username=preferred_username).first()

        if user is None:
            username = self._unique_username(User, preferred_username)
            try:
                user = User.objects.create(
                    email=email,
                    username=username,
                    full_name=full_name,
                    phone_number=phone_number,
                    role=User.Role.ADMIN,
                    is_verified=True,
                    is_active=True,
                    is_staff=True,
                    is_superuser=True,
                )
                created = True
            except IntegrityError:
                user = User.objects.filter(email=email).first()
                if user is None:
                    user = User.objects.filter(username=preferred_username).first()
                if user is None:
                    raise

        user.email = email
        if not user.username:
            user.username = self._unique_username(User, preferred_username)
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
        self.stdout.write(
            self.style.SUCCESS(f"{action} superuser: {email} (username={user.username})")
        )
