from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SystemConfiguration
from .permissions import IsStaffAdminRole, IsSuperAdminUser
from .serializers import SystemConfigurationSerializer


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
