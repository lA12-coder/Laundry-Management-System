from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response

from accounts.models import User
from .models import Order
from .serializers import OrderListSerializer
from .services import calculate_order_price, assign_rider

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderListSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        items = data.get('items', [])
        is_urgent = data.get('is_urgent', False)
        # Calculate price
        total = calculate_order_price(items, is_urgent)
        data['total_amount'] = total
        # Assignment logic (simple: first available rider)
        available_riders = User.objects.filter(role=User.Role.RIDER, is_active=True)
        assigned_rider = assign_rider(None, list(available_riders))
        if assigned_rider:
            data['rider'] = assigned_rider.pk
        # Transactional save
        with transaction.atomic():
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            # Payment, commission, etc. logic would go here
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
