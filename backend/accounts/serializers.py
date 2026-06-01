from __future__ import annotations

import re
from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()
from .models import CustomerSubscription, SubscriptionPlan

E164_PHONE_REGEX = re.compile(r"^\+[1-9]\d{1,14}$")


def validate_e164_phone_number(value: str) -> str:
    cleaned_value = value.strip()
    if not E164_PHONE_REGEX.match(cleaned_value):
        raise serializers.ValidationError(
            "Invalid phone number format. Use E.164 format (example: +254712345678)."
        )
    return cleaned_value


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    phone_number = serializers.CharField()

    class Meta:
        model = User
        fields = (
            "username",
            "full_name",
            "email",
            "phone_number",
            "password",
        )

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_phone_number(self, value: str) -> str:
        from .utils import normalize_phone_number

        return normalize_phone_number(value)

    def create(self, validated_data: dict[str, Any]) -> User:
        return User.objects.create_user(
            username=validated_data["username"].strip(),
            full_name=validated_data["full_name"].strip(),
            email=validated_data["email"].strip().lower(),
            phone_number=validated_data["phone_number"],
            password=validated_data["password"],
        )


class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "full_name",
            "email",
            "phone_number",
            "role",
            "is_verified",
            "is_active",
            "is_staff",
            "is_superuser",
            "home_address",
            "mfa_enabled",
            "sms_notifications",
            "email_receipts",
            "marketing_updates",
            "secondary_addresses",
        )
        read_only_fields = fields


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("full_name", "email", "phone_number", "home_address", "secondary_addresses")

    def validate_phone_number(self, value: str) -> str:
        from .utils import normalize_phone_number

        return normalize_phone_number(value)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, min_length=8, write_only=True)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("sms_notifications", "email_receipts", "marketing_updates")


class SecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("mfa_enabled",)


class GhostSessionSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value: str) -> str:
        from .utils import normalize_phone_number

        return normalize_phone_number(value)


class ClaimAccountSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_phone_number(self, value: str) -> str:
        from .utils import normalize_phone_number

        return normalize_phone_number(value)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": ["Passwords do not match."]}
            )
        user = self.context["request"].user
        if user.role != User.Role.CUSTOMER:
            raise serializers.ValidationError("Only customer accounts can be claimed.")
        if user.is_active:
            raise serializers.ValidationError("This account is already active.")
        if attrs["phone_number"] != user.phone_number:
            raise serializers.ValidationError(
                {"phone_number": ["Phone number must match your guest profile."]}
            )
        return attrs


class CustomerNotificationSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        from .models import CustomerNotification

        model = CustomerNotification
        fields = (
            "id",
            "title",
            "message",
            "notification_type",
            "order_id",
            "is_read",
            "metadata",
            "created_at",
        )
        read_only_fields = fields


class MarkNotificationsReadSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=False,
        allow_empty=True,
    )


class UserLoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user: User) -> Any:
        token = super().get_token(user)
        token["role"] = user.role
        token["is_verified"] = user.is_verified
        token["is_active"] = user.is_active
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser
        return token

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        username_field = self.username_field
        if username_field in attrs:
            attrs[username_field] = attrs[username_field].strip().lower()
        data = super().validate(attrs)
        data["user"] = UserDetailSerializer(self.user).data
        return data


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPlan
        fields = (
            "id",
            "name",
            "slug",
            "billing_cycle",
            "price",
            "duration_days",
            "description",
            "features",
            "is_active",
        )
        read_only_fields = fields


class CustomerSubscriptionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomerSubscription
        fields = (
            "id",
            "customer",
            "customer_name",
            "customer_email",
            "plan",
            "plan_name",
            "start_date",
            "end_date",
            "status",
            "admin_note",
            "receipt_image",
            "receipt_url",
            "approved_by",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "customer",
            "customer_name",
            "customer_email",
            "plan_name",
            "start_date",
            "end_date",
            "status",
            "approved_by",
            "created_at",
            "updated_at",
            "receipt_url",
        )

    def get_receipt_url(self, obj):
        if not obj.receipt_image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.receipt_image.url)
        return obj.receipt_image.url


class SubscriptionCheckoutSerializer(serializers.Serializer):
    plan_id = serializers.PrimaryKeyRelatedField(
        source="plan",
        queryset=SubscriptionPlan.objects.filter(is_active=True),
    )
    receipt_image = serializers.FileField()

    def validate_receipt_image(self, value):
        max_size_bytes = 8 * 1024 * 1024
        allowed_types = {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/pdf",
        }
        if value.size > max_size_bytes:
            raise serializers.ValidationError("Receipt must be 8MB or smaller.")
        content_type = (getattr(value, "content_type", "") or "").lower()
        if content_type and content_type not in allowed_types:
            name = (getattr(value, "name", "") or "").lower()
            if not (
                name.endswith(".jpg")
                or name.endswith(".jpeg")
                or name.endswith(".png")
                or name.endswith(".pdf")
            ):
                raise serializers.ValidationError("Upload JPG, PNG, or PDF receipt.")
        return value
