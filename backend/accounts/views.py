from django.utils.http import urlsafe_base64_decode
from rest_framework.decorators import permission_classes
import logging
from typing import Any
from rest_framework import generics,status
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from .signals import send_verification_email

User = get_user_model()

from .serializers import (
    ChangePasswordSerializer,
    NotificationPreferenceSerializer,
    SecuritySettingsSerializer,
    UserDetailSerializer,
    UserLoginSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
)

logger = logging.getLogger(__name__)


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
        if not user.is_verified:
            return json_response(
                status_text = "error",
                message = "Please verify your email before logging in.",
                http_status = status.HTTP_401_UNAUTHORIZED
            )

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



class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode('utf-8')
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_verified = True
            user.save()
            return json_response(
                status_text="success",
                message="Email verified successfully.",
                http_status=status.HTTP_200_OK,
            )

        return json_response(
            status_text="error",
            message="Invalid or expired verification link.",
            http_status=status.HTTP_400_BAD_REQUEST,
        )

    def post(self, request, uidb64, token):
        return self.get(request, uidb64, token)

class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]
    
    def post(self,request):
        email = request.data.get("email")
        if not email:
            return json_response(
                status_text="error",
                message="Email is required.",
                errors={"email": ["This field is required."]},
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.filter(email=email).first()
        if not user:
            return json_response(
                status_text="error",
                message="User not found.",
                http_status=status.HTTP_404_NOT_FOUND,
            )
        if user.is_verified:
            return json_response(
                status_text="error",
                message="User is already verified.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )
        send_verification_email(sender=User,instance=user,created=True)
        return json_response(
            status_text="success",
            message="Verification email sent successfully.",
            http_status=status.HTTP_200_OK,
        )

