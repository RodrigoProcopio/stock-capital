import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";

import "./index.css";
import App from "./App.jsx";
import FormularioApi from "./pages/FormularioApi.jsx";
import Cartas from "./pages/Cartas.jsx";
import Relatorios from "./pages/Relatorios.jsx";
import Insights from "./pages/Insights.jsx";
import Compliance from "./pages/Compliance.jsx";

// Componente utilitário: sobe a página ao navegar
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

const router = createBrowserRouter([
  { path: "/", element: <App /> }, // Landing
  { path: "/formulario-api", element: <FormularioApi /> },

  // Publicações
  { path: "/publicacoes/cartas", element: <Cartas /> },
  { path: "/publicacoes/relatorios", element: <Relatorios /> },
  { path: "/publicacoes/insights", element: <Insights /> },
  { path: "/publicacoes/compliance", element: <Compliance /> },

  // Opcional: catch-all de volta pra Home
  { path: "*", element: <App /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router}>
      <ScrollToTop />
    </RouterProvider>
  </StrictMode>
);
