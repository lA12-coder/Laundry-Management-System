from decimal import Decimal, InvalidOperation

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers

from partners.models import LaundryPartner
from .models import AdminActionLog, Order, TransactionLog, ClothItem, PriceList, ClothCategory

User = get_user_model()

MAX_PRICE = Decimal("9999999999.99")


def validate_catalog_price(value) -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError) as exc:
        raise serializers.ValidationError("Enter a valid currency amount.") from exc
    if amount <= 0:
        raise serializers.ValidationError("Price must be greater than zero.")
    if amount > MAX_PRICE:
        raise serializers.ValidationError(
            "Price exceeds the maximum (12 digits, 2 decimal places)."
        )
    if amount.as_tuple().exponent < -2:
        raise serializers.ValidationError("Use at most 2 decimal places.")
    return amount


class ClothCategorySerializer(serializers.ModelSerializer):
    entry_count = serializers.SerializerMethodField()

    class Meta:
        model = ClothCategory
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "sort_order",
            "is_active",
            "entry_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["slug", "created_at", "updated_at"]

    def get_entry_count(self, obj) -> int:
        return obj.price_entries.filter(is_active=True).count()

    def validate_name(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters.")
        return cleaned


MAX_CATALOG_IMAGE_BYTES = 5 * 1024 * 1024
ALLOWED_CATALOG_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/octet-stream",
}


class PriceListSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for the admin-managed price catalogue.
    """
    size_display = serializers.CharField(source="get_size_display", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    category = serializers.PrimaryKeyRelatedField(
        queryset=ClothCategory.objects.filter(is_active=True)
    )
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    image_url = serializers.SerializerMethodField()
    clear_image = serializers.BooleanField(write_only=True, required=False, default=False)
    fua_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, validators=[validate_catalog_price]
    )
    partner_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, validators=[validate_catalog_price]
    )

    class Meta:
        model = PriceList
        fields = [
            "id",
            "cloth_name",
            "category",
            "category_name",
            "category_slug",
            "image",
            "image_url",
            "clear_image",
            "size",
            "size_display",
            "fua_price",
            "partner_price",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # many=True passes a QuerySet as instance — only adjust for single rows
        if isinstance(self.instance, PriceList):
            self.fields["category"].queryset = ClothCategory.objects.filter(
                Q(is_active=True) | Q(pk=self.instance.category_id)
            )

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def validate_image(self, value):
        if isinstance(value, str):
            raise serializers.ValidationError(
                "Upload the image file again (do not send an image URL)."
            )
        if not value:
            return value
        if value.size > MAX_CATALOG_IMAGE_BYTES:
            raise serializers.ValidationError("Image must be 5 MB or smaller.")
        content_type = (getattr(value, "content_type", "") or "").lower()
        if content_type and content_type not in ALLOWED_CATALOG_IMAGE_TYPES:
            allowed_extensions = (".jpg", ".jpeg", ".png", ".webp")
            name = (getattr(value, "name", "") or "").lower()
            if not any(name.endswith(ext) for ext in allowed_extensions):
                raise serializers.ValidationError("Use JPEG, PNG, or WebP images only.")
        return value

    def update(self, instance, validated_data):
        clear_image = validated_data.pop("clear_image", False)
        if clear_image and instance.image:
            instance.image.delete(save=False)
            instance.image = None
        return super().update(instance, validated_data)

    def validate(self, attrs):
        fua = attrs.get("fua_price", getattr(self.instance, "fua_price", None))
        partner = attrs.get(
            "partner_price", getattr(self.instance, "partner_price", None)
        )
        if fua is not None and partner is not None and partner > fua:
            raise serializers.ValidationError(
                {"partner_price": "Partner price cannot exceed Fua price."}
            )
        return attrs


class BulkPriceUpdateSerializer(serializers.Serializer):
    """Apply a multiplier to a subset of catalogue rows."""

    APPLY_FUA = "fua_price"
    APPLY_PARTNER = "partner_price"
    APPLY_BOTH = "both"

    categories = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=True,
    )
    sizes = serializers.ListField(
        child=serializers.ChoiceField(choices=PriceList.Size.choices),
        required=False,
        allow_empty=True,
    )
    multiplier = serializers.DecimalField(max_digits=8, decimal_places=4)
    apply_to = serializers.ChoiceField(
        choices=[APPLY_FUA, APPLY_PARTNER, APPLY_BOTH],
        default=APPLY_BOTH,
    )
    active_only = serializers.BooleanField(default=True)

    def validate_multiplier(self, value):
        if value <= 0:
            raise serializers.ValidationError("Multiplier must be greater than zero.")
        if value > Decimal("10"):
            raise serializers.ValidationError("Multiplier cannot exceed 10×.")
        return value


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
    customer_phone = serializers.CharField(source="customer.phone_number", read_only=True)
    is_ghost_customer = serializers.SerializerMethodField()
    
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

    def get_is_ghost_customer(self, obj: Order) -> bool:
        return bool(obj.customer_id and not obj.customer.is_active)

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "urgency",
            "customer",
            "customer_name",
            "customer_phone",
            "is_ghost_customer",
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
    partner_name = serializers.CharField(
        source="order.partner.business_name", read_only=True, allow_null=True
    )
    base_value = serializers.DecimalField(
        source="order.total_amount", max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = TransactionLog
        fields = [
            "id",
            "order",
            "order_id",
            "order_status",
            "partner_name",
            "base_value",
            "fualaundry_commission",
            "rider_fee",
            "partner_earning",
            "created_at",
        ]


class LedgerSummarySerializer(serializers.Serializer):
    gross_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    platform_fees = serializers.DecimalField(max_digits=14, decimal_places=2)
    logistics_payouts = serializers.DecimalField(max_digits=14, decimal_places=2)
    partner_payouts = serializers.DecimalField(max_digits=14, decimal_places=2)
    net_operational_profit = serializers.DecimalField(max_digits=14, decimal_places=2)
    transaction_count = serializers.IntegerField()



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