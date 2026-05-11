from __future__ import annotations

import re
from typing import Any

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

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
    phone_number = serializers.CharField(validators=[validate_e164_phone_number])

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
        return validate_e164_phone_number(value)

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


class UserLoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user: User) -> Any:
        token = super().get_token(user)
        token["role"] = user.role
        token["is_verified"] = user.is_verified
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
