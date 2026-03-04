from rest_framework import viewsets
from .models import Payment

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
