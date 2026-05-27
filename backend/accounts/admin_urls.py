from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminUserViewSet,
    CustomerDirectoryViewSet,
    RiderFleetViewSet,
)

router = DefaultRouter()
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r"customers", CustomerDirectoryViewSet, basename="admin-customers")
router.register(r"riders", RiderFleetViewSet, basename="admin-riders")

urlpatterns = [
    path('', include(router.urls)),
]
