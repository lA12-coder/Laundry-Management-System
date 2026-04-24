from rest_framework import viewsets, permissions
from .models import Product
from .serializers import ProductSerializer
from core.permissions import IsStaffAdminRole

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public viewset for listing active products.
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]


