import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { App } from "./App";
import { ScrollToTop } from "./components/ui/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { LocaleProvider } from "./context/LocaleContext";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The Sahaaya root element could not be found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <AuthProvider>
          <ScrollToTop />
          <App />
        </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
);
