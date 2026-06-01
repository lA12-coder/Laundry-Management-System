from decimal import Decimal

from rest_framework import serializers

from .models import LaundryLocation, SystemConfiguration, Testimonial


class SystemConfigurationSerializer(serializers.ModelSerializer):
    rider_fee_mode_display = serializers.CharField(
        source="get_rider_fee_mode_display", read_only=True
    )

    class Meta:
        model = SystemConfiguration
        fields = [
            "rider_fee_mode",
            "rider_fee_mode_display",
            "rider_fee_fixed_amount",
            "rider_fee_percent",
            "auto_assign_riders",
            "dispatch_radius_km",
            "max_daily_orders_cap",
            "urgent_orders_first",
            "default_notify_channel",
            "platform_sms_enabled",
            "platform_email_enabled",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate_rider_fee_fixed_amount(self, value):
        if value < Decimal("0"):
            raise serializers.ValidationError("Fixed amount cannot be negative.")
        if value > Decimal("9999999999.99"):
            raise serializers.ValidationError("Fixed amount is too large.")
        return value

    def validate_rider_fee_percent(self, value):
        if value < Decimal("0"):
            raise serializers.ValidationError("Percentage cannot be negative.")
        if value > Decimal("100"):
            raise serializers.ValidationError("Percentage cannot exceed 100.")
        return value

    def validate(self, attrs):
        mode = attrs.get(
            "rider_fee_mode",
            getattr(self.instance, "rider_fee_mode", SystemConfiguration.RiderFeeMode.PERCENT),
        )
        fixed = attrs.get(
            "rider_fee_fixed_amount",
            getattr(self.instance, "rider_fee_fixed_amount", None),
        )
        percent = attrs.get(
            "rider_fee_percent",
            getattr(self.instance, "rider_fee_percent", None),
        )
        if mode == SystemConfiguration.RiderFeeMode.FIXED and fixed is None:
            raise serializers.ValidationError(
                {"rider_fee_fixed_amount": "Required when using fixed rider fee."}
            )
        if mode == SystemConfiguration.RiderFeeMode.PERCENT and percent is None:
            raise serializers.ValidationError(
                {"rider_fee_percent": "Required when using percentage rider fee."}
            )
        return attrs

    def validate_dispatch_radius_km(self, value):
        if value < Decimal("0"):
            raise serializers.ValidationError("Dispatch radius cannot be negative.")
        if value > Decimal("9999.99"):
            raise serializers.ValidationError("Dispatch radius is too large.")
        return value

    def validate_max_daily_orders_cap(self, value):
        if value > 1_000_000:
            raise serializers.ValidationError("Daily cap is too large.")
        return value


class TestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = (
            "id",
            "customer_name",
            "rating",
            "review_text",
            "is_approved_for_public",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PublicTestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = (
            "id",
            "customer_name",
            "rating",
            "review_text",
            "created_at",
        )
        read_only_fields = fields


class LaundryLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryLocation
        fields = (
            "id",
            "hub_name",
            "latitude",
            "longitude",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class PublicLaundryLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaundryLocation
        fields = (
            "id",
            "hub_name",
            "latitude",
            "longitude",
        )
        read_only_fields = fields


class ContactSubmissionSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    message = serializers.CharField(max_length=5000)


class TestimonialSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Testimonial
        fields = ("customer_name", "rating", "review_text")
