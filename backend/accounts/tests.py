from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AccountSettingsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="customer1",
            email="customer1@example.com",
            full_name="Customer One",
            phone_number="+251911111111",
            password="StrongPass123!",
            role=User.Role.CUSTOMER,
        )
        self.client.force_authenticate(self.user)

    def test_patch_profile(self):
        payload = {
            "full_name": "Updated Customer",
            "phone_number": "+251922222222",
            "home_address": "Bole, Addis Ababa",
            "secondary_addresses": ["Office - Megenagna"],
        }
        response = self.client.patch("/api/accounts/me/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, payload["full_name"])
        self.assertEqual(self.user.home_address, payload["home_address"])

    def test_change_password(self):
        response = self.client.post(
            "/api/accounts/change-password/",
            {"old_password": "StrongPass123!", "new_password": "AnotherPass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("AnotherPass123!"))

    def test_notification_preferences_update(self):
        response = self.client.patch(
            "/api/accounts/notification-preferences/",
            {"sms_notifications": False, "email_receipts": False, "marketing_updates": True},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertFalse(self.user.sms_notifications)
        self.assertFalse(self.user.email_receipts)
        self.assertTrue(self.user.marketing_updates)

