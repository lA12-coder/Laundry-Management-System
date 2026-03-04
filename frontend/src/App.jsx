import { Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Aboutus from "./pages/Aboutus";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectRoute from "./components/common/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<Aboutus/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectRoute>
              <Dashboard />
            </ProtectRoute>
          }
        />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
