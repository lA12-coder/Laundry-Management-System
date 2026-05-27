from decimal import Decimal

from django.db.models import (
    Count,
    DecimalField,
    IntegerField,
    OuterRef,
    Prefetch,
    Q,
    Subquery,
    Sum,
    Value,
)
from django.db.models.functions import Coalesce
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import IsStaffAdminRole
from orders.models import AdminActionLog, Order, TransactionLog
from .models import LaundryPartner
from .serializers import LaundryPartnerSerializer, PartnerCreateSerializer

class PartnerOversightViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsStaffAdminRole]

    def get_serializer_class(self):
        if self.action == "create":
            return PartnerCreateSerializer
        return LaundryPartnerSerializer

    def get_queryset(self):
        active_statuses = [
            Order.Status.PENDING,
            Order.Status.PICKED_UP,
            Order.Status.WASHING,
            Order.Status.READY,
            Order.Status.OUT_FOR_DELIVERY,
        ]
        partner_orders = Order.objects.filter(partner_id=OuterRef("pk"))
        current_load_subquery = (
            partner_orders.filter(status__in=active_statuses)
            .values("partner_id")
            .annotate(total=Count("id", distinct=True))
            .values("total")[:1]
        )
        pending_orders_subquery = (
            partner_orders.filter(status=Order.Status.PENDING)
            .values("partner_id")
            .annotate(total=Count("id", distinct=True))
            .values("total")[:1]
        )
        payout_total_subquery = (
            TransactionLog.objects.filter(order__partner_id=OuterRef("pk"))
            .values("order__partner_id")
            .annotate(total=Sum("partner_earning"))
            .values("total")[:1]
        )

        queryset = LaundryPartner.objects.select_related("owner").prefetch_related(
            Prefetch("orders", queryset=Order.objects.only("id", "partner_id", "status"))
        ).annotate(
            current_load=Coalesce(
                Subquery(current_load_subquery, output_field=IntegerField()),
                Value(0),
                output_field=IntegerField(),
            ),
            pending_orders=Coalesce(
                Subquery(pending_orders_subquery, output_field=IntegerField()),
                Value(0),
                output_field=IntegerField(),
            ),
            payout_total=Coalesce(
                Subquery(payout_total_subquery, output_field=DecimalField(max_digits=12, decimal_places=2)),
                Value(Decimal("0.00")),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
        )

        search = (self.request.query_params.get("search") or "").strip()
        if search:
            queryset = queryset.filter(
                Q(business_name__icontains=search)
                | Q(owner__full_name__icontains=search)
                | Q(owner__email__icontains=search)
                | Q(owner__phone_number__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        partner = serializer.save()
        output = LaundryPartnerSerializer(partner, context={"request": request})
        return Response(output.data, status=201)

    def perform_destroy(self, instance):
        owner = instance.owner
        instance.delete()
        if owner.role == owner.Role.PARTNER:
            owner.delete()

    def _save_partner_status(self, request, partner, is_approved, is_active, source):
        previous_approved = partner.is_approved
        previous_active = partner.is_active

        partner.is_approved = is_approved
        partner.is_active = is_active
        partner.save(update_fields=["is_approved", "is_active", "updated_at"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            action=(
                AdminActionLog.Action.PARTNER_APPROVAL
                if is_approved and is_active
                else AdminActionLog.Action.PARTNER_DEACTIVATION
            ),
            previous_value=f"approved={previous_approved},active={previous_active}",
            new_value=f"approved={partner.is_approved},active={partner.is_active}",
            metadata={"partner_id": partner.id, "source": source},
        )

    @action(methods=["post"], detail=True, url_path="approve")
    def approve(self, request, pk=None):
        partner = self.get_object()
        self._save_partner_status(
            request=request,
            partner=partner,
            is_approved=True,
            is_active=True,
            source="approve_action",
        )
        return Response(self.get_serializer(partner).data)

    @action(methods=["post"], detail=True, url_path="deactivate")
    def deactivate(self, request, pk=None):
        partner = self.get_object()
        self._save_partner_status(
            request=request,
            partner=partner,
            is_approved=False,
            is_active=False,
            source="deactivate_action",
        )
        return Response(self.get_serializer(partner).data)

    @action(methods=["post"], detail=True, url_path="toggle_approval")
    def toggle_approval(self, request, pk=None):
        partner = self.get_object()
        next_state = not (partner.is_approved and partner.is_active)
        self._save_partner_status(
            request=request,
            partner=partner,
            is_approved=next_state,
            is_active=next_state,
            source="toggle_approval_action",
        )
        return Response(self.get_serializer(partner).data)
