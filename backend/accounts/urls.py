from django.urls import path
from .views import (
    ChangePasswordView,
    ClaimAccountView,
    CustomerNotificationListView,
    CustomerNotificationReadView,
    GhostSessionView,
    LoginView,
    LogoutView,
    MeView,
    NotificationPreferenceView,
    RefreshView,
    RegisterView,
    ResendVerificationEmailView,
    SecuritySettingsView,
    SubscriptionPlanListView,
    CustomerSubscriptionCheckoutView,
    CustomerSubscriptionListView,
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
    path("ghost-session/", GhostSessionView.as_view(), name="ghost_session"),
    path("claim-account/", ClaimAccountView.as_view(), name="claim_account"),
    path("notifications/", CustomerNotificationListView.as_view(), name="customer_notifications"),
    path(
        "notifications/mark-read/",
        CustomerNotificationReadView.as_view(),
        name="customer_notifications_mark_read",
    ),
    path("subscription-plans/", SubscriptionPlanListView.as_view(), name="subscription_plan_list"),
    path("subscriptions/checkout/", CustomerSubscriptionCheckoutView.as_view(), name="subscription_checkout"),
    path("subscriptions/me/", CustomerSubscriptionListView.as_view(), name="subscription_me"),
]