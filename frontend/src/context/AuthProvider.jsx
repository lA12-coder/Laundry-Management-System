import { useEffect } from "react";
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
import { useCustomerSessionStore } from "../stores/customerSessionStore";
import { startGhostSession } from "../services/ghostAccountApi";

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, loading, isAuthenticated, error } = useSelector((state) => state.auth);
  const setGhostUser = useCustomerSessionStore((state) => state.setGhostUser);

  const extractApiError = (apiError, fallbackMessage) => {
    const responseData = apiError?.response?.data;
    if (!responseData) return fallbackMessage;

    if (responseData.errors && typeof responseData.errors === "object") {
      const [firstField] = Object.keys(responseData.errors);
      const firstMessage = responseData.errors[firstField]?.[0];
      if (firstMessage) return `${firstField}: ${firstMessage}`;
    }

    return responseData.message || fallbackMessage;
  };

  const logoutUser = async () => {
    const refresh = localStorage.getItem("refreshToken");
    if (refresh) {
      try {
        await api.post("/accounts/logout/", { refresh });
      } catch {
        // Logout should still clear local session if server-side blacklisting fails.
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        dispatch(logout());
        dispatch(setLoading(false));
        return;
      }
    }
    dispatch(logout());
    dispatch(setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(loginStart());
      api
        .get("/accounts/me/")
        .then((res) => {
          dispatch(loginSuccess({ user: res.data?.data, token }));
        })
        .catch(() => {
          dispatch(logout());
        });
    } else {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    setGhostUser(Boolean(user) && user.is_active === false);
  }, [user, setGhostUser]);

  const login = async (email, password) => {
    dispatch(loginStart());
    try {
      const res = await api.post("/accounts/login/", { email, password });
      const payload = res.data?.data || {};
      dispatch(
        loginSuccess({
          user: payload.user,
          token: payload.access,
          refreshToken: payload.refresh,
        }),
      );
      return payload.user;
    } catch (error) {
      dispatch(loginFailure(extractApiError(error, "Login Failed")));
      throw error;
    }
  };

  const register = async (data) => {
    dispatch(loginStart());
    try {
      const payload = {
        username: data.email?.split("@")[0] || data.full_name?.replace(/\s+/g, "_"),
        full_name: data.full_name,
        email: data.email,
        phone_number: data.phone_number,
        password: data.password,
      };
      await api.post("/accounts/register/", payload);
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(loginFailure(extractApiError(error, "Registration Failed")));
      throw error;
    }
  };

  const googleLogin = async () => {
    dispatch(loginStart());
    dispatch(loginFailure("Google login is not available yet."));
    throw new Error("Google login endpoint is not implemented on backend.");
  };

  const verifyEmail = async (uid, token) => {
    return api.get(`/accounts/verify-email/${uid}/${token}/`);
  };

  const resendVerificationEmail = async (email) => {
    return api.post("/accounts/resend-verification-email/", { email });
  };

  const ghostSession = async (phone_number) => {
    dispatch(loginStart());
    try {
      const payload = await startGhostSession(phone_number);
      dispatch(
        loginSuccess({
          user: payload.user,
          token: payload.access,
          refreshToken: payload.refresh,
        }),
      );
      return payload.user;
    } catch (error) {
      dispatch(loginFailure(extractApiError(error, "Guest session failed")));
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
        verifyEmail,
        resendVerificationEmail,
        ghostSession,
        loading,
        isAuthenticated,
        error,
      }}
    >
      {loading ? <LaundryLoader /> : children}
    </AuthContext.Provider>
  );
};
