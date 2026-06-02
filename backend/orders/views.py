from decimal import Decimal
from datetime import timedelta

from django.db import transaction
from django.db.models import Count, Q, Sum, Value, DecimalField, F
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from django.contrib.auth import get_user_model

from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import JSONParser, FormParser, MultiPartParser

from core.permissions import IsAdminOperatorRole, IsManagerOrSuperAdmin, IsPartnerRole
from partners.models import LaundryPartner
from .models import (
    Order,
    TransactionLog,
    AdminActionLog,
    PriceList,
    ClothCategory,
    RiderReview,
)
from .pagination import AdminOrderPagination
from .serializers import (
    OrderListSerializer,
    OrderStatusOverrideSerializer,
    OrderReassignRiderSerializer,
    OrderAssignPartnerSerializer,
    PartnerOrderStatusUpdateSerializer,
    PartnerSettlementClearSerializer,
    CustomerReceiveConfirmationSerializer,
    TransactionLogSerializer,
    LedgerSummarySerializer,
    AdminActionLogSerializer,
    PriceListSerializer,
    BulkPriceUpdateSerializer,
    ClothCategorySerializer,
    MAX_PRICE,
)
from core.models import SystemConfiguration
from .services import calculate_order_price, build_cloth_items, assign_least_loaded_rider
from .dashboard_analytics import build_dashboard_payload
from accounts.utils import normalize_phone_number

User = get_user_model()


def _parse_query_date(value):
    """parse_date() requires a str; query params may be missing (None)."""
    if not value or not isinstance(value, str):
        return None
    return parse_date(value.strip())


class OrderViewSet(viewsets.ModelViewSet):
    """
    Handles Order creation for both registered and guest (Ghost) users.
    Used primarily by Riders and Customers.
    """
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Optimize for the current user's role
        user = self.request.user
        base_qs = Order.objects.select_related(
            "customer",
            "partner",
            "rider",
            "rider_review",
        ).prefetch_related("cloth_items")
        if user.role == User.Role.ADMIN:
            return base_qs.all()
        elif user.role == User.Role.RIDER:
            return base_qs.filter(rider=user)
        return base_qs.filter(customer=user)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        customer_phone = data.get('customer_phone')
        customer_name = data.get('customer_name', 'Guest Customer')
        customer_address = data.get('delivery_address') 

        if not customer_address:
            return Response(
                {"error": "Customer address is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not customer_phone:
            return Response(
                {"error": "Customer phone number is required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            customer_phone = normalize_phone_number(customer_phone)
        except ValidationError as exc:
            return Response(
                {"error": str(exc.detail[0] if isinstance(exc.detail, list) else exc.detail)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        config = SystemConfiguration.load()
        if config.max_daily_orders_cap:
            today = timezone.localdate()
            today_count = Order.objects.filter(created_at__date=today).count()
            if today_count >= config.max_daily_orders_cap:
                return Response(
                    {"error": "Daily order capacity reached. Please try again tomorrow."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        with transaction.atomic():
            # Reuse an existing customer by normalized phone (handles legacy duplicates safely).
            customer_user = (
                User.objects.filter(
                    phone_number=customer_phone,
                    role=User.Role.CUSTOMER,
                )
                .order_by("-is_active", "-is_verified", "-created_at")
                .first()
            )

            if customer_user is None:
                customer_user = User.objects.create(
                    phone_number=customer_phone,
                    username=customer_phone,
                    full_name=customer_name,
                    role=User.Role.CUSTOMER,
                    is_active=False,
                    home_address=customer_address,
                )
                customer_user.set_unusable_password()
                customer_user.save()
            elif customer_address and not customer_user.home_address:
                customer_user.home_address = customer_address
                customer_user.save(update_fields=["home_address"])

            data['customer'] = customer_user.pk

            items = data.get('items', [])
            is_urgent = data.get('urgency') == Order.Urgency.URGENT

            # Look up real prices from PriceList — returns (total_amount, base_price)
            try:
                total_amount, base_price = calculate_order_price(items, is_urgent)
            except ValueError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

            data['total_amount'] = total_amount
            data['base_price'] = base_price

            # Auto-assign least-loaded rider when enabled in system preferences
            if config.auto_assign_riders and not data.get("rider"):
                available_riders = User.objects.filter(role=User.Role.RIDER, is_active=True)
                assigned_rider = assign_least_loaded_rider(
                    available_riders,
                    prefer_urgent=config.urgent_orders_first and is_urgent,
                )
                if assigned_rider:
                    data["rider"] = assigned_rider.pk

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            order = serializer.save(total_amount=total_amount, base_price=base_price)

            # Bulk-create ClothItem rows with snapshotted prices
            entry_ids = [item.get('price_list_entry_id') for item in items if item.get('price_list_entry_id')]
            price_map = {e.pk: e for e in PriceList.objects.filter(pk__in=entry_ids, is_active=True)}
            build_cloth_items(order, items, price_map)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="mark-received")
    def mark_received(self, request, pk=None):
        order = self.get_object()
        if order.customer_id != request.user.id:
            return Response(
                {"detail": "You can only confirm receipt for your own orders."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = CustomerReceiveConfirmationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order.customer_received_confirmed_at = timezone.now()
        if order.rider_delivered_confirmed_at:
            order.status = Order.Status.DELIVERED
            order.delivered_at = timezone.now()
            order.save(
                update_fields=[
                    "customer_received_confirmed_at",
                    "status",
                    "delivered_at",
                ]
            )
        else:
            if order.status not in [Order.Status.OUT_FOR_DELIVERY, Order.Status.DELIVERED]:
                order.status = Order.Status.OUT_FOR_DELIVERY
                order.save(
                    update_fields=["customer_received_confirmed_at", "status"]
                )
            else:
                order.save(update_fields=["customer_received_confirmed_at"])

        review_defaults = {
            "rating": serializer.validated_data["rating"],
            "comment": serializer.validated_data.get("comment", "").strip(),
            "rider_id": order.rider_id,
            "customer_id": request.user.id,
        }
        if order.rider_id:
            RiderReview.objects.update_or_create(
                order=order,
                defaults=review_defaults,
            )

        return Response(OrderListSerializer(order, context={"request": request}).data)


class OrderManagementViewSet(viewsets.ModelViewSet):
    """
    Administrative control panel for managing laundry lifecycle.
    Supports server-side pagination, sorting, and filtering via query params.
    """
    serializer_class = OrderListSerializer
    permission_classes = [IsAdminOperatorRole]
    pagination_class = AdminOrderPagination

    ALLOWED_ORDERING_FIELDS = {
        "id",
        "-id",
        "created_at",
        "-created_at",
        "total_amount",
        "-total_amount",
        "status",
        "-status",
        "delivered_at",
        "-delivered_at",
    }

    def get_queryset(self):
        queryset = (
            Order.objects.select_related("customer", "partner", "rider", "rider_review")
            .prefetch_related("cloth_items", "admin_action_logs")
        )

        params = self.request.query_params
        status_param = params.get("status")
        urgency_param = params.get("urgency")
        partner_param = params.get("partner")
        search_param = (params.get("search") or "").strip()

        if status_param:
            queryset = queryset.filter(status=status_param)
        if urgency_param:
            queryset = queryset.filter(urgency=urgency_param)
        if partner_param:
            queryset = queryset.filter(partner_id=partner_param)

        date_from = params.get("date_from")
        date_to = params.get("date_to")
        if date_from:
            parsed_from = parse_datetime(date_from) or _parse_query_date(date_from)
            if parsed_from:
                queryset = queryset.filter(created_at__gte=parsed_from)
        if date_to:
            parsed_to = parse_datetime(date_to)
            if not parsed_to:
                day = _parse_query_date(date_to)
                if day:
                    from datetime import datetime, time

                    parsed_to = timezone.make_aware(
                        datetime.combine(day, time.max),
                        timezone.get_current_timezone(),
                    )
            if parsed_to:
                queryset = queryset.filter(created_at__lte=parsed_to)

        if search_param:
            queryset = queryset.filter(
                Q(customer__full_name__icontains=search_param)
                | Q(customer__phone_number__icontains=search_param)
                | Q(customer__email__icontains=search_param)
                | Q(delivery_address__icontains=search_param)
                | Q(id__icontains=search_param)
            )

        ordering = params.get("ordering", "-created_at")
        if ordering not in self.ALLOWED_ORDERING_FIELDS:
            ordering = "-created_at"
        return queryset.order_by(ordering)

    @action(detail=False, methods=["get"], url_path="form-options")
    def form_options(self, request):
        """Riders with workload, partners, and lifecycle metadata for admin forms."""
        active_statuses = [
            Order.Status.PENDING,
            Order.Status.PICKED_UP,
            Order.Status.WASHING,
            Order.Status.WASHED,
            Order.Status.DRIED,
            Order.Status.READY,
            Order.Status.OUT_FOR_DELIVERY,
        ]

        riders = (
            User.objects.filter(role=User.Role.RIDER, is_active=True)
            .annotate(
                current_load=Count(
                    "rider_orders",
                    filter=Q(rider_orders__status__in=active_statuses),
                )
            )
            .order_by("current_load", "full_name")
            .values("id", "full_name", "email", "phone_number", "current_load")
        )

        partners = (
            LaundryPartner.objects.filter(is_active=True)
            .order_by("business_name")
            .values("id", "business_name", "capacity_per_day")
        )

        return Response(
            {
                "riders": list(riders),
                "partners": list(partners),
                "statuses": [
                    {"value": choice[0], "label": choice[1]}
                    for choice in Order.Status.choices
                ],
                "urgency": [
                    {"value": choice[0], "label": choice[1]}
                    for choice in Order.Urgency.choices
                ],
            }
        )

    @action(methods=["post"], detail=True, url_path="override-status")
    def override_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_status = order.status
        order.status = serializer.validated_data["status"]
        
        # Track timeline updates
        update_fields = ["status"]
        if order.status == Order.Status.DELIVERED:
            if not order.customer_received_confirmed_at:
                order.customer_received_confirmed_at = timezone.now()
                update_fields.append("customer_received_confirmed_at")
            if not order.rider_delivered_confirmed_at:
                order.rider_delivered_confirmed_at = timezone.now()
                update_fields.append("rider_delivered_confirmed_at")
            order.delivered_at = timezone.now()
            update_fields.append("delivered_at")

        order.save(update_fields=update_fields)

        AdminActionLog.objects.create(
            admin_user=request.user,
            order=order,
            action=AdminActionLog.Action.OVERRIDE_STATUS,
            previous_value=previous_status,
            new_value=order.status
        )
        return Response(OrderListSerializer(order).data)

    @action(methods=["post"], detail=True, url_path="reassign-rider")
    def reassign_rider(self, request, pk=None):
        order = self.get_object()
        serializer = OrderReassignRiderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        previous_rider = str(order.rider)
        order.rider = serializer.validated_data["rider"]
        order.rider_accepted_at = None
        order.save(update_fields=["rider", "rider_accepted_at"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            order=order,
            action=AdminActionLog.Action.REASSIGN_RIDER,
            previous_value=previous_rider,
            new_value=str(order.rider)
        )
        return Response(OrderListSerializer(order).data)

    @action(methods=["patch"], detail=True, url_path="assign-partner")
    def assign_partner(self, request, pk=None):
        """
        Manually bind an order to an existing laundry partner.
        Inline partner creation is intentionally not supported.
        """
        order = self.get_object()
        serializer = OrderAssignPartnerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        partner = serializer.validated_data["partner"]
        previous_partner = str(order.partner_id or "")
        order.partner = partner
        order.save(update_fields=["partner"])

        AdminActionLog.objects.create(
            admin_user=request.user,
            order=order,
            action=AdminActionLog.Action.ASSIGN_PARTNER,
            previous_value=previous_partner,
            new_value=str(partner.pk),
            metadata={"partner_name": partner.business_name},
        )
        return Response(OrderListSerializer(order).data)


class DashboardMetricsViewSet(viewsets.ViewSet):
    """
    Business intelligence telemetry for the admin dashboard.
    ?period=1d|7d|30d|12m
    """
    permission_classes = [IsManagerOrSuperAdmin]

    def list(self, request):
        period = request.query_params.get("period", "7d")
        return Response(build_dashboard_payload(period))


class FinancialTransactionViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = TransactionLogSerializer
    permission_classes = [IsManagerOrSuperAdmin]
    pagination_class = AdminOrderPagination
    queryset = TransactionLog.objects.select_related("order", "order__partner").all()

    def get_queryset(self):
        qs = (
            super()
            .get_queryset()
            .select_related("order", "order__partner")
            .only(
                "id",
                "created_at",
                "fualaundry_commission",
                "rider_fee",
                "partner_earning",
                "settlement_status",
                "paid_amount",
                "payment_date",
                "order__id",
                "order__total_amount",
                "order__status",
                "order__partner__business_name",
            )
        )
        date_from = _parse_query_date(self.request.query_params.get("date_from"))
        date_to = _parse_query_date(self.request.query_params.get("date_to"))
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        search = self.request.query_params.get("search", "").strip()
        if search:
            if search.isdigit():
                qs = qs.filter(order_id=int(search))
            else:
                qs = qs.filter(order__partner__business_name__icontains=search)
        ordering = self.request.query_params.get("ordering", "-created_at")
        allowed = {
            "created_at",
            "-created_at",
            "order_id",
            "-order_id",
            "base_value",
            "-base_value",
        }
        if ordering in allowed:
            if ordering in ("base_value", "-base_value"):
                prefix = "-" if ordering.startswith("-") else ""
                qs = qs.order_by(f"{prefix}order__total_amount")
            elif ordering in ("order_id", "-order_id"):
                prefix = "-" if ordering.startswith("-") else ""
                qs = qs.order_by(f"{prefix}order_id")
            else:
                qs = qs.order_by(ordering)
        return qs

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        qs = self.get_queryset()
        aggregates = qs.aggregate(
            gross_revenue=Coalesce(
                Sum("order__total_amount"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            platform_fees=Coalesce(
                Sum("fualaundry_commission"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            logistics_payouts=Coalesce(
                Sum("rider_fee"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            partner_payouts=Coalesce(
                Sum("partner_earning"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            transaction_count=Count("id"),
        )
        platform_fees = Decimal(aggregates["platform_fees"] or 0)
        logistics_payouts = Decimal(aggregates["logistics_payouts"] or 0)
        net_operational_profit = max(Decimal("0.00"), platform_fees - logistics_payouts)
        payload = {
            **aggregates,
            "net_operational_profit": net_operational_profit,
        }
        serializer = LedgerSummarySerializer(payload)
        return Response(serializer.data)


class AdminActionLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = AdminActionLogSerializer
    permission_classes = [IsManagerOrSuperAdmin]
    pagination_class = AdminOrderPagination

    def get_queryset(self):
        qs = (
            AdminActionLog.objects.select_related("admin_user", "order")
            .only(
                "id",
                "action",
                "previous_value",
                "new_value",
                "metadata",
                "created_at",
                "admin_user__email",
                "order__id",
            )
            .order_by("-created_at")
        )
        action = (self.request.query_params.get("action") or "").strip()
        if action:
            qs = qs.filter(action=action)

        search = (self.request.query_params.get("search") or "").strip()
        if search:
            if search.isdigit():
                qs = qs.filter(order_id=int(search))
            else:
                qs = qs.filter(
                    Q(admin_user__email__icontains=search)
                    | Q(previous_value__icontains=search)
                    | Q(new_value__icontains=search)
                )
        return qs


class PartnerOrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    Partner workspace API:
    - list/retrieve only orders assigned to the authenticated partner profile
    - update status only through WASHING -> WASHED -> DRIED pipeline
    """

    serializer_class = OrderListSerializer
    permission_classes = [IsPartnerRole]

    ACTIVE_STATUSES = [
        Order.Status.PENDING,
        Order.Status.PICKED_UP,
        Order.Status.WASHING,
        Order.Status.WASHED,
        Order.Status.DRIED,
        Order.Status.READY,
        Order.Status.OUT_FOR_DELIVERY,
    ]

    def _get_partner_profile(self):
        return getattr(self.request.user, "partner_profile", None)

    def get_queryset(self):
        partner = self._get_partner_profile()
        if not partner:
            return Order.objects.none()
        queryset = (
            Order.objects.select_related("customer", "partner", "rider", "rider_review")
            .prefetch_related("cloth_items")
            .filter(partner_id=partner.pk)
            .order_by("-created_at")
        )
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    @action(detail=True, methods=["patch"], url_path="update-status")
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = PartnerOrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        next_status = serializer.validated_data["status"]
        current_status = order.status

        # Partner processing lane: allow entering washing, then enforce strict sequence.
        if next_status == Order.Status.WASHING:
            if current_status not in [
                Order.Status.PENDING,
                Order.Status.PICKED_UP,
                Order.Status.READY,
                Order.Status.WASHING,
            ]:
                raise ValidationError({"status": "Cannot move this order back to washing."})
        elif current_status == Order.Status.WASHING and next_status == Order.Status.WASHED:
            pass
        elif current_status == Order.Status.WASHED and next_status == Order.Status.DRIED:
            pass
        else:
            raise ValidationError(
                {
                    "status": (
                        "Partner status transition must follow: "
                        "WASHING -> WASHED -> DRIED."
                    )
                }
            )

        order.status = next_status
        order.save(update_fields=["status"])
        return Response(OrderListSerializer(order).data)

    @action(detail=False, methods=["get"], url_path="analytics")
    def analytics(self, request):
        partner = self._get_partner_profile()
        if not partner:
            return Response(
                {
                    "partner": None,
                    "week_revenue": "0.00",
                    "month_revenue": "0.00",
                    "total_net_earnings": "0.00",
                    "paid_balance": "0.00",
                    "outstanding_debt": "0.00",
                }
            )

        now = timezone.now()
        week_start = now - timedelta(days=now.weekday())
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        logs = TransactionLog.objects.filter(order__partner_id=partner.pk).select_related("order")

        week_revenue = logs.filter(created_at__gte=week_start).aggregate(
            total=Coalesce(
                Sum("partner_earning"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            )
        )["total"]
        month_revenue = logs.filter(created_at__gte=month_start).aggregate(
            total=Coalesce(
                Sum("partner_earning"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            )
        )["total"]

        totals = logs.aggregate(
            total_net_earnings=Coalesce(
                Sum("partner_earning"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            paid_balance=Coalesce(
                Sum(
                    "paid_amount",
                    filter=Q(settlement_status=TransactionLog.SettlementStatus.PAID),
                ),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            outstanding_debt=Coalesce(
                Sum(
                    "partner_earning",
                    filter=Q(settlement_status=TransactionLog.SettlementStatus.UNPAID),
                ),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
        )
        return Response(
            {
                "partner": {
                    "id": partner.pk,
                    "business_name": partner.business_name,
                },
                "week_revenue": week_revenue,
                "month_revenue": month_revenue,
                **totals,
            }
        )

    @action(detail=False, methods=["get"], url_path="ledger")
    def ledger(self, request):
        partner = self._get_partner_profile()
        if not partner:
            return Response({"results": [], "summary": {"paid": "0.00", "unpaid": "0.00"}})

        logs = (
            TransactionLog.objects.select_related("order")
            .filter(order__partner_id=partner.pk)
            .order_by("-created_at")
        )
        rows = TransactionLogSerializer(logs, many=True).data
        summary = logs.aggregate(
            paid=Coalesce(
                Sum(
                    "paid_amount",
                    filter=Q(settlement_status=TransactionLog.SettlementStatus.PAID),
                ),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            unpaid=Coalesce(
                Sum(
                    "partner_earning",
                    filter=Q(settlement_status=TransactionLog.SettlementStatus.UNPAID),
                ),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
        )
        return Response({"results": rows, "summary": summary})


class PartnerSettlementViewSet(viewsets.ViewSet):
    """
    Admin settlement engine for clearing partner outstanding balances.
    """

    permission_classes = [IsManagerOrSuperAdmin]

    def list(self, request):
        partner_id = request.query_params.get("partner_id")
        partners_qs = LaundryPartner.objects.filter(is_active=True).order_by("business_name")
        if not partner_id:
            snapshots = []
            for partner in partners_qs:
                outstanding = (
                    TransactionLog.objects.filter(
                        order__partner_id=partner.pk,
                        settlement_status=TransactionLog.SettlementStatus.UNPAID,
                    ).aggregate(
                        total=Coalesce(
                            Sum("partner_earning"),
                            Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
                        )
                    )["total"]
                )
                snapshots.append(
                    {
                        "id": partner.pk,
                        "business_name": partner.business_name,
                        "outstanding_debt": outstanding,
                    }
                )
            return Response({"partners": snapshots})

        try:
            partner = partners_qs.get(pk=partner_id)
        except LaundryPartner.DoesNotExist:
            raise ValidationError({"partner_id": "Partner not found."})

        unpaid_qs = (
            TransactionLog.objects.select_related("order")
            .filter(
                order__partner_id=partner.pk,
                settlement_status=TransactionLog.SettlementStatus.UNPAID,
            )
            .order_by("created_at")
        )
        unpaid_rows = TransactionLogSerializer(unpaid_qs, many=True).data
        total_due = unpaid_qs.aggregate(
            total=Coalesce(
                Sum("partner_earning"),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            )
        )["total"]
        return Response(
            {
                "partner": {"id": partner.pk, "business_name": partner.business_name},
                "unpaid_orders": unpaid_rows,
                "total_due": total_due,
            }
        )

    def create(self, request):
        serializer = PartnerSettlementClearSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        partner = serializer.validated_data["partner"]

        with transaction.atomic():
            unpaid_qs = TransactionLog.objects.select_for_update().filter(
                order__partner_id=partner.pk,
                settlement_status=TransactionLog.SettlementStatus.UNPAID,
            )
            if not unpaid_qs.exists():
                return Response(
                    {
                        "updated_count": 0,
                        "paid_amount": Decimal("0.00"),
                        "payment_date": timezone.now(),
                    }
                )

            total_due = unpaid_qs.aggregate(
                total=Coalesce(
                    Sum("partner_earning"),
                    Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
                )
            )["total"]
            payment_date = timezone.now()
            updated_count = unpaid_qs.update(
                settlement_status=TransactionLog.SettlementStatus.PAID,
                paid_amount=F("partner_earning"),
                payment_date=payment_date,
            )

            AdminActionLog.objects.create(
                admin_user=request.user,
                action=AdminActionLog.Action.PARTNER_SETTLEMENT,
                previous_value="UNPAID",
                new_value="PAID",
                metadata={
                    "partner_id": partner.pk,
                    "partner_name": partner.business_name,
                    "paid_amount": str(total_due),
                    "updated_count": updated_count,
                    "payment_date": payment_date.isoformat(),
                },
            )

        return Response(
            {
                "updated_count": updated_count,
                "paid_amount": total_due,
                "payment_date": payment_date,
            }
        )

    @action(detail=False, methods=["get"], url_path="ledger")
    def ledger(self, request):
        partner_id = request.query_params.get("partner_id")
        logs = TransactionLog.objects.select_related("order", "order__partner").order_by("-created_at")
        if partner_id:
            logs = logs.filter(order__partner_id=partner_id)
        rows = TransactionLogSerializer(logs, many=True).data
        summary = logs.aggregate(
            paid=Coalesce(
                Sum(
                    "paid_amount",
                    filter=Q(settlement_status=TransactionLog.SettlementStatus.PAID),
                ),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
            unpaid=Coalesce(
                Sum(
                    "partner_earning",
                    filter=Q(settlement_status=TransactionLog.SettlementStatus.UNPAID),
                ),
                Value(0, output_field=DecimalField(max_digits=14, decimal_places=2)),
            ),
        )
        return Response({"results": rows, "summary": summary})


class ClothCategoryViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for cloth catalogue categories.
    GET  /api/admin/price-categories/
    POST /api/admin/price-categories/
    PATCH /api/admin/price-categories/{id}/
    DELETE /api/admin/price-categories/{id}/  (blocked if items exist)
    """

    serializer_class = ClothCategorySerializer
    queryset = ClothCategory.objects.all()

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return []
        return [IsAdminOperatorRole()]

    def get_queryset(self):
        qs = ClothCategory.objects.all().order_by("sort_order", "name")
        user = self.request.user
        is_pricing_operator = bool(
            user
            and user.is_authenticated
            and (user.is_superuser or getattr(user, "role", None) == User.Role.ADMIN)
        )
        if not is_pricing_operator:
            qs = qs.filter(is_active=True)
        return qs

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.price_entries.exists():
            return Response(
                {
                    "detail": (
                        "Cannot delete this category while catalogue items reference it. "
                        "Deactivate it or reassign those items first."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)


class PriceListViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD endpoint for the price catalogue.
    GET  /api/price-list/          — list active prices (public, for order form)
    POST /api/price-list/          — create new entry  (admin only)
    PATCH /api/price-list/{id}/    — update price      (admin only)
    DELETE /api/price-list/{id}/   — deactivate entry  (admin only)
    """
    serializer_class = PriceListSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        """Anyone can read the catalogue; only staff admins can mutate it."""
        if self.action in ["list", "retrieve"]:
            return []
        return [IsAdminOperatorRole()]

    def get_queryset(self):
        qs = (
            PriceList.objects.select_related("category")
            .all()
            .order_by("category__sort_order", "cloth_name", "size")
        )
        user = self.request.user
        is_pricing_operator = bool(
            user
            and user.is_authenticated
            and (user.is_superuser or getattr(user, "role", None) == User.Role.ADMIN)
        )
        if not is_pricing_operator:
            qs = qs.filter(is_active=True)
        return qs

    @action(detail=False, methods=["post"], url_path="bulk-update")
    def bulk_update(self, request):
        serializer = BulkPriceUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        queryset = self.get_queryset()
        if data.get("active_only", True):
            queryset = queryset.filter(is_active=True)
        if data.get("categories"):
            queryset = queryset.filter(category_id__in=data["categories"])
        if data.get("sizes"):
            queryset = queryset.filter(size__in=data["sizes"])

        apply_to = data["apply_to"]
        multiplier = data["multiplier"]
        updated = 0

        for entry in queryset:
            fields = []
            if apply_to in (BulkPriceUpdateSerializer.APPLY_FUA, BulkPriceUpdateSerializer.APPLY_BOTH):
                entry.fua_price = min(
                    (entry.fua_price * multiplier).quantize(Decimal("0.01")),
                    MAX_PRICE,
                )
                fields.append("fua_price")
            if apply_to in (
                BulkPriceUpdateSerializer.APPLY_PARTNER,
                BulkPriceUpdateSerializer.APPLY_BOTH,
            ):
                new_partner = (entry.partner_price * multiplier).quantize(Decimal("0.01"))
                entry.partner_price = min(new_partner, entry.fua_price, MAX_PRICE)
                fields.append("partner_price")
            if fields:
                entry.save(update_fields=fields + ["updated_at"])
                updated += 1

        return Response(
            {
                "updated": updated,
                "multiplier": str(multiplier),
                "apply_to": apply_to,
            }
        )

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate instead of hard-delete to preserve historical ClothItems."""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)