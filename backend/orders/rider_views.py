from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from accounts.models import User
from core.permissions import IsRiderRole
from .models import AdminActionLog, Order
from .rider_serializers import RiderJobSerializer


def _parse_rider_coords(request):
    lat = request.query_params.get("lat")
    lng = request.query_params.get("lng")
    if lat is None or lng is None:
        return None
    try:
        return float(lat), float(lng)
    except (TypeError, ValueError):
        return None


class RiderJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Rider logistics API — privacy wall until explicit job acceptance.
    """

    serializer_class = RiderJobSerializer
    permission_classes = [IsRiderRole]

    ACTIVE_STATUSES = [
        Order.Status.PENDING,
        Order.Status.PICKED_UP,
        Order.Status.WASHING,
        Order.Status.READY,
        Order.Status.OUT_FOR_DELIVERY,
    ]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["rider_coords"] = _parse_rider_coords(self.request)
        return context

    def get_queryset(self):
        user = self.request.user
        return (
            Order.objects.select_related("customer", "partner", "rider")
            .prefetch_related("cloth_items")
            .annotate(_cloth_items_count=Count("cloth_items"))
            .filter(
                Q(
                    rider__isnull=True,
                    status__in=[
                        Order.Status.READY,
                        Order.Status.OUT_FOR_DELIVERY,
                        Order.Status.PICKED_UP,
                    ],
                )
                | Q(rider=user)
            )
            .exclude(status__in=[Order.Status.DELIVERED, Order.Status.CANCELLED])
            .order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        payload = serializer.data

        incoming = []
        active = []
        for job in payload:
            if job.get("is_assignment_accepted"):
                active.append(job)
            else:
                incoming.append(job)

        return Response(
            {
                "incoming": incoming,
                "active": active,
                "count": len(payload),
            }
        )

    @action(detail=True, methods=["post"], url_path="accept")
    def accept_assignment(self, request, pk=None):
        """
        Rider locks the order to their user ID and unlocks contact/address fields.
        Mirrors admin reassign-rider semantics but scoped to self only.
        """
        order = self.get_object()
        user = request.user

        if order.status in (Order.Status.DELIVERED, Order.Status.CANCELLED):
            return Response(
                {"detail": "This order is no longer available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if order.rider_id and order.rider_id != user.id:
            return Response(
                {"detail": "Order is assigned to another rider."},
                status=status.HTTP_403_FORBIDDEN,
            )

        previous_rider = str(order.rider_id) if order.rider_id else ""
        order.rider = user
        order.rider_accepted_at = timezone.now()
        order.save(update_fields=["rider", "rider_accepted_at"])

        AdminActionLog.objects.create(
            admin_user=user,
            order=order,
            action=AdminActionLog.Action.REASSIGN_RIDER,
            previous_value=previous_rider,
            new_value=str(user.id),
            metadata={"source": "rider_self_accept"},
        )

        serializer = self.get_serializer(order)
        return Response(serializer.data)
