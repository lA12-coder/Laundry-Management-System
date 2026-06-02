from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.views import APIView

from .models import LaundryLocation, Testimonial
from .serializers import (
    ContactSubmissionSerializer,
    PublicLaundryLocationSerializer,
    PublicTestimonialSerializer,
    TestimonialSubmissionSerializer,
)


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
            "subscription_plans": reverse("subscription_plan_list", request=request, format=format),
            "subscription_checkout": reverse("subscription_checkout", request=request, format=format),
            "my_subscriptions": reverse("subscription_me", request=request, format=format),
        },
        "public": {
            "orders": reverse("order-list", request=request, format=format),
            "products": reverse("product-list", request=request, format=format),
            "partners": reverse("partner-list", request=request, format=format),
            "testimonials": reverse("public_testimonials", request=request, format=format),
            "testimonial_submit": reverse("testimonial_submit", request=request, format=format),
            "hub_locations": reverse("public_laundry_locations", request=request, format=format),
            "contact_submit": reverse("public_contact_submit", request=request, format=format),
        },
        "partner": {
            "orders": reverse("partner-order-list", request=request, format=format),
            "analytics": reverse("partner-order-analytics", request=request, format=format),
            "ledger": reverse("partner-order-ledger", request=request, format=format),
        },
        "admin": {
            "dashboard_metrics": reverse("admin-dashboard-list", request=request, format=format),
            "orders": reverse("admin-order-management-list", request=request, format=format),
            "transactions": reverse("admin-transactions-list", request=request, format=format),
            "partner_settlements": reverse(
                "admin-partner-settlements-list", request=request, format=format
            ),
            "audit_logs": reverse("admin-audit-logs-list", request=request, format=format),
            "price_list": reverse("admin-pricelist-list", request=request, format=format),
            "products": reverse("admin-products-list", request=request, format=format),
            "partners": reverse("admin-partners-list", request=request, format=format),
            "system_config": reverse("admin-system-config", request=request, format=format),
            "subscription_queue": reverse("admin-subscriptions-list", request=request, format=format),
            "testimonials": reverse("admin-testimonials-list", request=request, format=format),
            "laundry_locations": reverse("admin-laundry-locations-list", request=request, format=format),
        },
    })


class PublicTestimonialsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        queryset = Testimonial.objects.filter(is_approved_for_public=True).order_by("-created_at")
        serializer = PublicTestimonialSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class TestimonialSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = TestimonialSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        testimonial = serializer.save(is_approved_for_public=False)
        return Response(
            {
                "id": testimonial.id,
                "message": "Thank you. Your testimonial is pending admin approval.",
            },
            status=status.HTTP_201_CREATED,
        )


class PublicLaundryLocationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        queryset = LaundryLocation.objects.filter(is_active=True).order_by("hub_name")
        serializer = PublicLaundryLocationSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ContactSubmitView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = ContactSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data

        subject = f"FuaLaundry Contact Form — {payload['name']}"
        body = (
            f"Name: {payload['name']}\n"
            f"Email: {payload['email']}\n\n"
            f"Message:\n{payload['message']}"
        )
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
                recipient_list=["fualaundry16@gmail.com"],
                fail_silently=False,
                reply_to=[payload["email"]],
            )
        except Exception as exc:
            return Response(
                {"message": f"Unable to deliver email right now: {exc}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {"message": "Contact message submitted successfully."},
            status=status.HTTP_200_OK,
        )
