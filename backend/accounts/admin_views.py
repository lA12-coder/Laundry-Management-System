from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import mixins, viewsets, serializers
from rest_framework.response import Response
from rest_framework.decorators import action
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
