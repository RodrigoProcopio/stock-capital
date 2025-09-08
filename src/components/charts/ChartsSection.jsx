// src/components/charts/ChartsSection.jsx
import React, { useEffect, useState } from "react";
import ChartsCarousel from "./ChartsCarousel.jsx";

export default function ChartsSection() {
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // carrega lista de arquivos de configuração
        const indexMod = await import("/src/content/rentabilidade/charts/index.json");
        const entries = indexMod.default || indexMod;

        // importa os JSONs de cada chart
        const configs = await Promise.all(
          entries.map(async (p) => {
            const m = await import(/* @vite-ignore */ `${p}`);
            return m.default || m;
          })
        );

        if (alive) setCharts(configs.filter((c) => c && c.enabled !== false));
      } catch (err) {
        console.error("Erro carregando charts:", err);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!charts.length) return null;

  return (
    <div className="w-full">
      <ChartsCarousel charts={charts} />
    </div>
  );
}
