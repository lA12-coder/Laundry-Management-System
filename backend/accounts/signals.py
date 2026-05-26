from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from .models import User
import os

@receiver(post_save,sender=User)
def send_verification_email(sender, instance, created, **kwargs):
    if created and not instance.is_verified and instance.is_active and instance.email:
        token = default_token_generator.make_token(instance)
        uid = urlsafe_base64_encode(force_bytes(instance.pk))
        verify_url = f"{os.getenv('FRONT_END_URL')}/verify-email/{uid}/{token}"
        send_mail(
            subject="Verify your FuaLaundry Account",
            message=f"Welcome to FuaLaundry! Please verify your email by clicking here: {verify_url}",
            from_email=os.getenv('EMAIL_HOST_USER'),
            recipient_list=[instance.email],
            fail_silently=False,
        )