// src/components/charts/types/ChartVolatility.jsx
import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";

const ptPct = (v) => `${(Number(v) ?? 0).toFixed(2).replace(".", ",")}%`;

export default function ChartVolatility({ config }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const mod = await import(/* @vite-ignore */ `${config.source}`);
      const raw = mod.default || mod;
      const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.series) ? raw.series : [];
      if (alive) setData(rows);
    })().catch((e) => console.error(e));
  return () => { alive = false; };
  }, [config]);

  const xKey = config.options?.x || "date";
  const yKey = config.options?.y || "vol";

  return (
    <figure className="w-full">
      <figcaption className="text-center mb-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold">{config.title}</h2>
        {config.subtitle && <p className="text-black/60 mt-1">{config.subtitle}</p>}
      </figcaption>

      <ResponsiveContainer width="100%" height={420}>
        <LineChart data={data} margin={{ top: 12, right: 170, left: 48, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tickMargin={8} />
          <YAxis tickFormatter={ptPct} width={48} />
          <Tooltip formatter={(v) => ptPct(v)} labelFormatter={(l) => `Mês: ${l}`} />

          <Line type="monotone" dataKey={yKey} name="Volatilidade" stroke="#111827" strokeWidth={2.2} dot={false}>
            {/* rótulo somente no último ponto – mesmo estilo do consolidado */}
            <LabelList
              dataKey={yKey}
              position="right"
              content={({ x, y, value, index }) => {
                if (index !== data.length - 1 || value == null) return null;
                return (
                  <text x={x + 8} y={y + 4} fontSize={16} fontWeight={700} fill="#0b0b0b">
                    {ptPct(value)} LTM³
                  </text>
                );
              }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>

      {config.notes && (
        <figcaption className="text-black/60 text-sm mt-3 text-center">
          {config.notes}
        </figcaption>
      )}
    </figure>
  );
}
