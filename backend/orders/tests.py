import uuid
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from partners.models import LaundryPartner
from orders.models import Order, PriceList, TransactionLog, ClothItem, AdminActionLog, ClothCategory

User = get_user_model()

class OrderE2ETest(APITestCase):
    def setUp(self):
        # 1. Setup Users
        self.admin_user = User.objects.create_user(
            username="admin_" + str(uuid.uuid4())[:8],
            email="admin_" + str(uuid.uuid4())[:8] + "@example.com",
            password="password123",
            role=User.Role.ADMIN,
            is_staff=True
        )
        self.customer_user = User.objects.create_user(
            username="customer_" + str(uuid.uuid4())[:8],
            email="customer_" + str(uuid.uuid4())[:8] + "@example.com",
            password="password123",
            role=User.Role.CUSTOMER
        )
        self.rider_user = User.objects.create_user(
            username="rider_" + str(uuid.uuid4())[:8],
            email="rider_" + str(uuid.uuid4())[:8] + "@example.com",
            password="password123",
            role=User.Role.RIDER,
            is_active=True
        )
        self.partner_user = User.objects.create_user(
            username="partner_" + str(uuid.uuid4())[:8],
            email="partner_" + str(uuid.uuid4())[:8] + "@example.com",
            password="password123",
            role=User.Role.PARTNER
        )
        
        # 2. Setup Partner
        self.partner = LaundryPartner.objects.create(
            owner=self.partner_user,
            business_name="Test Partner",
            capacity_per_day=50
        )
        
        # 3. Setup PriceList
        self.shirt_price = PriceList.objects.create(
            cloth_name="Shirt",
            size=PriceList.Size.MEDIUM,
            fua_price=Decimal("150.00"),
            partner_price=Decimal("100.00")
        )
        self.trouser_price = PriceList.objects.create(
            cloth_name="Trouser",
            size=PriceList.Size.SMALL,
            fua_price=Decimal("200.00"),
            partner_price=Decimal("140.00")
        )

    def test_full_order_lifecycle(self):
        """
        Tests the entire lifecycle: Creation -> Status Update -> Transaction Logging
        """
        # --- PHASE 1: ORDER CREATION ---
        self.client.force_authenticate(self.customer_user)
        order_data = {
            "customer_phone": "0712345678",
            "customer_name": "John Doe",
            "delivery_address": "123 Test Street",
            "urgency": Order.Urgency.REGULAR,
            "items": [
                {"price_list_entry_id": self.shirt_price.id, "quantity": 2},
                {"price_list_entry_id": self.trouser_price.id, "quantity": 1}
            ]
        }
    
        response = self.client.post(reverse("order-list"), order_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        order_id = response.data["id"]
        order = Order.objects.get(id=order_id)
        
        self.assertEqual(order.total_amount, Decimal("500.00"))
        self.assertEqual(order.base_price, Decimal("340.00"))
        self.assertEqual(order.cloth_items.count(), 2)
        
        # Verify snapshots
        shirt_item = order.cloth_items.get(cloth_name="Shirt")
        self.assertEqual(shirt_item.fua_price, Decimal("150.00"))
        self.assertEqual(shirt_item.partner_price, Decimal("100.00"))

        # --- PHASE 2: ADMIN STATUS OVERRIDE ---
        self.client.force_authenticate(self.admin_user)
        
        # Move to WASHING (should trigger TransactionLog)
        override_url = reverse("admin-order-management-override-status", kwargs={"pk": order_id})
        response = self.client.post(override_url, {"status": Order.Status.WASHING}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.WASHING)
        
        # Check TransactionLog
        transaction_log = TransactionLog.objects.get(order=order)
        self.assertEqual(transaction_log.fualaundry_commission, Decimal("110.00"))
        self.assertEqual(transaction_log.rider_fee, Decimal("50.00"))
        self.assertEqual(transaction_log.partner_earning, Decimal("340.00"))
        
        # Check Audit Log
        self.assertTrue(AdminActionLog.objects.filter(order=order, action=AdminActionLog.Action.OVERRIDE_STATUS).exists())

    def test_guest_order_creation(self):
        """
        Verify that creating an order with a new phone number creates a ghost account.
        """
        self.client.force_authenticate(self.rider_user) # Rider can also create orders
        new_phone = "0799999999"
        order_data = {
            "customer_phone": new_phone,
            "customer_name": "New Guest",
            "delivery_address": "Somewhere",
            "items": [{"price_list_entry_id": self.shirt_price.id, "quantity": 1}]
        }
        response = self.client.post(reverse("order-list"), order_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user creation
        self.assertTrue(User.objects.filter(phone_number=new_phone).exists())
        new_user = User.objects.get(phone_number=new_phone)
        self.assertEqual(new_user.role, User.Role.CUSTOMER)
        self.assertFalse(new_user.is_active) 

    def test_admin_dashboard_metrics(self):
        """
        Verify dashboard metrics aggregation.
        """
        # Create a few orders
        Order.objects.create(customer=self.customer_user, total_amount=1000, base_price=700, status=Order.Status.DELIVERED, delivery_address="A")
        Order.objects.create(customer=self.customer_user, total_amount=500, base_price=300, status=Order.Status.PENDING, delivery_address="B")
        
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("admin-dashboard-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(response.data["period"], "7d")
        self.assertIn("revenue_trend", response.data)
        self.assertIn("order_volume", response.data)
        self.assertIn("riders", response.data)
        self.assertIn("partners", response.data)

        metrics = response.data["metrics"]
        self.assertGreaterEqual(float(metrics["gross_revenue"]), 1500.0)
        self.assertGreaterEqual(float(metrics["platform_margin"]), 500.0)
        self.assertGreaterEqual(metrics["total_orders"], 2)

    def test_price_list_management(self):
        """
        Verify Admin CRUD on PriceList.
        """
        self.client.force_authenticate(self.admin_user)
        category, _ = ClothCategory.objects.get_or_create(
            slug="regular",
            defaults={"name": "Regular", "sort_order": 10},
        )
        # Create
        response = self.client.post(reverse("pricelist-list"), {
            "cloth_name": "Socks",
            "category": category.id,
            "size": "small",
            "fua_price": "50.00",
            "partner_price": "30.00"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Soft delete (deactivate)
        price_id = response.data["id"]
        response = self.client.delete(reverse("pricelist-detail", kwargs={"pk": price_id}))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        price_entry = PriceList.objects.get(id=price_id)
        self.assertFalse(price_entry.is_active)

    def test_financial_transactions_list(self):
        """
        Verify that admin can see transaction logs.
        """
        order = Order.objects.create(customer=self.customer_user, total_amount=1000, base_price=700, status=Order.Status.PENDING, delivery_address="A")
        TransactionLog.objects.create(order=order, partner_earning=700, fualaundry_commission=300)
        
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("admin-transactions-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        self.assertGreaterEqual(len(results), 1)

        summary = self.client.get(reverse("admin-transactions-summary"))
        self.assertEqual(summary.status_code, status.HTTP_200_OK)
        self.assertIn("gross_revenue", summary.data)

    def test_admin_action_logs_list(self):
        """
        Verify that admin can see audit logs.
        """
        order = Order.objects.create(customer=self.customer_user, total_amount=1000, base_price=700, delivery_address="A")
        AdminActionLog.objects.create(admin_user=self.admin_user, order=order, action=AdminActionLog.Action.OVERRIDE_STATUS)
        
        self.client.force_authenticate(self.admin_user)
        response = self.client.get(reverse("admin-audit-logs-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_reassign_rider(self):
        """
        Verify admin can reassign rider.
        """
        order = Order.objects.create(customer=self.customer_user, total_amount=1000, base_price=700, delivery_address="A")
        new_rider = User.objects.create_user(
            username="new_rider_" + str(uuid.uuid4())[:8], 
            email="new_rider_" + str(uuid.uuid4())[:8] + "@example.com", 
            password="password123", 
            role=User.Role.RIDER, 
            is_active=True
        )
        
        self.client.force_authenticate(self.admin_user)
        url = reverse("admin-order-management-reassign-rider", kwargs={"pk": order.id})
        response = self.client.post(url, {"rider": new_rider.id}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.rider, new_rider)
