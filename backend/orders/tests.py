from .services import calculate_order_price, assign_rider

# --- Pricing Service Tests ---
from django.test import TestCase

class PricingServiceTest(TestCase):
    def test_regular_price(self):
        items = [
            {'price': 20, 'quantity': 2},
            {'price': 10, 'quantity': 1},
        ]
        total = calculate_order_price(items, is_urgent=False)
        self.assertEqual(total, 50)

    def test_urgent_fee(self):
        items = [{'price': 10, 'quantity': 1}]
        total = calculate_order_price(items, is_urgent=True)
        self.assertEqual(total, 20)

# --- Assignment Logic Tests ---
class AssignmentLogicTest(TestCase):
    def setUp(self):
        self.rider1 = User.objects.create(email='rider1@example.com', username='rider1', role=User.Role.RIDER)
        self.rider2 = User.objects.create(email='rider2@example.com', username='rider2', role=User.Role.RIDER)

    def test_assign_first_rider(self):
        assigned = assign_rider(None, [self.rider1, self.rider2])
        self.assertEqual(assigned, self.rider1)

    def test_assign_none_if_no_riders(self):
        assigned = assign_rider(None, [])
        self.assertIsNone(assigned)
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from partners.models import LaundryPartner
from .models import AdminActionLog, Order


class AdminDashboardApiTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@fualaundry.com",
            password="pass1234",
            phone_number="08000000000",
            full_name="Admin User",
            role=User.Role.ADMIN,
            is_staff=True,
            is_verified=True,
        )
        self.customer = User.objects.create_user(
            username="customer",
            email="customer@fualaundry.com",
            password="pass1234",
            phone_number="08000000001",
            full_name="Customer User",
            role=User.Role.CUSTOMER,
            is_verified=True,
        )
        self.rider = User.objects.create_user(
            username="rider",
            email="rider@fualaundry.com",
            password="pass1234",
            phone_number="08000000002",
            full_name="Rider User",
            role=User.Role.RIDER,
            is_verified=True,
        )
        self.partner_owner = User.objects.create_user(
            username="partner",
            email="partner@fualaundry.com",
            password="pass1234",
            phone_number="08000000003",
            full_name="Partner User",
            role=User.Role.PARTNER,
            is_verified=True,
        )
        self.partner = LaundryPartner.objects.create(
            owner=self.partner_owner,
            business_name="Sparkle Laundry",
            capacity_per_day=100,
        )
        self.order = Order.objects.create(
            customer=self.customer,
            partner=self.partner,
            rider=self.rider,
            pickup_address="12 Fua Street",
            total_amount=10000,
            partner_earning=6000,
            rider_fee=2000,
            fualaundry_commission=2000,
        )

    def test_non_admin_cannot_access_dashboard_metrics(self):
        self.client.force_authenticate(self.customer)
        response = self.client.get(reverse("dashboard-metrics-list"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_override_status_creates_audit_log(self):
        self.client.force_authenticate(self.admin_user)
        response = self.client.post(
            reverse("admin-orders-override-status", kwargs={"pk": self.order.id}),
            data={"status": Order.Status.WASHING},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.WASHING)
        self.assertTrue(
            AdminActionLog.objects.filter(
                admin_user=self.admin_user,
                order=self.order,
                action=AdminActionLog.Action.OVERRIDE_STATUS,
            ).exists()
        )
