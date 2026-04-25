from rest_framework import serializers
from django.contrib.auth import get_user_model
from partners.models import LaundryPartner
from .models import AdminActionLog, Order, TransactionLog, ClothItem, PriceList

User = get_user_model()


class PriceListSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for the admin-managed price catalogue.
    """
    size_display = serializers.CharField(source="get_size_display", read_only=True)

    class Meta:
        model = PriceList
        fields = [
            "id",
            "cloth_name",
            "size",
            "size_display",
            "fua_price",
            "partner_price",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class ClothItemSerializer(serializers.ModelSerializer):
    """
    Nested serializer to show specific items within an order.
    Accepts `price_list_entry` (PK) on write; exposes snapshotted prices and
    the computed `line_total` on read.
    """
    line_total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    price_list_entry = serializers.PrimaryKeyRelatedField(
        queryset=PriceList.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = ClothItem
        fields = [
            "id",
            "price_list_entry",
            "cloth_name",
            "size",
            "quantity",
            "fua_price",
            "partner_price",
            "line_total",
        ]
        read_only_fields = ["fua_price", "partner_price", "line_total"]

class OrderListSerializer(serializers.ModelSerializer):
    # Read-only display fields for the frontend
    partner_name = serializers.CharField(source="partner.business_name", read_only=True)
    rider_name = serializers.CharField(source="rider.full_name", read_only=True)
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    
    partner = serializers.PrimaryKeyRelatedField(
        queryset=LaundryPartner.objects.all(),
        required=False,
        allow_null=True
    )
    rider = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.RIDER),
        required=False,
        allow_null=True
    )
    customer = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False
    )
    # Nested items for detailed views
    cloth_items = ClothItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "urgency",
            "customer",       
            "customer_name", 
            "partner",     
            "partner_name",  
            "rider",       
            "rider_name",    
            "delivery_address",
            "total_amount",
            "base_price",
            "cloth_items",
            "created_at",
            "delivered_at",
        ]
        
        read_only_fields = ["total_amount", "base_price", "created_at", "delivered_at"]


class OrderStatusOverrideSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)


class OrderReassignRiderSerializer(serializers.Serializer):
    rider = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=User.Role.RIDER, is_active=True)
    )


class TransactionLogSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    order_status = serializers.CharField(source="order.status", read_only=True)
    partner_name = serializers.CharField(source="order.partner.business_name", read_only=True)

    class Meta:
        model = TransactionLog
        fields = [
            "id",
            "order",
            "order_id",
            "order_status",
            "partner_name",
            "partner_earning",
            "fualaundry_commission",
            "created_at",
        ]



class AdminActionLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.EmailField(source="admin_user.email", read_only=True)
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AdminActionLog
        fields = [
            "id",
            "admin_user",
            "admin_email",
            "order",
            "action",
            "action_display",
            "previous_value",
            "new_value",
            "metadata",
            "created_at",
        ]