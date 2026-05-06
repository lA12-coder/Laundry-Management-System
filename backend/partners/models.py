from django.db import models
from django.conf import settings


class LaundryPartner(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="partner_profile",
    )
    business_name = models.CharField(max_length=255)
    is_approved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    capacity_per_day = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["business_name"]

    def __str__(self) -> str:
        return self.business_name
