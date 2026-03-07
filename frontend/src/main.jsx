import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import App from "./App.jsx";
import { Provider} from "react-redux";
import { store } from "./redux/store.js";
import "./index.css";
import ScrollToTop from "./components/common/ScrollToTop";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop/>
      <AuthProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
