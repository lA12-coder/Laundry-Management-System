from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .admin_views import (
    LaundryLocationAdminViewSet,
    SystemConfigurationView,
    TestimonialModeratorViewSet,
)

router = DefaultRouter()
router.register(r"testimonials", TestimonialModeratorViewSet, basename="admin-testimonials")
router.register(r"laundry-locations", LaundryLocationAdminViewSet, basename="admin-laundry-locations")

urlpatterns = [
    path("system-config/", SystemConfigurationView.as_view(), name="admin-system-config"),
    path("", include(router.urls)),
]
