from rest_framework import viewsets
from .models import Order

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
