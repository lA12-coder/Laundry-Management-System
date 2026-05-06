from django.contrib import admin
from django.urls import include, path

from .views import api_root

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api_root, name="api-root"),

    # API Endpoints
    path("api/", include([
        path("accounts/", include("accounts.urls")),
        path("", include("orders.urls")),
        path("", include("products.urls")),
        path("", include("partners.urls")),

        # Admin-only Endpoints
        path("admin/", include([
            path("", include("orders.admin_urls")),
            path("", include("partners.admin_urls")),
            path("", include("products.admin_urls")),
            path("", include("accounts.admin_urls")),
        ])),
    ])),
]
