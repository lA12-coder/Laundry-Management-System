import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext.js";
import api from "../services/api";

export const AuthProvider = ({ children }) => {
  // Auth provider component defines the auth context for other child components to use
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api
        .get("/users/me")
        .then((res) => setUser(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setTimeout(() => {
        setUser(null);
        setLoading(false);
      }, 0);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post("/users/login", { email, password });
      localStorage.setItem("token", res.data.access);
      setUser(res.data.user); // Only need this once
    } catch (error) {
      console.error("Login Failed", error);
    }
  };

  const register = async (data) => {
    try {
      await api.post("/users/register", data);
    } catch (error) {
      console.error("Registration Failed", error);
    }
  };

  
  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
