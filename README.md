# Laundry Management System

![Project Status](https://img.shields.io/badge/status-active-success)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/backend-Django-092E20?logo=django&logoColor=white)
![API](https://img.shields.io/badge/API-Django%20REST%20Framework-ff1709?logo=django&logoColor=white)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![Styling](https://img.shields.io/badge/styling-Tailwind%20CSS-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

🚀 A modern web-based application designed to streamline laundry business operations, track orders, manage customers, and handle billing efficiently.


# 1) Header & Description

## Project Overview
The **Laundry Management System** provides a complete operational workflow for laundry businesses: customer management, order lifecycle tracking, service configuration, billing visibility, and administration from a central dashboard.

### Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Django, Django REST Framework
- **Database:** PostgreSQL
- **Auth:** JWT-based authentication
- **DevOps/Infra:** Docker (optional local orchestration), Redis (optional caching/queue support)

---

## 2) Core Features

✅ Customer registration and profile management.  
✅ Order creation, tracking (`Pending`, `Washing`, `Drying`, `Ready`, `Delivered`), and history.  
✅ Service and pricing management (e.g., wash & fold, dry cleaning, ironing).  
✅ Automated billing, invoicing, and payment status tracking.  
✅ Admin dashboard with real-time business metrics and daily revenue reports.  

---

## 3) System Architecture & Database Schema

![Mermain Diagram](./Images/Mermain-2.png)

### Mermaid Architecture Diagram
The diagram below illustrates the full-stack data flow: the React client communicates with the Django REST API, which handles JWT authentication, executes ORM queries against PostgreSQL, and delegates business logic to domain modules (Orders, Billing, Customers).

![Mermaid Diagram](./Images/mermaid-1.png)

## 4) Page-by-Page Documentation

### Login / Authentication Page
The authentication page allows users to securely sign in and access role-based workspaces (Admin, Customer, Rider, Partner). It validates credentials and initializes session tokens for protected API routes.

![Login Page](./Images/Login.png)

![SignUp Page](./Images/SignUp.png)

### Public Home Page (Hero & Call-to-Action)
The landing page introduces the FuaLaundry brand with a hero banner, service highlights, and primary CTAs for scheduling pickups and browsing services. Authenticated users see cart, notification, and profile controls in the header.

![Home Page](./Images/HeroImage.png)

### Items List & Cart (Order Catalog)
The Items List page displays the live pricing catalog pulled from the admin price matrix. Customers search and filter garments, adjust quantities, and add items to a persistent cart sidebar before proceeding to checkout.

![Order Page](./Images/OrderPage.png)

### Checkout & Delivery Scheduling
The checkout page collects delivery address details, pickup/delivery time slots, order urgency, and service notes. A live order summary sidebar shows subtotal, delivery fee, and total before the customer confirms placement.

![Checkout Page](./Images/CheckOutPage.png)

### Customer Order Tracking (Live Map)
The order tracking view shows a step-by-step lifecycle progress bar and an embedded Google Map with live rider location pins. Customers can monitor status transitions from Pending through Delivered and confirm receipt when delivery is complete.

![Order Tracking Page](./Images/OrderTracking.png)

### Admin Dashboard (Metrics, Quick Actions)
The Admin Dashboard presents high-level KPIs such as active orders, completed deliveries, and revenue trends in a single operational view. It also provides quick-access actions for navigating to order, customer, billing, and moderation modules.

![Admin Dashboard](./Images/AdminDashboard.png)

### Order Management Page (Order list, status toggles)
The Order Management page displays sortable and filterable order records with status transitions across the laundry lifecycle. Admins can review operational states, assign staff, and update processing progress in real time.

![Order Management](./Images/OrderManagement.png)

### Customer Directory (Profiles, loyalty points, contact info)
The Customer Directory centralizes customer profiles, contact details, and engagement indicators for support and retention workflows. Admin users can quickly search and inspect customer records for order follow-up and service quality handling.

![Customer Directory](./Images/CustomerDashboard.png)

### Services & Pricing Page (Add/edit laundry services)
This page allows administrators to define available laundry services and maintain pricing policies used during checkout. It supports operational updates for service offerings while preserving a consistent pricing matrix.

![Pricing Management](./Images/PricingManagement.png)

The expanded Price Matrix view lets admins edit FuaLaundry and partner share prices per SKU, upload item images, and review calculated margin percentages across Regular and Premium service tiers.

![Price Matrix Editor](./Images/PricemNagamet-2.png)

### Billing & Invoicing Page (Receipt generation view)
The Billing & Invoicing page tracks payable amounts, settlement states, and invoice-ready transaction entries. Teams can review customer charges and export or validate payment-related records for finance workflows.

![Financial Management Dashboard](./Images/FinancialManagement.png)

### Security Audit Workspace
The Audit Logs page records every administrative override with actor attribution, targeted order IDs, human-readable action labels, before/after state values, timestamps, and expandable JSON metadata payloads for forensic review.

![Audit Logging](./Images/AuditLoging.png)

### Rider Delivery Console
The Rider Portal provides a delivery queue of active jobs with pickup and delivery actions, customer contact unlock after assignment, and a route preview panel. Riders confirm pickups, mark deliveries, and stream live GPS coordinates to the tracking map.

![Rider Portal](./Images/RiderPortal.png)

### Partner Operations Workspace
The Laundry Partner Panel surfaces weekly and monthly revenue, paid vs outstanding settlement balances, assigned order status controls, and a shared paid/unpaid ledger so partners can track earnings awaiting platform settlement.

![Laundry House Order Management Portal](./Images/LaundryPortal.png)

---

## 5) Detailed Installation & Setup Steps

### Prerequisites
- Node.js **v18+**
- Python **3.11+** (or project-compatible version)
- PostgreSQL installed and running
- Git
- (Optional) Docker + Docker Compose

### Backend Setup
```bash
# 1) Clone repository
git clone <your-repo-url>
cd "FuaLaundry MAnagement System/backend"

# 2) Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
# .venv\Scripts\activate    # Windows PowerShell

# 3) Install dependencies
pip install -r requirements.txt

# 4) Create environment file
cp .env.example .env

# 5) Run migrations
python manage.py migrate

# 6) Create admin user
python manage.py createsuperuser

# 7) Start backend server
python manage.py runserver
```

### Frontend Setup
```bash
cd "../frontend"
npm install
cp .env.example .env
npm run dev
```

### Docker (recommended)

Full stack with PostgreSQL, Redis, API (Gunicorn), and nginx frontend.

```bash
# From repository root
cp backend/.env.example backend/.env   # edit secrets, DB password, email
cp frontend/.env.example frontend/.env # optional for local Vite; Docker uses build args
cp .env.example .env                   # optional port overrides

# Development — hot reload (Vite :5173, API :8000)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# Production-like — nginx :8080, Gunicorn API
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Create admin user (first time)
docker compose exec api python manage.py createsuperuser

# Health check
curl http://localhost:8000/api/health/
curl http://localhost:8080/            # production frontend
```

**Fedora / firewalld:** if email or outbound DNS fails inside Docker, add host-network override for the API:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml -f docker-compose.host-network.yml up -d api
```

**Render deployment:** `render.yaml` is included. Set `VITE_API_URL` to your Render API URL when building the static frontend.

### Standard Environment Variables (Placeholder)
```json
{
  "PORT": "8000",
  "DB_URL": "postgresql://username:password@localhost:5432/laundry_db",
  "JWT_SECRET": "replace_with_secure_secret",
  "EMAIL_BACKEND": "django.core.mail.backends.smtp.EmailBackend",
  "DEFAULT_FROM_EMAIL": "noreply@yourdomain.com",
  "VITE_API_URL": "http://localhost:8000/api",
  "VITE_GOOGLE_MAPS_API_KEY": "your_google_maps_key"
}
```

### Example Database Seed (SQL Placeholder)
```sql
INSERT INTO core_laundrylocation (hub_name, latitude, longitude, is_active)
VALUES ('Main Hub', 8.980603, 38.757759, TRUE);
```

### Sample Frontend API Usage (JavaScript Placeholder)
```javascript
async function fetchOrders() {
  const response = await fetch("http://localhost:8000/api/orders/", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  return response.json();
}
```

---

## 6) API Endpoint Brief

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/accounts/login/` | Authenticate user and issue JWT tokens | Yes (credentials) |
| `GET` | `/api/orders/` | Retrieve order list for authorized user role | Yes |
| `GET` | `/api/testimonials/public/` | Retrieve only approved testimonials for public site | No |
| `POST` | `/api/contact/submit/` | Submit contact message and forward by email | No |

---

## 7) Contributing & License

### Contributing
Contributions are welcome and appreciated.

1. Fork the repository  
2. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "feat: add your feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request with a clear description and test notes.

### License
This project is licensed under the **MIT License**.  
See the `LICENSE` file for details.
