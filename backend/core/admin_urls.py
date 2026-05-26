from django.urls import path

from .admin_views import SystemConfigurationView

urlpatterns = [
    path("system-config/", SystemConfigurationView.as_view(), name="admin-system-config"),
]
