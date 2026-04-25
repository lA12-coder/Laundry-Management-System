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
