from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LaundryPartnerViewSet

router = DefaultRouter()
router.register(r'partners', LaundryPartnerViewSet, basename='partner')

urlpatterns = [
    path('', include(router.urls)),
]
