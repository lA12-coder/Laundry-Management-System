from django.db import models
from django.conf import settings
from django.utils import timezone

from partners.models import LaundryPartner


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PICKED_UP = "picked_up", "Picked Up"
        WASHING = "washing", "Washing"
        DELIVERED = "delivered", "Delivered"

    class Urgency(models.TextChoices):
        REGULAR = "regular", "Regular"
        URGENT = "urgent", "Urgent"
        
        def get_fee(self):
            if self == self.URGENT:
                return 20
            return 0

    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="customer_orders",
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
    pickup_address = models.CharField(max_length=255)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    partner_earning = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rider_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fualaundry_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    picked_up_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    urgency = models.CharField(max_length=20, choices=Urgency.choices, default=Urgency.REGULAR)
    order_detail = models.JSONField(default=dict, blank=True)
    

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["partner"]),
            models.Index(fields=["rider"]),
            models.Index(fields=["created_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.status == self.Status.PICKED_UP and self.picked_up_at is None:
            self.picked_up_at = timezone.now()
        if self.status == self.Status.DELIVERED and self.delivered_at is None:
            self.delivered_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Order #{self.pk} - {self.status}"


class TransactionLog(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="transaction_log")
    partner_earning = models.DecimalField(max_digits=12, decimal_places=2)
    rider_fee = models.DecimalField(max_digits=12, decimal_places=2)
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
