// src/components/charts/ChartRenderer.jsx

export default function ChartRenderer({ config }) {
  if (!config || !config.type) {
    return <div className="p-6 text-center text-sm text-black/60">Config inválida (type ausente).</div>;
  }

  switch (config.type) {
    case "desempenho":
      return <ChartDesempenho config={config} />;

    case "volatilidade":
      return <ChartVolatility config={config} />;

    case "risco-retorno":
      return <ChartRiskReturn config={config} />;

    default:
      return (
        <div className="p-6 text-center text-sm text-black/60">
          Tipo de gráfico desconhecido: <code>{String(config.type)}</code>
        </div>
      );
  }
}
