from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminUserViewSet,
    CustomerDirectoryViewSet,
    RiderFleetViewSet,
    SubscriptionReviewViewSet,
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r"customers", CustomerDirectoryViewSet, basename="admin-customers")
router.register(r"riders", RiderFleetViewSet, basename="admin-riders")
router.register(r"subscriptions", SubscriptionReviewViewSet, basename="admin-subscriptions")

urlpatterns = [
    path('', include(router.urls)),
]
