import React from "react";
import ReactDOM from "react-dom/client";
import SchoolPortal from "./SchoolPortal.jsx";
import { AuthProvider } from "./AuthProvider.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <SchoolPortal />
    </AuthProvider>
  </React.StrictMode>
);
