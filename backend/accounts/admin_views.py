from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, FloatField, Prefetch, Q, Value
from django.db.models.functions import Coalesce
from rest_framework import mixins, serializers, viewsets

from core.permissions import IsStaffAdminRole
from orders.models import Order

User = get_user_model()


class AdminUserListSerializer(serializers.ModelSerializer):
    """
    Serializer for the admin user management view.
    Exposes Ghost User status: is_active=False means the user was auto-created
    from a phone number and has never registered (Ghost/Unregistered).
    """
    is_ghost = serializers.SerializerMethodField()
    total_orders = serializers.SerializerMethodField()
    active_orders = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "phone_number",
            "role",
            "is_verified",
            "is_active",
            "is_ghost",
            "total_orders",
            "active_orders",
            "created_at",
        )
        read_only_fields = fields

    def get_is_ghost(self, obj):
        """
        A Ghost User is one who was auto-created by the system (is_active=False)
        and has never explicitly registered.
        """
        return not obj.is_active and not obj.is_verified

    def get_total_orders(self, obj):
        return getattr(obj, "total_orders", 0)

    def get_active_orders(self, obj):
        return getattr(obj, "active_orders", 0)


class AdminUserViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Admin endpoint to list and manage all users.
    Supports filtering by role: ?role=customer | ?role=rider | ?role=partner
    Ghost users (auto-created, inactive) are included and flagged.
    """
    serializer_class = AdminUserListSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        active_order_statuses = [
            Order.Status.PENDING,
            Order.Status.PICKED_UP,
            Order.Status.WASHING,
        ]
        queryset = User.objects.annotate(
            total_orders=Count("orders", distinct=True),
            active_orders=Count(
                "orders",
                filter=Q(orders__status__in=active_order_statuses),
                distinct=True,
            ),
        ).order_by("-created_at")

        role_param = self.request.query_params.get("role")
        if role_param:
            queryset = queryset.filter(role=role_param)

        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )

        return queryset


class CustomerDirectorySerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)
    is_ghost = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "phone_number",
            "email",
            "is_active",
            "is_verified",
            "is_ghost",
            "order_count",
            "created_at",
        )
        read_only_fields = fields

    def get_is_ghost(self, obj):
        return not obj.is_active


class CustomerDirectoryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = CustomerDirectorySerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        queryset = (
            User.objects.filter(role=User.Role.CUSTOMER)
            .annotate(order_count=Count("orders", distinct=True))
            .prefetch_related(
                Prefetch("orders", queryset=Order.objects.only("id", "customer_id"))
            )
            .order_by("-created_at")
        )

        search = (self.request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search)
                | Q(phone_number__icontains=search)
                | Q(email__icontains=search)
            )
        return queryset


class RiderFleetSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        min_length=8,
    )
    current_load = serializers.IntegerField(read_only=True)
    completed_orders = serializers.IntegerField(read_only=True)
    satisfaction_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "phone_number",
            "is_active",
            "is_verified",
            "current_load",
            "completed_orders",
            "satisfaction_rate",
            "created_at",
            "updated_at",
            "password",
        )
        read_only_fields = ("id", "current_load", "created_at", "updated_at")

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone_number(self, value):
        from .utils import normalize_phone_number

        return normalize_phone_number(value)

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        email = validated_data["email"]
        phone_number = validated_data["phone_number"]
        full_name = validated_data["full_name"]
        username = email or phone_number

        user = User(
            username=username,
            role=User.Role.RIDER,
            full_name=full_name,
            email=email,
            phone_number=phone_number,
            is_active=validated_data.get("is_active", True),
            is_verified=validated_data.get("is_verified", False),
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()

        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class RiderFleetViewSet(viewsets.ModelViewSet):
    serializer_class = RiderFleetSerializer
    permission_classes = [IsStaffAdminRole]

    ACTIVE_ORDER_STATUSES = [
        Order.Status.PENDING,
        Order.Status.PICKED_UP,
        Order.Status.WASHING,
        Order.Status.WASHED,
        Order.Status.DRIED,
        Order.Status.READY,
        Order.Status.OUT_FOR_DELIVERY,
    ]

    def get_queryset(self):
        queryset = (
            User.objects.filter(role=User.Role.RIDER)
            .annotate(
                current_load=Count(
                    "rider_orders",
                    filter=Q(rider_orders__status__in=self.ACTIVE_ORDER_STATUSES),
                    distinct=True,
                ),
                completed_orders=Count(
                    "rider_orders",
                    filter=Q(rider_orders__status=Order.Status.DELIVERED),
                    distinct=True,
                ),
                satisfaction_rate=Coalesce(
                    Avg("rider_reviews__rating"),
                    Value(0.0),
                    output_field=FloatField(),
                ),
            )
            .prefetch_related(
                Prefetch(
                    "rider_orders",
                    queryset=Order.objects.select_related("partner", "customer").only(
                        "id",
                        "status",
                        "rider_id",
                        "partner_id",
                        "customer_id",
                    ),
                )
            )
            .order_by("full_name")
        )

        search = (self.request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search)
                | Q(phone_number__icontains=search)
                | Q(email__icontains=search)
            )
        return queryset
