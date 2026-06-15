from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import permission_classes
import logging
from typing import Any
from rest_framework import generics,status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.db.utils import OperationalError, ProgrammingError

User = get_user_model()

from .models import CustomerNotification, CustomerSubscription, SubscriptionPlan
from .serializers import (
    ChangePasswordSerializer,
    ClaimAccountSerializer,
    CustomerNotificationSerializer,
    GhostSessionSerializer,
    MarkNotificationsReadSerializer,
    NotificationPreferenceSerializer,
    SecuritySettingsSerializer,
    UserDetailSerializer,
    UserLoginSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
    CustomerSubscriptionSerializer,
    SubscriptionCheckoutSerializer,
    SubscriptionPlanSerializer,
)

logger = logging.getLogger(__name__)


def expire_subscriptions_and_notify_admins() -> int:
    today = timezone.localdate()
    to_expire = CustomerSubscription.objects.select_related("customer", "plan").filter(
        status=CustomerSubscription.Status.ACTIVE,
        end_date__lt=today,
    )
    expired_count = 0
    for subscription in to_expire:
        subscription.status = CustomerSubscription.Status.EXPIRED
        subscription.save(update_fields=["status", "updated_at"])
        expired_count += 1

        admin_users = User.objects.filter(
            is_active=True,
        ).filter(Q(is_superuser=True) | Q(is_staff=True, role=User.Role.ADMIN))
        notices = [
            CustomerNotification(
                user=admin_user,
                title="Subscription expired",
                message=(
                    f"{subscription.customer.full_name or subscription.customer.email} "
                    f"has an expired {subscription.plan.name} subscription."
                ),
                notification_type=CustomerNotification.NotificationType.SYSTEM,
                metadata={
                    "event": "subscription_expired",
                    "subscription_id": subscription.id,
                    "customer_id": subscription.customer_id,
                    "plan_id": subscription.plan_id,
                },
            )
            for admin_user in admin_users
        ]
        if notices:
            CustomerNotification.objects.bulk_create(notices)
    return expired_count


def json_response(
    *,
    status_text: str,
    message: str,
    data: Any | None = None,
    errors: Any | None = None,
    http_status: int = status.HTTP_200_OK,
) -> Response:
    payload: dict[str, Any] = {"status": status_text, "message": message}
    if errors is not None:
        payload["errors"] = errors
    else:
        payload["data"] = data if data is not None else {}
    return Response(payload, status=http_status)


def _get_client_ip(request: Any) -> str:
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _log_auth_attempt(request: Any, success: bool, username: str = "unknown") -> None:
    logger.info(
        "auth_login_attempt username=%s success=%s ip=%s user_agent=%s",
        username,
        success,
        _get_client_ip(request),
        request.META.get("HTTP_USER_AGENT", "unknown"),
    )

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Registration failed due to validation errors.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()
        return json_response(
            status_text="success",
            message="User registered successfully.",
            data=UserDetailSerializer(user).data,
            http_status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = UserLoginSerializer
    permission_classes = [AllowAny]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        identifier = str(request.data.get("email") or request.data.get("username") or "").strip()
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            _log_auth_attempt(request, success=False, username=identifier or "unknown")
            return json_response(
                status_text="error",
                message="Invalid credentials provided.",
                errors=serializer.errors,
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.user
        if not user.is_active:
            return json_response(
                status_text = "error",
                message = "Account is inactive.",
                http_status = status.HTTP_401_UNAUTHORIZED
            )

        _log_auth_attempt(request, success=True, username=user.email)
        return json_response(
            status_text="success",
            message="Login successful.",
            data=serializer.validated_data,
            http_status=status.HTTP_200_OK,
        )


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Refresh token is invalid or expired.",
                errors=serializer.errors,
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        return json_response(
            status_text="success",
            message="Token refreshed successfully.",
            data=serializer.validated_data,
            http_status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return json_response(
                status_text="error",
                message="Refresh token is required.",
                errors={"refresh": ["This field is required."]},
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return json_response(
                status_text="error",
                message="Refresh token is invalid or already expired.",
                errors={"refresh": ["Token is invalid or expired."]},
                http_status=status.HTTP_401_UNAUTHORIZED,
            )

        return json_response(
            status_text="success",
            message="Logout successful.",
            data={},
            http_status=status.HTTP_200_OK,
        )
        
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        return json_response(
            status_text="success",
            message="User profile fetched successfully.",
            data=UserDetailSerializer(request.user).data,
            http_status=status.HTTP_200_OK,
        )

    def patch(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Profile update failed due to validation errors.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return json_response(
            status_text="success",
            message="Profile updated successfully.",
            data=UserDetailSerializer(request.user).data,
            http_status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = ChangePasswordSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Password change failed due to validation errors.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        old_password = serializer.validated_data["old_password"]
        new_password = serializer.validated_data["new_password"]
        user = request.user

        if not user.check_password(old_password):
            return json_response(
                status_text="error",
                message="Current password is incorrect.",
                errors={"old_password": ["Current password is incorrect."]},
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return json_response(
            status_text="success",
            message="Password changed successfully.",
            data={},
            http_status=status.HTTP_200_OK,
        )


class NotificationPreferenceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = NotificationPreferenceSerializer(request.user)
        return json_response(
            status_text="success",
            message="Notification preferences fetched successfully.",
            data=serializer.data,
            http_status=status.HTTP_200_OK,
        )

    def patch(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = NotificationPreferenceSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Notification preferences update failed.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return json_response(
            status_text="success",
            message="Notification preferences updated successfully.",
            data=serializer.data,
            http_status=status.HTTP_200_OK,
        )


class SecuritySettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = SecuritySettingsSerializer(request.user, data=request.data, partial=True)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Security settings update failed.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return json_response(
            status_text="success",
            message="Security settings updated successfully.",
            data=serializer.data,
            http_status=status.HTTP_200_OK,
        )



def _issue_token_pair(user: User) -> dict[str, Any]:
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserDetailSerializer(user).data,
    }


class GhostSessionView(APIView):
    """
    Temporary-link session for ghost customers (is_active=False).
    Enables dashboard access before account claim.
    """

    permission_classes = [AllowAny]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = GhostSessionSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Ghost session could not be started.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        phone = serializer.validated_data["phone_number"]
        user = User.objects.filter(
            phone_number=phone,
            role=User.Role.CUSTOMER,
            is_active=False,
        ).first()
        if not user:
            return json_response(
                status_text="error",
                message="No guest profile found for this phone number.",
                http_status=status.HTTP_404_NOT_FOUND,
            )

        return json_response(
            status_text="success",
            message="Guest session started.",
            data=_issue_token_pair(user),
            http_status=status.HTTP_200_OK,
        )


class ClaimAccountView(APIView):
    """Finalize ghost account: phone match, password setup, activate profile."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = ClaimAccountSerializer(
            data=request.data,
            context={"request": request},
        )
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Account claim failed due to validation errors.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        email = (serializer.validated_data.get("email") or "").strip().lower()
        if email and email != user.email:
            if User.objects.filter(email=email).exclude(pk=user.pk).exists():
                return json_response(
                    status_text="error",
                    message="Email is already registered.",
                    errors={"email": ["This email is already in use."]},
                    http_status=status.HTTP_400_BAD_REQUEST,
                )
            user.email = email

        user.set_password(serializer.validated_data["password"])
        user.is_active = True
        user.is_verified = True
        user.save()

        order_count = user.orders.count()
        return json_response(
            status_text="success",
            message="Account claimed successfully. Your order history is now secured.",
            data={
                **_issue_token_pair(user),
                "orders_linked": order_count,
            },
            http_status=status.HTTP_200_OK,
        )


class CustomerNotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        try:
            limit = min(int(request.query_params.get("limit", 50)), 100)
        except (TypeError, ValueError):
            limit = 50

        try:
            queryset = CustomerNotification.objects.filter(user=request.user).order_by(
                "-created_at"
            )[:limit]
            unread_count = CustomerNotification.objects.filter(
                user=request.user,
                is_read=False,
            ).count()
            serializer = CustomerNotificationSerializer(queryset, many=True)
            payload = {
                "results": serializer.data,
                "unread_count": unread_count,
            }
        except (ProgrammingError, OperationalError):
            logger.exception("Customer notifications table unavailable.")
            payload = {
                "results": [],
                "unread_count": 0,
            }

        return json_response(
            status_text="success",
            message="Notifications fetched successfully.",
            data=payload,
            http_status=status.HTTP_200_OK,
        )


class CustomerNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        serializer = MarkNotificationsReadSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Invalid notification read payload.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        ids = serializer.validated_data.get("ids") or []
        try:
            queryset = CustomerNotification.objects.filter(user=request.user, is_read=False)
            if ids:
                queryset = queryset.filter(pk__in=ids)
            updated = queryset.update(is_read=True)
            unread_count = CustomerNotification.objects.filter(
                user=request.user,
                is_read=False,
            ).count()
        except (ProgrammingError, OperationalError):
            logger.exception("Customer notifications table unavailable for mark-read.")
            updated = 0
            unread_count = 0

        return json_response(
            status_text="success",
            message="Notifications marked as read.",
            data={"updated": updated, "unread_count": unread_count},
            http_status=status.HTTP_200_OK,
        )


class SubscriptionPlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by("sort_order", "price")
        serializer = SubscriptionPlanSerializer(plans, many=True)
        return json_response(
            status_text="success",
            message="Subscription plans fetched successfully.",
            data=serializer.data,
            http_status=status.HTTP_200_OK,
        )


class CustomerSubscriptionCheckoutView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        if request.user.role != User.Role.CUSTOMER:
            return json_response(
                status_text="error",
                message="Only customers can create subscriptions.",
                http_status=status.HTTP_403_FORBIDDEN,
            )
        serializer = SubscriptionCheckoutSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError:
            return json_response(
                status_text="error",
                message="Subscription checkout validation failed.",
                errors=serializer.errors,
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        subscription = CustomerSubscription.objects.create(
            customer=request.user,
            plan=serializer.validated_data["plan"],
            receipt_image=serializer.validated_data["receipt_image"],
            status=CustomerSubscription.Status.PENDING_APPROVAL,
        )
        payload = CustomerSubscriptionSerializer(subscription, context={"request": request}).data
        return json_response(
            status_text="success",
            message="Subscription submitted and pending admin approval.",
            data=payload,
            http_status=status.HTTP_201_CREATED,
        )


class CustomerSubscriptionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Any, *args: Any, **kwargs: Any) -> Response:
        expire_subscriptions_and_notify_admins()
        queryset = (
            CustomerSubscription.objects.select_related("plan")
            .filter(customer=request.user)
            .order_by("-created_at")
        )
        serializer = CustomerSubscriptionSerializer(queryset, many=True, context={"request": request})
        return json_response(
            status_text="success",
            message="Customer subscriptions fetched successfully.",
            data=serializer.data,
            http_status=status.HTTP_200_OK,
        )

