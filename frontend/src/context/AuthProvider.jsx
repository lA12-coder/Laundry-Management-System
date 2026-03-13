import { useEffect, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AuthContext } from "./AuthContext.js";
import api from "../API/axios.js";
import LaundryLoader from "../components/common/LaundryLoader";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setLoading,
} from "../redux/userSlice";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, loading, isAuthenticated, error } = useSelector((state) => state.auth);

  const logoutUser = () => {
    dispatch(logout());
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(loginStart());
      api
        .get("/users/me")
        .then((res) => {
          dispatch(loginSuccess({ user: res.data, token }));
        })
        .catch(() => {
          dispatch(logout());
        });
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const login = async (email, password) => {
    dispatch(loginStart());
    try {
      const res = await api.post("/auth/login", { email, password });
      dispatch(
        loginSuccess({
          user: res.data.user,
          token: res.data.access || res.data.token,
        }),
      );
    } catch (error) {
      dispatch(loginFailure(error.response?.data?.message || "Login Failed"));
      throw error;
    }
  };

  const register = async (data) => {
    dispatch(loginStart());
    try {
      const res = await api.post("/auth/signup", data);
      dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
    } catch (error) {
      dispatch(
        loginFailure(error.response?.data?.message || "Registration Failed"),
      );
      throw error;
    }
  };

  const googleLogin = async (credential) => {
    dispatch(loginStart());
    try {
      const res = await api.post("/auth/google", { token: credential });
      dispatch(loginSuccess({ user: res.data.user, token: res.data.token }));
    } catch (error) {
      dispatch(loginFailure("Google Auth Failed"));
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        googleLogin,
        logout: logoutUser,
        loading,
        isAuthenticated,
        error,
      }}
    >
      {loading ? <LaundryLoader /> : children}
    </AuthContext.Provider>
  );
};
