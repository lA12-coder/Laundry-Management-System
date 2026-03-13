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
import Layout from "./components/layout/Layout";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<Aboutus />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/item-list" element={<ItemListPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectRoute>
        }
      />
      <Route
        path="/checkout"
        element={
          <ProtectRoute>
            <Layout>
              <CheckoutPage />
            </Layout>
          </ProtectRoute>
        }
      />
    </Routes>
  );
}

export default App;
