from django.contrib.auth import get_user_model
from django.db.models import Q
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from accounts.models import CustomerNotification
from accounts.notification_messages import format_order_status_notification

from .models import Order
from .services import create_order_transaction_record

User = get_user_model()


@receiver(pre_save, sender=Order)
def cache_order_status(sender, instance, **kwargs):
    if instance.pk:
        instance._previous_status = (
            Order.objects.filter(pk=instance.pk).values_list("status", flat=True).first()
        )
    else:
        instance._previous_status = None


@receiver(post_save, sender=Order)
def create_customer_status_notification(sender, instance, created, **kwargs):
    if created or not instance.customer_id:
        return
    previous = getattr(instance, "_previous_status", None)
    if previous is None or previous == instance.status:
        return

    CustomerNotification.objects.create(
        user=instance.customer,
        order=instance,
        title="Order update",
        message=format_order_status_notification(instance),
        notification_type=CustomerNotification.NotificationType.STATUS_CHANGE,
        metadata={
            "status": instance.status,
            "previous_status": previous,
            "hub": instance.partner.business_name if instance.partner_id else "Fua Laundry",
        },
    )


@receiver(post_save, sender=Order)
def create_admin_new_order_notification(sender, instance, created, **kwargs):
    if not created:
        return

    admin_users = User.objects.filter(
        is_active=True
    ).filter(
        Q(is_superuser=True) | Q(is_staff=True, role=User.Role.ADMIN)
    )
    notifications = [
        CustomerNotification(
            user=admin_user,
            order=instance,
            title="New order placed",
            message=f"Order #{instance.id} requires routing and partner assignment.",
            notification_type=CustomerNotification.NotificationType.SYSTEM,
            metadata={
                "event": "order_created",
                "order_id": instance.id,
                "status": instance.status,
            },
        )
        for admin_user in admin_users
    ]
    if notifications:
        CustomerNotification.objects.bulk_create(notifications)


@receiver(post_save, sender=Order)
def create_transaction_log(sender, instance, created, **kwargs):
    """
    Automatically calculates and creates a TransactionLog when an Order
    status changes to WASHING or DELIVERED.
    """
    if instance.status in [Order.Status.WASHING, Order.Status.DELIVERED]:
        if not hasattr(instance, "transaction_log"):
            create_order_transaction_record(instance)
