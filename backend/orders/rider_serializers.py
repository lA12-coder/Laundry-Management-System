from rest_framework import serializers

from .models import Order
from .rider_utils import approximate_region_centroid, extract_delivery_region, haversine_km


class RiderPartnerHubSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    business_name = serializers.CharField()
    hub_address = serializers.CharField()


class RiderJobSerializer(serializers.ModelSerializer):
    """
    Privacy-aware job payload for riders.
    Full address and phone are omitted until assignment is accepted.
    """

    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_phone = serializers.SerializerMethodField()
    delivery_address = serializers.SerializerMethodField()
    delivery_region = serializers.SerializerMethodField()
    partner_name = serializers.CharField(source="partner.business_name", read_only=True)
    partner_hub = serializers.SerializerMethodField()
    is_assignment_accepted = serializers.SerializerMethodField()
    can_accept = serializers.SerializerMethodField()
    approximate_distance_km = serializers.SerializerMethodField()
    cloth_items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "status",
            "urgency",
            "customer_name",
            "customer_phone",
            "delivery_address",
            "delivery_region",
            "partner_name",
            "partner_hub",
            "is_assignment_accepted",
            "can_accept",
            "approximate_distance_km",
            "cloth_items_count",
            "total_amount",
            "created_at",
            "rider_accepted_at",
        ]

    def _rider_user(self):
        request = self.context.get("request")
        return getattr(request, "user", None) if request else None

    def _is_accepted(self, obj: Order) -> bool:
        rider = self._rider_user()
        return bool(
            rider
            and rider.is_authenticated
            and obj.rider_id == rider.id
            and obj.rider_accepted_at is not None
        )

    def get_is_assignment_accepted(self, obj: Order) -> bool:
        return self._is_accepted(obj)

    def get_can_accept(self, obj: Order) -> bool:
        rider = self._rider_user()
        if not rider or not rider.is_authenticated:
            return False
        if obj.status in (Order.Status.DELIVERED, Order.Status.CANCELLED):
            return False
        if obj.rider_id is None:
            return True
        return obj.rider_id == rider.id and obj.rider_accepted_at is None

    def get_customer_phone(self, obj: Order) -> str | None:
        if not self._is_accepted(obj):
            return None
        if not obj.customer_id:
            return None
        return obj.customer.phone_number

    def get_delivery_address(self, obj: Order) -> str | None:
        if not self._is_accepted(obj):
            return None
        return obj.delivery_address or None

    def get_delivery_region(self, obj: Order) -> str:
        return extract_delivery_region(obj.delivery_address)

    def get_partner_hub(self, obj: Order) -> dict | None:
        if not obj.partner_id:
            return None
        partner = obj.partner
        return {
            "id": partner.id,
            "business_name": partner.business_name,
            "hub_address": partner.hub_address or partner.business_name,
        }

    def get_approximate_distance_km(self, obj: Order) -> float | None:
        coords = self.context.get("rider_coords")
        if not coords:
            return None
        lat, lng = coords
        region = extract_delivery_region(obj.delivery_address)
        centroid = approximate_region_centroid(region)
        if not centroid:
            return None
        return round(haversine_km(lat, lng, centroid[0], centroid[1]), 1)

    def get_cloth_items_count(self, obj: Order) -> int:
        if hasattr(obj, "_cloth_items_count"):
            return obj._cloth_items_count
        return obj.cloth_items.count()
