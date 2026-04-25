from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrderViewSet,
    OrderManagementViewSet,
    DashboardMetricsViewSet,
    FinancialTransactionViewSet,
    AdminActionLogViewSet
)


router = DefaultRouter()

# --- Public/Rider Endpoints ---
router.register(r'orders', OrderViewSet, basename="order")
urlpatterns = [
    path('', include(router.urls)),
]