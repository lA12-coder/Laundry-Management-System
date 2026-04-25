from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """
    Admin site configuration for User model.
    """
    list_display = ('email','username','role','is_verified','is_active','is_staff')
    list_filter = ('role','is_verified','is_active','is_staff')
    search_fields = ('email','username','phone_number')
    ordering = ('email',)

