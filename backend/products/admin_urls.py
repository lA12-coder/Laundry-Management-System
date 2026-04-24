from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminProductViewSet

router = DefaultRouter()
router.register(r'products', AdminProductViewSet, basename="admin-product")

urlpatterns = [
    path('', include(router.urls)),
]
