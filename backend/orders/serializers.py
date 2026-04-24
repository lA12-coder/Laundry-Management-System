from rest_framework import serializers

from accounts.models import User
from partners.models import LaundryPartner
from .models import AdminActionLog, Order, TransactionLog


class OrderListSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    partner_name = serializers.CharField(source="partner.business_name", read_only=True)
    rider_email = serializers.EmailField(source="rider.email", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "customer",
            "customer_email",
            "partner",
            "partner_name",
            "rider",
            "rider_email",
            "pickup_address",
            "total_amount",
            "partner_earning",
            "rider_fee",
            "fualaundry_commission",
            "created_at",
            "updated_at",
            "urgency",
            "order_detail",
        ]


class OrderStatusOverrideSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)


class OrderReassignRiderSerializer(serializers.Serializer):
    rider_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.RIDER, is_active=True),
        source="rider",
    )


class TransactionLogSerializer(serializers.ModelSerializer):
    order_status = serializers.CharField(source="order.status", read_only=True)
    partner_name = serializers.CharField(source="order.partner.business_name", read_only=True)
    rider_email = serializers.EmailField(source="order.rider.email", read_only=True)

    class Meta:
        model = TransactionLog
        fields = [
            "id",
            "order",
            "order_status",
            "partner_name",
            "rider_email",
            "partner_earning",
            "rider_fee",
            "fualaundry_commission",
            "created_at",
        ]


class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(source="admin_user.email", read_only=True)

    class Meta:
        model = AdminActionLog
        fields = [
            "id",
            "admin_user",
            "admin_email",
            "order",
            "action",
            "previous_value",
            "new_value",
            "metadata",
            "created_at",
        ]