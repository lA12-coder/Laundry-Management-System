from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminActionLogViewSet,
    DashboardMetricsViewSet,
    FinancialTransactionViewSet,
    OrderManagementViewSet,
)

router = DefaultRouter()
router.register(r'dashboard-metrics', DashboardMetricsViewSet, basename="dashboard-metrics")
router.register(r'orders', OrderManagementViewSet, basename="admin-orders")
router.register(r'transactions', FinancialTransactionViewSet, basename="admin-transactions")
router.register(r'audit-logs', AdminActionLogViewSet, basename="admin-audit-logs")

urlpatterns = [
    path('', include(router.urls)),
]
