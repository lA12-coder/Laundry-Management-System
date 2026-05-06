from django.db import models
from django.conf import settings
from django.utils import timezone
from partners.models import LaundryPartner


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
        return f"{self.cloth_name} ({self.get_size_display()}) — Ksh {self.fua_price}"


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PICKED_UP = "picked_up", "Picked Up"
        WASHING = "washing", "Washing"
        READY = "ready", "Ready to Deliver"
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


class TransactionLog(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="transaction_log")
    partner_earning = models.DecimalField(max_digits=12, decimal_places=2)
    fualaundry_commission = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Transaction for Order #{self.order_id}"


class AdminActionLog(models.Model):
    class Action(models.TextChoices):
        OVERRIDE_STATUS = "override_status", "Override Status"
        REASSIGN_RIDER = "reassign_rider", "Reassign Rider"
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

