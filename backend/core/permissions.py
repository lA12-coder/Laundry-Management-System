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


class IsAdminOperatorRole(BasePermission):
    """
    Allows authenticated admin-role operators:
    - Superadmin (is_superuser=True)
    - Manager/Admin (role=admin, is_staff=True)
    - Staff/Operations (role=admin, is_staff=False)
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and (user.is_superuser or user.role == User.Role.ADMIN)
        )


class IsManagerOrSuperAdmin(BasePermission):
    """
    Allows:
    - Superadmin (is_superuser=True)
    - Manager/Admin (role=admin and is_staff=True)
    Denies Staff/Operations.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and (user.is_superuser or (user.role == User.Role.ADMIN and user.is_staff))
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
