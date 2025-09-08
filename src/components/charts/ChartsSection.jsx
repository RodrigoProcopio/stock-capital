// src/components/charts/ChartsSection.jsx
import { useEffect, useState } from "react";
import { readJson } from "../../lib/cmsLoader.js";
import INDEX from "/src/content/rentabilidade/charts/index.json"; // caminho estático => entra no bundle

export default function ChartsSection() {
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    try {
      // INDEX é um array de caminhos (strings) para os JSONs de gráficos
      const entries = (INDEX && Array.isArray(INDEX) ? INDEX : []).map(String);
      const configs = entries
        .map((p) => readJson(p))
        .filter((c) => c && c.enabled !== false);
      setCharts(configs);
    } catch (err) {
      console.error("Erro carregando charts:", err);
    }
  }, []);

  if (!charts.length) return null;
  return (
    <div className="w-full">
      <ChartsCarousel charts={charts} />
    </div>
  );
}
