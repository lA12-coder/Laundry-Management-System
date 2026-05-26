from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AdminActionLogViewSet,
    ClothCategoryViewSet,
    DashboardMetricsViewSet,
    FinancialTransactionViewSet,
    OrderManagementViewSet,
    PriceListViewSet,
)

router = DefaultRouter()
router.register(r'dashboard-metrics', DashboardMetricsViewSet, basename="admin-dashboard")
router.register(r'orders', OrderManagementViewSet, basename="admin-order-management")
router.register(r'transactions', FinancialTransactionViewSet, basename="admin-transactions")
router.register(r'audit-logs', AdminActionLogViewSet, basename="admin-audit-logs")
router.register(r'price-list', PriceListViewSet, basename="pricelist")
router.register(r'price-categories', ClothCategoryViewSet, basename="cloth-category")

urlpatterns = [
    path('', include(router.urls)),
]
