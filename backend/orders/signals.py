from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order, TransactionLog

@receiver(post_save, sender=Order)
def create_transaction_log(sender, instance, created, **kwargs):
    """
    Automatically calculates and creates a TransactionLog when an Order
    status changes to WASHING or DELIVERED.
    Split: FuaLaundry keeps total_amount; partner earns the base_price.
    """
    if instance.status in [Order.Status.WASHING, Order.Status.DELIVERED]:
        if not hasattr(instance, 'transaction_log'):
            partner_earning = instance.base_price
            fualaundry_commission = instance.total_amount - instance.base_price

            TransactionLog.objects.create(
                order=instance,
                partner_earning=partner_earning,
                fualaundry_commission=fualaundry_commission,
            )
