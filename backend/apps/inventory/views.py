from rest_framework import viewsets
from .models import InventoryItem

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
