from decimal import Decimal

from django.db import models


class SystemConfiguration(models.Model):
    """Singleton row (pk=1) for platform-wide operational settings."""

    SINGLETON_PK = 1

    class RiderFeeMode(models.TextChoices):
        FIXED = "fixed", "Fixed amount per order"
        PERCENT = "percent", "Percentage of order total"

    rider_fee_mode = models.CharField(
        max_length=10,
        choices=RiderFeeMode.choices,
        default=RiderFeeMode.PERCENT,
    )
    rider_fee_fixed_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("50.00"),
        help_text="Flat ETB charged per order when mode is fixed.",
    )
    rider_fee_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("10.00"),
        help_text="Percent of order total_amount when mode is percent.",
    )
    auto_assign_riders = models.BooleanField(
        default=True,
        help_text="Automatically assign least-loaded rider on new orders.",
    )
    dispatch_radius_km = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("15.00"),
        help_text="Preferred dispatch boundary radius in kilometres.",
    )
    max_daily_orders_cap = models.PositiveIntegerField(
        default=500,
        help_text="Maximum new orders accepted per calendar day (0 = unlimited).",
    )
    urgent_orders_first = models.BooleanField(
        default=True,
        help_text="Prioritize urgent orders in rider auto-assignment.",
    )
    class DefaultNotifyChannel(models.TextChoices):
        SMS = "sms", "SMS"
        EMAIL = "email", "Email"
        BOTH = "both", "SMS and Email"

    default_notify_channel = models.CharField(
        max_length=10,
        choices=DefaultNotifyChannel.choices,
        default=DefaultNotifyChannel.BOTH,
    )
    platform_sms_enabled = models.BooleanField(default=True)
    platform_email_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System configuration"
        verbose_name_plural = "System configuration"

    def save(self, *args, **kwargs):
        self.pk = self.SINGLETON_PK
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(
            pk=cls.SINGLETON_PK,
            defaults={
                "rider_fee_mode": cls.RiderFeeMode.PERCENT,
                "rider_fee_percent": Decimal("10.00"),
                "rider_fee_fixed_amount": Decimal("50.00"),
            },
        )
        return obj

    def __str__(self) -> str:
        if self.rider_fee_mode == self.RiderFeeMode.FIXED:
            return f"Rider fee: ETB {self.rider_fee_fixed_amount} per order"
        return f"Rider fee: {self.rider_fee_percent}% of order total"


class Testimonial(models.Model):
    customer_name = models.CharField(max_length=120)
    rating = models.PositiveSmallIntegerField()
    review_text = models.TextField()
    is_approved_for_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_approved_for_public", "-created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name="testimonial_rating_between_1_5",
            )
        ]

    def __str__(self) -> str:
        return f"{self.customer_name} ({self.rating}/5)"


class LaundryLocation(models.Model):
    hub_name = models.CharField(max_length=120)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["hub_name"]
        indexes = [
            models.Index(fields=["is_active", "hub_name"]),
        ]

    def __str__(self) -> str:
        return self.hub_name
