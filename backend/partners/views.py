from rest_framework import viewsets, permissions
from .models import LaundryPartner
from .serializers import LaundryPartnerSerializer

class LaundryPartnerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public viewset for listing approved and active partners.
    """
    queryset = LaundryPartner.objects.filter(is_approved=True, is_active=True)
    serializer_class = LaundryPartnerSerializer
    permission_classes = [permissions.AllowAny]
