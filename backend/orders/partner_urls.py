from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PartnerOrderViewSet

router = DefaultRouter()
router.register(r"orders", PartnerOrderViewSet, basename="partner-order")

urlpatterns = [
    path("", include(router.urls)),
]
