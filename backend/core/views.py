from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse


@api_view(["GET"])
def api_root(request, format=None):
    """
    API Root — lists all available API endpoints.
    """
    return Response({
        "accounts": {
            "register": reverse("register", request=request, format=format),
            "login": reverse("login", request=request, format=format),
            "logout": reverse("logout", request=request, format=format),
            "token_refresh": reverse("token_refresh", request=request, format=format),
            "me": reverse("me", request=request, format=format),
            "verify_email": "POST /api/accounts/verify-email/<uidb64>/<token>/",
            "resend_verification_email": reverse("resend_verification_email", request=request, format=format),
        },
        "public": {
            "orders": reverse("order-list", request=request, format=format),
            "products": reverse("product-list", request=request, format=format),
            "partners": reverse("partner-list", request=request, format=format),
        },
        "admin": {
            "dashboard_metrics": reverse("admin-dashboard-list", request=request, format=format),
            "orders": reverse("admin-order-management-list", request=request, format=format),
            "transactions": reverse("admin-transactions-list", request=request, format=format),
            "audit_logs": reverse("admin-audit-logs-list", request=request, format=format),
            "price_list": reverse("admin-pricelist-list", request=request, format=format),
            "products": reverse("admin-products-list", request=request, format=format),
            "partners": reverse("admin-partners-list", request=request, format=format),
            "system_config": reverse("admin-system-config", request=request, format=format),
        },
    })
