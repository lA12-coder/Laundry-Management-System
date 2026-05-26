from __future__ import annotations

from datetime import date, datetime, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, DecimalField, F, Q, Sum, Value
from django.db.models.functions import Coalesce, TruncDate, TruncHour, TruncMonth
from django.utils import timezone

from orders.models import Order
from partners.models import LaundryPartner

User = get_user_model()

ACTIVE_STATUSES = [
    Order.Status.PENDING,
    Order.Status.PICKED_UP,
    Order.Status.WASHING,
    Order.Status.READY,
    Order.Status.OUT_FOR_DELIVERY,
]

VALID_PERIODS = frozenset({"1d", "7d", "30d", "12m"})


def normalize_period(raw: str | None) -> str:
    key = (raw or "7d").lower().strip()
    return key if key in VALID_PERIODS else "7d"


def period_window(period_key: str) -> tuple[datetime, datetime, str]:
    """Return (start, end, granularity) where granularity is hour|day|month."""
    end = timezone.now()
    if period_key == "1d":
        return end - timedelta(days=1), end, "hour"
    if period_key == "7d":
        return end - timedelta(days=7), end, "day"
    if period_key == "12m":
        return end - timedelta(days=365), end, "month"
    return end - timedelta(days=30), end, "day"


def _decimal_to_float(value) -> float:
    if value is None:
        return 0.0
    return float(value)


def _bucket_label(dt: datetime, granularity: str) -> str:
    if granularity == "hour":
        return dt.strftime("%H:%M")
    if granularity == "month":
        return dt.strftime("%b %Y")
    return dt.strftime("%a %d")


def _generate_bucket_keys(start: datetime, end: datetime, granularity: str) -> list[datetime]:
    keys: list[datetime] = []
    cursor = start
    if granularity == "hour":
        cursor = cursor.replace(minute=0, second=0, microsecond=0)
        while cursor <= end:
            keys.append(cursor)
            cursor += timedelta(hours=1)
        return keys[-24:] if len(keys) > 24 else keys

    if granularity == "month":
        cursor = cursor.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        while cursor <= end:
            keys.append(cursor)
            if cursor.month == 12:
                cursor = cursor.replace(year=cursor.year + 1, month=1)
            else:
                cursor = cursor.replace(month=cursor.month + 1)
        return keys[-12:] if len(keys) > 12 else keys

    cursor = cursor.replace(hour=0, minute=0, second=0, microsecond=0)
    while cursor <= end:
        keys.append(cursor)
        cursor += timedelta(days=1)
    return keys


def _normalize_row_bucket(bucket, granularity: str):
    if bucket is None:
        return None
    if isinstance(bucket, datetime):
        if granularity == "hour":
            return bucket.replace(minute=0, second=0, microsecond=0)
        if granularity == "month":
            return bucket.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        return bucket.date()
    if isinstance(bucket, date):
        if granularity == "month":
            return bucket.replace(day=1)
        return bucket
    return bucket


def _lookup_key(bucket_dt: datetime, granularity: str):
    if granularity == "day":
        return bucket_dt.date()
    if granularity == "hour":
        return bucket_dt.replace(minute=0, second=0, microsecond=0)
    return bucket_dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _annotate_buckets(order_qs, granularity: str):
    if granularity == "hour":
        return order_qs.annotate(bucket=TruncHour("created_at"))
    if granularity == "month":
        return order_qs.annotate(bucket=TruncMonth("created_at"))
    return order_qs.annotate(bucket=TruncDate("created_at"))


def build_revenue_trend(order_qs, start: datetime, end: datetime, granularity: str) -> list[dict]:
    rows = (
        _annotate_buckets(order_qs, granularity)
        .values("bucket")
        .annotate(
            revenue=Coalesce(Sum("total_amount"), Value(0, output_field=DecimalField())),
            orders=Count("id"),
        )
    )
    by_bucket = {
        _normalize_row_bucket(row["bucket"], granularity): row
        for row in rows
        if row["bucket"] is not None
    }

    trend = []
    for bucket_dt in _generate_bucket_keys(start, end, granularity):
        row = by_bucket.get(_lookup_key(bucket_dt, granularity))
        revenue = _decimal_to_float(row["revenue"]) if row else 0.0
        orders = int(row["orders"]) if row else 0
        trend.append(
            {
                "label": _bucket_label(bucket_dt, granularity),
                "date": bucket_dt.date().isoformat(),
                "revenue": revenue,
                "orders": orders,
            }
        )
    return trend


def build_order_volume(order_qs, start: datetime, end: datetime, granularity: str) -> list[dict]:
    rows = (
        _annotate_buckets(order_qs, granularity)
        .values("bucket")
        .annotate(
            regular=Count("id", filter=Q(urgency=Order.Urgency.REGULAR)),
            urgent=Count("id", filter=Q(urgency=Order.Urgency.URGENT)),
        )
    )
    by_bucket = {
        _normalize_row_bucket(row["bucket"], granularity): row
        for row in rows
        if row["bucket"] is not None
    }

    volume = []
    for bucket_dt in _generate_bucket_keys(start, end, granularity):
        row = by_bucket.get(_lookup_key(bucket_dt, granularity))
        volume.append(
            {
                "label": _bucket_label(bucket_dt, granularity),
                "date": bucket_dt.date().isoformat(),
                "regular": int(row["regular"]) if row else 0,
                "urgent": int(row["urgent"]) if row else 0,
            }
        )
    return volume


def build_period_metrics(order_qs) -> dict:
    delivered_q = Q(status=Order.Status.DELIVERED)
    agg = order_qs.aggregate(
        gross_revenue=Coalesce(Sum("total_amount"), Value(0, output_field=DecimalField())),
        total_orders=Count("id"),
        delivered_orders=Count("id", filter=delivered_q),
        urgent_orders=Count("id", filter=Q(urgency=Order.Urgency.URGENT)),
        platform_margin=Coalesce(
            Sum(F("total_amount") - F("base_price")),
            Value(0, output_field=DecimalField()),
        ),
        active_orders=Count("id", filter=Q(status__in=ACTIVE_STATUSES)),
        pending_pickups=Count("id", filter=Q(status=Order.Status.PENDING)),
    )
    return {key: _decimal_to_float(val) if isinstance(val, Decimal) else val for key, val in agg.items()}


def build_rider_leaderboard(start: datetime, end: datetime) -> list[dict]:
    delivered_filter = Q(
        rider_orders__status=Order.Status.DELIVERED,
        rider_orders__created_at__gte=start,
        rider_orders__created_at__lte=end,
    )
    pending_filter = Q(rider_orders__status__in=ACTIVE_STATUSES)

    riders = (
        User.objects.filter(role=User.Role.RIDER, is_active=True)
        .annotate(
            current_load=Count("rider_orders", filter=pending_filter),
            completed=Count("rider_orders", filter=delivered_filter),
            pending=Count("rider_orders", filter=pending_filter),
        )
        .order_by("-completed", "current_load", "full_name")
        .values(
            "id",
            "full_name",
            "email",
            "current_load",
            "completed",
            "pending",
        )[:12]
    )

    result = []
    for rider in riders:
        load = rider["current_load"] or 0
        completed = rider["completed"] or 0
        pending = rider["pending"] or 0
        total = completed + pending
        efficiency = round((completed / total) * 100, 1) if total else 0.0
        result.append(
            {
                **rider,
                "efficiency_pct": efficiency,
            }
        )
    return result


def build_partner_capacity(start: datetime, end: datetime) -> list[dict]:
    period_days = max((end - start).days, 1)
    delivered_filter = Q(
        orders__status=Order.Status.DELIVERED,
        orders__created_at__gte=start,
        orders__created_at__lte=end,
    )

    partners = (
        LaundryPartner.objects.filter(is_active=True)
        .annotate(
            completed_in_period=Count("orders", filter=delivered_filter),
            total_earnings=Coalesce(
                Sum("orders__base_price", filter=delivered_filter),
                Value(0, output_field=DecimalField()),
            ),
        )
        .order_by("-completed_in_period", "business_name")
        .values(
            "id",
            "business_name",
            "capacity_per_day",
            "completed_in_period",
            "total_earnings",
        )[:10]
    )

    rows = []
    for partner in partners:
        capacity = partner["capacity_per_day"] or 0
        completed = partner["completed_in_period"] or 0
        capacity_budget = capacity * period_days if capacity else 0
        if capacity_budget > 0:
            utilization = min(100.0, round((completed / capacity_budget) * 100, 1))
        else:
            utilization = 0.0 if completed == 0 else 100.0

        rows.append(
            {
                "id": partner["id"],
                "business_name": partner["business_name"],
                "capacity_per_day": capacity,
                "completed_in_period": completed,
                "capacity_budget": capacity_budget,
                "utilization_pct": utilization,
                "total_earnings": _decimal_to_float(partner["total_earnings"]),
                "at_risk": utilization >= 85.0,
            }
        )
    return rows


def build_dashboard_payload(period_key: str) -> dict:
    period = normalize_period(period_key)
    start, end, granularity = period_window(period)
    order_qs = Order.objects.filter(created_at__gte=start, created_at__lte=end).exclude(
        status=Order.Status.CANCELLED
    )

    return {
        "period": period,
        "granularity": granularity,
        "range": {
            "start": start.isoformat(),
            "end": end.isoformat(),
        },
        "metrics": build_period_metrics(order_qs),
        "revenue_trend": build_revenue_trend(order_qs, start, end, granularity),
        "order_volume": build_order_volume(order_qs, start, end, granularity),
        "riders": build_rider_leaderboard(start, end),
        "partners": build_partner_capacity(start, end),
    }
