from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .rider_views import RiderJobViewSet

router = DefaultRouter()
router.register(r"jobs", RiderJobViewSet, basename="rider-job")

urlpatterns = [
    path("", include(router.urls)),
]
