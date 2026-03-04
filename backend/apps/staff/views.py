from rest_framework import viewsets
from .models import Staff

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
