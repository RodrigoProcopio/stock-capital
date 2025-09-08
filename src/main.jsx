// src/main.jsx
import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  useLocation,
} from "react-router-dom";

import "./index.css";

// Novas páginas LGPD/Privacidade

// Utilitário: sobe a página ao navegar
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

// Wrapper para aplicar ScrollToTop em cada rota
function WithScroll({ children }) {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
}

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
  // Opcional: catch-all de volta pra Home
  { path: "*", element: <WithScroll><App /></WithScroll> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
