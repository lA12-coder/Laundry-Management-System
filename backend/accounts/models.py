from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        RIDER = 'rider', _('Rider')
        CUSTOMER = 'customer', _('Customer')
        PARTNER = 'partner', _('Partner Laundry')
    
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15) 
    role =  models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    home_address = models.CharField(max_length=255, blank=True, null=True)
    secondary_addresses = models.JSONField(default=list, blank=True)
    mfa_enabled = models.BooleanField(default=False)
    sms_notifications = models.BooleanField(default=True)
    email_receipts = models.BooleanField(default=True)
    marketing_updates = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone_number']
    
    def __str__(self) -> str:
        return f"{self.username} ({self.role})"


class CustomerNotification(models.Model):
    """Persistent alerts for order lifecycle and system events."""

    class NotificationType(models.TextChoices):
        STATUS_CHANGE = "status_change", "Status change"
        SYSTEM = "system", "System"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="customer_notifications",
    )
    title = models.CharField(max_length=120)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.STATUS_CHANGE,
    )
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} → {self.user_id}"


class SubscriptionPlan(models.Model):
    class BillingCycle(models.TextChoices):
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=50, unique=True)
    billing_cycle = models.CharField(max_length=20, choices=BillingCycle.choices)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    duration_days = models.PositiveIntegerField()
    description = models.TextField(blank=True, default="")
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "price"]

    def __str__(self) -> str:
        return f"{self.name} ({self.price} ETB)"


class CustomerSubscription(models.Model):
    class Status(models.TextChoices):
        PENDING_APPROVAL = "pending_approval", "Pending approval"
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        DISABLED = "disabled", "Disabled"

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="customer_subscriptions",
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    receipt_image = models.FileField(upload_to="subscription_receipts/")
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.PENDING_APPROVAL,
    )
    admin_note = models.CharField(max_length=255, blank=True, default="")
    approved_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_subscriptions",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["customer", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"Subscription #{self.pk} for {self.customer_id}"