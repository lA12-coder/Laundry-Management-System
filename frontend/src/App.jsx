import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Aboutus from "./pages/Aboutus";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ProtectedRoute from "./components/routing/ProtectedRoute";
import ContactUs from "./pages/ContactUs";
import ServicesPage from "./pages/ServicePage";
import ItemListPage from "./pages/ItemList";
import CheckoutPage from "./pages/CheckoutPage";
import VerifyEmailPage from "./pages/VerifyEmail";
import Layout from "./components/layout/Layout";
import "./App.css";
import AdminLayout from "./components/admin/AdminLayout";
import OrderManagementTable from "./components/admin/OrderManagementTable";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PartnerManagement from "./pages/admin/PartnerManagement";
import FinancialManagement from "./pages/admin/FinancialManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import RiderManagement from "./pages/admin/RiderManagement";
import PricingWorkspace from "./pages/admin/PricingWorkspace";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSubscriptionReview from "./pages/admin/AdminSubscriptionReview";
import AdminTestimonials from "./pages/admin/AdminTestimonials";
import UserManagement from "./pages/admin/UserManagement";
import ProfileSettings from "./pages/customer/ProfileSettings.tsx";
import ClaimAccountPage from "./pages/customer/ClaimAccountPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import RiderLayout from "./components/rider/RiderLayout";
import RiderQueue from "./pages/rider/RiderQueue";
import RiderSettings from "./pages/rider/RiderSettings";
import PartnerLayout from "./components/partner/PartnerLayout";
import PartnerPanel from "./pages/partner/PartnerPanel";
import { AccessLevel } from "./constants/roles";

const ADMIN_LEVELS = [
  AccessLevel.SUPERADMIN,
  AccessLevel.ADMIN,
  AccessLevel.STAFF,
];

const ADMIN_WRITE_LEVELS = [AccessLevel.SUPERADMIN, AccessLevel.ADMIN];
const MANAGER_LEVELS = [AccessLevel.SUPERADMIN, AccessLevel.ADMIN];

function App() {
  return (
    <Routes>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* ─── Internal operations (admin hierarchy) ─────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={ADMIN_LEVELS}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route
          path="orders"
          element={
            <ProtectedRoute allowedRoles={ADMIN_LEVELS}>
              <OrderManagementTable />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={ADMIN_WRITE_LEVELS}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="customers"
          element={
            <ProtectedRoute allowedRoles={ADMIN_LEVELS}>
              <CustomerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="riders"
          element={
            <ProtectedRoute allowedRoles={ADMIN_WRITE_LEVELS}>
              <RiderManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="partners"
          element={
            <ProtectedRoute allowedRoles={MANAGER_LEVELS}>
              <PartnerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="financials"
          element={
            <ProtectedRoute allowedRoles={MANAGER_LEVELS}>
              <FinancialManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="subscriptions"
          element={
            <ProtectedRoute allowedRoles={ADMIN_LEVELS}>
              <AdminSubscriptionReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="testimonials"
          element={
            <ProtectedRoute allowedRoles={ADMIN_LEVELS}>
              <AdminTestimonials />
            </ProtectedRoute>
          }
        />
        <Route
          path="pricing"
          element={
            <ProtectedRoute allowedRoles={ADMIN_LEVELS}>
              <PricingWorkspace />
            </ProtectedRoute>
          }
        />
        <Route
          path="settings"
          element={
            <ProtectedRoute allowedRoles={ADMIN_LEVELS}>
              <AdminSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="logs"
          element={
            <ProtectedRoute allowedRoles={MANAGER_LEVELS}>
              <AdminAuditLogs />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ─── Rider — isolated delivery queue ───────────────────── */}
      <Route
        path="/rider"
        element={
          <ProtectedRoute allowedRoles={[AccessLevel.RIDER]}>
            <RiderLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RiderQueue />} />
        <Route path="settings" element={<RiderSettings />} />
      </Route>

      {/* ─── Partner panel ──────────────────────────────────────── */}
      <Route
        path="/partner"
        element={
          <ProtectedRoute allowedRoles={[AccessLevel.PARTNER]}>
            <PartnerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PartnerPanel />} />
      </Route>

      {/* ─── Customer-facing site ──────────────────────────────── */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<Aboutus />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/item-list" element={<ItemListPage />} />
        <Route path="/items-list" element={<Navigate to="/item-list" replace />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={[AccessLevel.CUSTOMER]} allowGhost>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={[AccessLevel.CUSTOMER]} allowGhost>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="/claim-account" element={<ClaimAccountPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={[AccessLevel.CUSTOMER]}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ─── Auth ──────────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
    </Routes>
  );
}

export default App;
