from django.contrib.auth import get_user_model
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, FloatField, Prefetch, Q, Value
from django.db.models.functions import Coalesce
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from core.permissions import IsManagerOrSuperAdmin, IsStaffAdminRole
from orders.models import AdminActionLog, Order
from .models import CustomerNotification, CustomerSubscription, SubscriptionPlan

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


class AdminUserWriteSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=False,
        min_length=8,
    )
    access_level = serializers.ChoiceField(
        choices=["manager", "staff"],
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "email",
            "phone_number",
            "role",
            "is_active",
            "is_verified",
            "password",
            "access_level",
        )
        read_only_fields = ("id",)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone_number(self, value):
        from .utils import normalize_phone_number

        return normalize_phone_number(value)

    def validate(self, attrs):
        role = attrs.get("role")
        access_level = attrs.get("access_level")
        request = self.context.get("request")
        actor = getattr(request, "user", None)
        target_role = role or getattr(self.instance, "role", None) or User.Role.CUSTOMER

        if actor and actor.role == User.Role.ADMIN and not actor.is_superuser and not actor.is_staff:
            raise serializers.ValidationError("Staff users cannot manage user accounts.")

        # Managers can only manage staff-level admin accounts.
        if actor and actor.role == User.Role.ADMIN and actor.is_staff and not actor.is_superuser:
            if target_role != User.Role.ADMIN:
                raise serializers.ValidationError(
                    "Managers can only create or edit staff admin accounts."
                )
            if access_level == "manager":
                raise serializers.ValidationError("Managers cannot create peer manager accounts.")

        if target_role == User.Role.ADMIN:
            if access_level == "manager":
                attrs["is_staff"] = True
            elif access_level == "staff":
                attrs["is_staff"] = False
        return attrs

    def create(self, validated_data):
        # Virtual RBAC input used for policy decisions only, not a model field.
        validated_data.pop("access_level", None)
        validated_data.pop("password", None)
        return User.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # Virtual RBAC input used for policy decisions only, not a model field.
        validated_data.pop("access_level", None)
        validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    Admin endpoint to list and manage all users.
    Supports filtering by role: ?role=customer | ?role=rider | ?role=partner
    Ghost users (auto-created, inactive) are included and flagged.
    """
    serializer_class = AdminUserListSerializer
    permission_classes = [IsManagerOrSuperAdmin]

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return AdminUserWriteSerializer
        return AdminUserListSerializer

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

    def _ensure_actor_can_manage_target(self, target_user: User):
        actor = self.request.user
        if actor.is_superuser:
            return

        # Manager cannot modify/delete superadmin or another manager.
        if target_user.is_superuser:
            raise PermissionDenied("Managers cannot modify the superadmin account.")
        if target_user.role != User.Role.ADMIN or target_user.is_staff:
            raise PermissionDenied("Managers can only manage staff accounts.")

    def _log_user_action(self, *, action: str, target: User, previous_value: str, new_value: str, metadata: dict):
        AdminActionLog.objects.create(
            admin_user=self.request.user,
            action=action,
            previous_value=previous_value,
            new_value=new_value,
            metadata={
                "target_user_id": target.id,
                "target_email": target.email,
                **(metadata or {}),
            },
        )

    def perform_create(self, serializer):
        actor = self.request.user
        user = serializer.save(
            username=(serializer.validated_data.get("email") or serializer.validated_data.get("phone_number")),
        )
        password = serializer.validated_data.get("password")
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        if user.role != User.Role.ADMIN:
            user.is_staff = False
        user.save()

        # Manager can only create staff account.
        if actor.role == User.Role.ADMIN and actor.is_staff and not actor.is_superuser:
            if user.role != User.Role.ADMIN or user.is_staff:
                user.delete()
                raise serializers.ValidationError("Managers can only create staff admin accounts.")

        self._log_user_action(
            action=AdminActionLog.Action.USER_CREATED,
            target=user,
            previous_value="",
            new_value=f"role={user.role},is_staff={user.is_staff},is_active={user.is_active}",
            metadata={"event": "user_created"},
        )

    def perform_update(self, serializer):
        target = self.get_object()
        self._ensure_actor_can_manage_target(target)
        previous = f"role={target.role},is_staff={target.is_staff},is_active={target.is_active}"
        user = serializer.save()
        password = serializer.validated_data.get("password")
        if password:
            user.set_password(password)
            user.save(update_fields=["password"])
        self._log_user_action(
            action=AdminActionLog.Action.USER_UPDATED,
            target=user,
            previous_value=previous,
            new_value=f"role={user.role},is_staff={user.is_staff},is_active={user.is_active}",
            metadata={"event": "user_updated"},
        )

    def perform_destroy(self, instance):
        actor = self.request.user
        if actor.id == instance.id:
            raise PermissionDenied("You cannot delete your own account.")
        self._ensure_actor_can_manage_target(instance)
        self._log_user_action(
            action=AdminActionLog.Action.USER_DELETED,
            target=instance,
            previous_value=f"role={instance.role},is_staff={instance.is_staff},is_active={instance.is_active}",
            new_value="deleted",
            metadata={"event": "user_deleted"},
        )
        instance.delete()


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
    permission_classes = [IsManagerOrSuperAdmin]

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


class CustomerSubscriptionAdminSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.full_name", read_only=True)
    customer_email = serializers.EmailField(source="customer.email", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    receipt_url = serializers.SerializerMethodField()
    approved_by_name = serializers.CharField(source="approved_by.full_name", read_only=True)

    class Meta:
        model = CustomerSubscription
        fields = (
            "id",
            "customer",
            "customer_name",
            "customer_email",
            "plan",
            "plan_name",
            "status",
            "start_date",
            "end_date",
            "receipt_url",
            "admin_note",
            "approved_by",
            "approved_by_name",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields

    def get_receipt_url(self, obj):
        if not obj.receipt_image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.receipt_image.url)
        return obj.receipt_image.url


class SubscriptionDecisionSerializer(serializers.Serializer):
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)


class SubscriptionPlanAdminSerializer(serializers.ModelSerializer):
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
            "sort_order",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_features(self, value):
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Features must be a list of strings.")
        cleaned = []
        for feature in value:
            text = str(feature).strip()
            if text:
                cleaned.append(text)
        return cleaned


def _push_admin_subscription_notice(event: str, message: str, subscription: CustomerSubscription):
    admin_users = User.objects.filter(
        is_active=True,
    ).filter(Q(is_superuser=True) | Q(is_staff=True, role=User.Role.ADMIN))
    notices = [
        CustomerNotification(
            user=admin_user,
            title="Subscription alert",
            message=message,
            notification_type=CustomerNotification.NotificationType.SYSTEM,
            metadata={
                "event": event,
                "subscription_id": subscription.id,
                "customer_id": subscription.customer_id,
                "plan_id": subscription.plan_id,
                "status": subscription.status,
            },
        )
        for admin_user in admin_users
    ]
    if notices:
        CustomerNotification.objects.bulk_create(notices)


def _expire_stale_subscriptions():
    today = timezone.localdate()
    stale = CustomerSubscription.objects.select_related("customer", "plan").filter(
        status=CustomerSubscription.Status.ACTIVE,
        end_date__lt=today,
    )
    for subscription in stale:
        subscription.status = CustomerSubscription.Status.EXPIRED
        subscription.save(update_fields=["status", "updated_at"])
        _push_admin_subscription_notice(
            event="subscription_expired",
            message=(
                f"{subscription.customer.full_name or subscription.customer.email} "
                f"{subscription.plan.name} subscription has expired."
            ),
            subscription=subscription,
        )


class SubscriptionReviewViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = CustomerSubscriptionAdminSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        _expire_stale_subscriptions()
        queryset = CustomerSubscription.objects.select_related(
            "customer", "plan", "approved_by"
        ).order_by("-created_at")
        status_filter = (self.request.query_params.get("status") or "").strip()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(customer__full_name__icontains=search)
                | Q(customer__email__icontains=search)
                | Q(plan__name__icontains=search)
            )
        return queryset

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        subscription = self.get_object()
        serializer = SubscriptionDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        today = timezone.localdate()
        subscription.status = CustomerSubscription.Status.ACTIVE
        subscription.start_date = today
        subscription.end_date = today + timedelta(days=subscription.plan.duration_days)
        subscription.approved_by = request.user
        subscription.admin_note = serializer.validated_data.get("note", "").strip()
        subscription.save(
            update_fields=[
                "status",
                "start_date",
                "end_date",
                "approved_by",
                "admin_note",
                "updated_at",
            ]
        )
        return Response(self.get_serializer(subscription).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        subscription = self.get_object()
        serializer = SubscriptionDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.validated_data.get("note", "").strip()
        if not note:
            note = "Receipt rejected by admin."
        subscription.status = CustomerSubscription.Status.DISABLED
        subscription.approved_by = request.user
        subscription.admin_note = note
        subscription.save(update_fields=["status", "approved_by", "admin_note", "updated_at"])
        return Response(self.get_serializer(subscription).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="disable")
    def disable(self, request, pk=None):
        subscription = self.get_object()
        serializer = SubscriptionDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.validated_data.get("note", "").strip() or "Disabled by admin."
        subscription.status = CustomerSubscription.Status.DISABLED
        subscription.approved_by = request.user
        subscription.admin_note = note
        subscription.save(update_fields=["status", "approved_by", "admin_note", "updated_at"])
        _push_admin_subscription_notice(
            event="subscription_disabled",
            message=f"{subscription.customer.full_name} subscription was manually disabled.",
            subscription=subscription,
        )
        return Response(self.get_serializer(subscription).data, status=status.HTTP_200_OK)


class SubscriptionPlanAdminViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionPlanAdminSerializer
    permission_classes = [IsStaffAdminRole]

    def get_queryset(self):
        queryset = SubscriptionPlan.objects.order_by("sort_order", "price", "name")
        status_filter = (self.request.query_params.get("status") or "").strip().lower()
        if status_filter == "active":
            queryset = queryset.filter(is_active=True)
        elif status_filter == "inactive":
            queryset = queryset.filter(is_active=False)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(slug__icontains=search))
        return queryset
