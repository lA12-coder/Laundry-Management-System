from rest_framework import viewsets
from .models import Product
from .serializers import ProductSerializer
from core.permissions import IsStaffAdminRole

class AdminProductViewSet(viewsets.ModelViewSet):
    """
    Admin viewset for managing products.
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsStaffAdminRole]
