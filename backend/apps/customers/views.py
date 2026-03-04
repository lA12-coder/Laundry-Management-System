from rest_framework import viewsets
from .models import Customer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
