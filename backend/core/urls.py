from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import (
    ContactSubmitView,
    PublicLaundryLocationsView,
    PublicTestimonialsView,
    TestimonialSubmitView,
    api_root,
    health_check,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/", api_root, name="api-root"),
    path("api/contact/submit/", ContactSubmitView.as_view(), name="public_contact_submit"),
    path("api/testimonials/public/", PublicTestimonialsView.as_view(), name="public_testimonials"),
    path("api/testimonials/submit/", TestimonialSubmitView.as_view(), name="testimonial_submit"),
    path("api/locations/public/", PublicLaundryLocationsView.as_view(), name="public_laundry_locations"),

    # API Endpoints
    path("api/", include([
        path("accounts/", include("accounts.urls")),
        path("", include("orders.urls")),
        path("", include("products.urls")),
        path("", include("partners.urls")),
        path("rider/", include("orders.rider_urls")),
        path("partner/", include("orders.partner_urls")),

        # Admin-only Endpoints
        path("admin/", include([
            path("", include("core.admin_urls")),
            path("", include("orders.admin_urls")),
            path("", include("partners.admin_urls")),
            path("", include("products.admin_urls")),
            path("", include("accounts.admin_urls")),
        ])),
    ])),
]

if settings.DEBUG or settings.SERVE_MEDIA:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
