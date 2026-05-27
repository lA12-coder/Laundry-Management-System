from rest_framework.permissions import BasePermission

from accounts.models import User


class IsStaffAdminRole(BasePermission):
    """
    Allows access only to staff users with ADMIN role.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_staff
            and user.role == User.Role.ADMIN
        )


class IsSuperAdminUser(BasePermission):
    """Django superuser only — global system configuration writes."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_superuser)


class IsRiderRole(BasePermission):
    """Active authenticated riders only."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.role == User.Role.RIDER
        )


class IsPartnerRole(BasePermission):
    """Active authenticated laundry partners only."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.role == User.Role.PARTNER
        )
