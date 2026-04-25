from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', _('Admin')
        RIDER = 'rider', _('Rider')
        CUSTOMER = 'customer', _('Customer')
        PARTNER = 'partner', _('Partner Laundry')
    
    email = models.EmailField(_('email address'), unique=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=15) 
    role =  models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    home_address = models.CharField(max_length=255, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone_number']
    
    def __str__(self) -> str:
        return f"{self.username} ({self.role})"