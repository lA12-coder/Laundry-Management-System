from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import PartnerOversightViewSet

router = DefaultRouter()
router.register(r'partners', PartnerOversightViewSet, basename="admin-partners")

urlpatterns = [
    path('', include(router.urls)),
]
