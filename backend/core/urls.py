from django.contrib import admin
from django.urls import include, path

from .views import api_root

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_root, name="api-root"),
    
    # Public/Customer Endpoints
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("products.urls")),
    path("api/", include("partners.urls")),
    
    # Admin Specific Endpoints
    path("api/admin/", include("orders.admin_urls")),
    path("api/admin/", include("partners.admin_urls")),
    path("api/admin/", include("products.admin_urls")),
]
