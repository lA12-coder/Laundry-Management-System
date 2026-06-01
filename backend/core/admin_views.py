from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import LaundryLocation, SystemConfiguration, Testimonial
from .permissions import IsStaffAdminRole, IsSuperAdminUser
from .serializers import (
    LaundryLocationSerializer,
    SystemConfigurationSerializer,
    TestimonialSerializer,
)


class SystemConfigurationView(APIView):
    """
    GET  /api/admin/system-config/  — staff admins (read)
    PATCH /api/admin/system-config/ — superuser only (write)
    """

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT"):
            return [IsSuperAdminUser()]
        return [IsStaffAdminRole()]

    def get(self, request):
        config = SystemConfiguration.load()
        return Response(SystemConfigurationSerializer(config).data)

    def patch(self, request):
        config = SystemConfiguration.load()
        serializer = SystemConfigurationSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TestimonialModeratorViewSet(viewsets.ModelViewSet):
    serializer_class = TestimonialSerializer
    permission_classes = [IsStaffAdminRole]
    queryset = Testimonial.objects.all().order_by("-created_at")


class LaundryLocationAdminViewSet(viewsets.ModelViewSet):
    serializer_class = LaundryLocationSerializer
    permission_classes = [IsStaffAdminRole]
    queryset = LaundryLocation.objects.all().order_by("hub_name")
