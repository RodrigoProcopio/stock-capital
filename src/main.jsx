import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import FormularioApi from "./pages/FormularioApi.jsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/formulario-api", element: <FormularioApi /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);