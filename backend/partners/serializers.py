from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from accounts.utils import normalize_phone_number
from .models import LaundryPartner

User = get_user_model()

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
            "current_load",
            "pending_orders",
            "payout_total",
            "created_at",
            "updated_at",
        ]


class PartnerCreateSerializer(serializers.Serializer):
    business_name = serializers.CharField(max_length=255)
    hub_address = serializers.CharField(max_length=255, required=False, allow_blank=True)
    capacity_per_day = serializers.IntegerField(min_value=0, required=False, default=0)
    owner_full_name = serializers.CharField(max_length=255)
    owner_email = serializers.EmailField()
    owner_phone = serializers.CharField(max_length=32)
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        min_length=8,
    )

    def validate_owner_email(self, value):
        return value.strip().lower()

    def validate_owner_phone(self, value):
        return normalize_phone_number(value)

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password", None)

        owner = User(
            username=validated_data["owner_email"],
            full_name=validated_data["owner_full_name"].strip(),
            email=validated_data["owner_email"],
            phone_number=validated_data["owner_phone"].strip(),
            role=User.Role.PARTNER,
            is_active=True,
        )

        if password:
            owner.set_password(password)
        else:
            owner.set_unusable_password()

        owner.save()

        partner = LaundryPartner.objects.create(
            owner=owner,
            business_name=validated_data["business_name"].strip(),
            hub_address=(validated_data.get("hub_address") or "").strip(),
            capacity_per_day=validated_data.get("capacity_per_day", 0),
            is_approved=False,
            is_active=True,
        )
        return partner
