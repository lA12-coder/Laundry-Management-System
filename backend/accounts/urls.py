from django.urls import path
from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    NotificationPreferenceView,
    RefreshView,
    RegisterView,
    ResendVerificationEmailView,
    SecuritySettingsView,
    VerifyEmailView,
)



urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", RefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("notification-preferences/", NotificationPreferenceView.as_view(), name="notification_preferences"),
    path("security-settings/", SecuritySettingsView.as_view(), name="security_settings"),
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification-email/', ResendVerificationEmailView.as_view(), name='resend_verification_email'),
]