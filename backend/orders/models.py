from decimal import Decimal

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify
from partners.models import LaundryPartner


class ClothCategory(models.Model):
    """Admin-managed cloth groupings for the price catalogue."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name = "Cloth category"
        verbose_name_plural = "Cloth categories"

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "category"
            slug = base
            counter = 1
            while ClothCategory.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class PriceList(models.Model):
    """
    Central price catalogue managed by admins.
    Stores the FuaLaundry customer-facing price and the partner cost price
    for each cloth type / size combination.
    """
    class Size(models.TextChoices):
        SMALL = "small", "Small"
        MEDIUM = "medium", "Medium"
        LARGE = "large", "Large"

    cloth_name = models.CharField(max_length=255)
    category = models.ForeignKey(
        ClothCategory,
        on_delete=models.PROTECT,
        related_name="price_entries",
    )
    image = models.ImageField(upload_to="cloth_images", null=True, blank=True)
    size = models.CharField(max_length=20, choices=Size.choices, default=Size.SMALL)
    fua_price = models.DecimalField(max_digits=12, decimal_places=2)
    partner_price = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["cloth_name", "size"]
        unique_together = [("cloth_name", "size")]
        verbose_name = "Price List Entry"
        verbose_name_plural = "Price List"

    def __str__(self) -> str:
        return f"{self.cloth_name} ({self.get_size_display()}) — ETB {self.fua_price}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PICKED_UP = "picked_up", "Picked Up"
        WASHING = "washing", "Washing"
        WASHED = "washed", "Washed"
        DRIED = "dried", "Dried"
        READY = "ready", "Ready to Deliver"
        OUT_FOR_DELIVERY = "out_for_delivery", "Out for Delivery"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    class Urgency(models.TextChoices):
        REGULAR = "regular", "Regular"
        URGENT = "urgent", "Urgent"

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    partner = models.ForeignKey(
        LaundryPartner,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rider_orders",
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    urgency = models.CharField(max_length=20, choices=Urgency.choices, default=Urgency.REGULAR)
    delivery_address = models.CharField(max_length=255, default="")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    rider_accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the assigned rider confirmed the job and unlocked customer contact.",
    )
    pickup_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    pickup_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    rider_last_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    rider_last_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    rider_delivered_confirmed_at = models.DateTimeField(null=True, blank=True)
    customer_received_confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["partner"]),
        ]

    def save(self, *args, **kwargs):
        if self.status == self.Status.DELIVERED and self.delivered_at is None:
            self.delivered_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        customer_label = self.customer.username if self.customer else "Guest"
        return f"Order #{self.id} - {customer_label}"


class ClothItem(models.Model):
    """
    One line-item in an order.  Prices are snapshotted from PriceList at
    order-creation time so that historical records survive catalogue changes.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="cloth_items")
    price_list_entry = models.ForeignKey(
        PriceList,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cloth_items",
    )

    cloth_name = models.CharField(max_length=255)
    size = models.CharField(max_length=20, choices=PriceList.Size.choices, default=PriceList.Size.SMALL)
    quantity = models.PositiveIntegerField(default=1)
    fua_price = models.DecimalField(max_digits=12, decimal_places=2)
    partner_price = models.DecimalField(max_digits=12, decimal_places=2)

    @property
    def line_total(self):
        """Customer-facing subtotal for this line item."""
        return self.fua_price * self.quantity

    def __str__(self) -> str:
        return f"{self.cloth_name} ({self.size}) x{self.quantity}"


class RiderReview(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="rider_review")
    rider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rider_reviews",
    )
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_rider_reviews",
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                check=models.Q(rating__gte=1) & models.Q(rating__lte=5),
                name="rider_review_rating_between_1_5",
            ),
        ]

    def __str__(self) -> str:
        return f"Review order #{self.order_id} · rider {self.rider_id}"


class TransactionLog(models.Model):
    class SettlementStatus(models.TextChoices):
        UNPAID = "unpaid", "Unpaid"
        PAID = "paid", "Paid"

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="transaction_log")
    partner_earning = models.DecimalField(max_digits=12, decimal_places=2)
    fualaundry_commission = models.DecimalField(max_digits=12, decimal_places=2)
    rider_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("50.00"))
    settlement_status = models.CharField(
        max_length=20,
        choices=SettlementStatus.choices,
        default=SettlementStatus.UNPAID,
    )
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    payment_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Transaction for Order #{self.order_id}"


class AdminActionLog(models.Model):
    class Action(models.TextChoices):
        OVERRIDE_STATUS = "override_status", "Override Status"
        REASSIGN_RIDER = "reassign_rider", "Reassign Rider"
        ASSIGN_PARTNER = "assign_partner", "Assign Partner"
        PARTNER_SETTLEMENT = "partner_settlement", "Partner Settlement"
        PARTNER_APPROVAL = "partner_approval", "Partner Approval"
        PARTNER_DEACTIVATION = "partner_deactivation", "Partner Deactivation"

    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_action_logs",
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admin_action_logs",
    )
    action = models.CharField(max_length=40, choices=Action.choices)
    previous_value = models.CharField(max_length=100, blank=True)
    new_value = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} by {self.admin_user_id}"

