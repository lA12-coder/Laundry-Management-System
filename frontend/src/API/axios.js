import axios from "axios";
import { store } from "../redux/store";
import { logout, loginSuccess } from "../redux/userSlice";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
});

function isFormDataBody(data) {
  return typeof FormData !== "undefined" && data instanceof FormData;
}

function clearContentTypeHeader(headers) {
  if (!headers) return;
  if (typeof headers.delete === "function") {
    headers.delete("Content-Type");
    headers.delete("content-type");
    return;
  }
  delete headers["Content-Type"];
  delete headers["content-type"];
}

function setJsonContentType(headers) {
  if (!headers) return;
  if (typeof headers.set === "function") {
    headers.set("Content-Type", "application/json");
    return;
  }
  headers["Content-Type"] = "application/json";
}

api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (isFormDataBody(config.data)) {
      clearContentTypeHeader(config.headers);
    } else if (
      config.data &&
      typeof config.data === "object" &&
      !(config.data instanceof URLSearchParams)
    ) {
      setJsonContentType(config.headers);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshRoute = originalRequest?.url?.includes("/accounts/refresh/");

    if (!isUnauthorized || originalRequest?._retry || isRefreshRoute) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken =
      store.getState().auth.refreshToken || localStorage.getItem("refreshToken");

    if (!refreshToken) {
      store.dispatch(logout());
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await api.post("/accounts/refresh/", {
        refresh: refreshToken,
      });
      const nextAccessToken = refreshResponse.data?.data?.access;
      if (!nextAccessToken) {
        throw new Error("No access token in refresh response");
      }

      const authState = store.getState().auth;
      store.dispatch(
        loginSuccess({
          user: authState.user,
          token: nextAccessToken,
          refreshToken,
        }),
      );

      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      store.dispatch(logout());
      return Promise.reject(refreshError);
    }
  },
);

export default api;