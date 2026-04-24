from rest_framework import serializers
from .models import LaundryPartner

class LaundryPartnerSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    current_load = serializers.IntegerField(read_only=True)
    pending_orders = serializers.IntegerField(read_only=True)
    payout_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, default=0
    )

    class Meta:
        model = LaundryPartner
        fields = [
            "id",
            "owner",
            "owner_email",
            "business_name",
            "is_approved",
            "is_active",
            "capacity_per_day",
            "commission_rate",
            "current_load",
            "pending_orders",
            "payout_total",
            "created_at",
            "updated_at",
        ]
