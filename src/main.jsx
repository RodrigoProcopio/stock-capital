// src/main.jsx
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
} from "react-router-dom";

import "./index.css";

// Páginas
import App from "./App.jsx";
import FormularioApi from "./pages/FormularioApi.jsx";
import Cartas from "./pages/Cartas.jsx";
import Relatorios from "./pages/Relatorios.jsx";
import Insights from "./pages/Insights.jsx";
import Compliance from "./pages/Compliance.jsx";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade.jsx";
import TermosUso from "./pages/TermosUso.jsx";
import SolicitacaoLGPD from "./pages/SolicitacaoLGPD.jsx";
import PoliticaRetencaoLGPD from "./pages/PoliticaRetencaoLGPD.jsx";

// Componente para rolar ao topo em cada navegação
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// Wrapper para injetar ScrollToTop
function WithScroll({ children }) {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
}

// Definição das rotas
const router = createBrowserRouter([
  { path: "/", element: <WithScroll><App /></WithScroll> }, // Landing
  { path: "/formulario-api", element: <WithScroll><FormularioApi /></WithScroll> },

  // Publicações
  { path: "/publicacoes/cartas", element: <WithScroll><Cartas /></WithScroll> },
  { path: "/publicacoes/relatorios", element: <WithScroll><Relatorios /></WithScroll> },
  { path: "/publicacoes/insights", element: <WithScroll><Insights /></WithScroll> },
  { path: "/publicacoes/compliance", element: <WithScroll><Compliance /></WithScroll> },

  // LGPD / Privacidade
  { path: "/privacidade", element: <WithScroll><PoliticaPrivacidade /></WithScroll> },
  { path: "/termos", element: <WithScroll><TermosUso /></WithScroll> },
  { path: "/lgpd", element: <WithScroll><SolicitacaoLGPD /></WithScroll> },
  { path: "/docs/politica-retencao-lgpd", element: <WithScroll><PoliticaRetencaoLGPD /></WithScroll> },

  // Catch-all → redireciona para Home
  { path: "*", element: <WithScroll><App /></WithScroll> },
]);

// Renderização
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
