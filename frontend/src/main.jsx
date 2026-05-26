import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { AuthProvider } from "./context/AuthProvider";
import App from "./App.jsx";
import { store } from "./redux/store.js";
import "./index.css";
import { ensurePublicLightMode } from "./stores/useThemeStore";
import ScrollToTop from "./components/common/ScrollToTop";
import ThemeRouteGuard from "./components/common/ThemeRouteGuard";

ensurePublicLightMode();

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <ThemeRouteGuard />
        <Provider store={store}>
          <AuthProvider>
            <App />
            <Toaster position="top-right" />
          </AuthProvider>
        </Provider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
