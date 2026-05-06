import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Aboutus from "./pages/Aboutus";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ProtectRoute from "./components/common/ProtectedRoute";
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

function App() {
  return (
    <Routes>
      {/* ─── Admin Dashboard Routes ─────────────────────────────── */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<OrderManagementTable />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="riders" element={<RiderManagement />} />
        <Route path="partners" element={<PartnerManagement />} />
        <Route path="financials" element={<FinancialManagement />} />
      </Route>

      {/* ─── Customer-Facing Routes ─────────────────────────────── */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<Aboutus />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/item-list" element={<ItemListPage />} />
        <Route
          path="/dashboard"
          element={<ProtectRoute><Dashboard /></ProtectRoute>}
        />
        <Route
          path="/checkout"
          element={<ProtectRoute><CheckoutPage /></ProtectRoute>}
        />
      </Route>

      {/* ─── Auth Routes ────────────────────────────────────────── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify-email/:uid/:token" element={<VerifyEmailPage />} />
    </Routes>
  );
}

export default App;
