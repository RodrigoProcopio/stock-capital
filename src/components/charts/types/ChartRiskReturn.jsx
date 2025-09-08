// src/components/charts/types/ChartRiskReturn.jsx
import React, { useEffect, useState } from "react";
import { readJson } from "../../../lib/cmsLoader.js";
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

const num = (v) => (Number(v) ?? 0).toFixed(2).replace(".", ",");

export default function ChartRiskReturn({ config }) {
  const [data, setData] = useState([]);

useEffect(() => {
  let alive = true;
  (async () => {
    try {
      const raw = readJson(String(config.source));
      const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.series) ? raw.series : [];
      if (alive) setData(rows);
    } catch (e) {
      console.error("ChartRiskReturn: falha ao carregar JSON", e);
    }
  })();
  return () => { alive = false; };
}, [config?.source]);

  const xKey = config.options?.x || "date";
  const y1 = config.options?.y1 || "sortino";
  const y2 = config.options?.y2 || "sharpe";

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
          <YAxis width={44} />
          <Tooltip
            formatter={(v, n) => [num(v), n]}
            labelFormatter={(l) => `Mês: ${l}`}
          />

          {/* Sortino */}
          <Line type="monotone" dataKey={y1} name="Sortino" stroke="#111827" strokeWidth={2.2} dot={false}>
            <LabelList
              dataKey={y1}
              position="right"
              content={({ x, y, value, index }) => {
                if (index !== data.length - 1 || value == null) return null;
                return (
                  <text x={x + 8} y={y + 4} fontSize={16} fontWeight={700} fill="#0b0b0b">
                    {num(value)} Sortino
                  </text>
                );
              }}
            />
          </Line>

          {/* Sharpe */}
          <Line
            type="monotone"
            dataKey={y2}
            name="Sharpe"
            stroke="#111827"
            strokeWidth={1.8}
            strokeDasharray="4 4"
            dot={false}
          >
            <LabelList
              dataKey={y2}
              position="right"
              content={({ x, y, value, index }) => {
                if (index !== data.length - 1 || value == null) return null;
                return (
                  <text x={x + 8} y={y + 4} fontSize={16} fontWeight={700} fill="#0b0b0b">
                    {num(value)} Sharpe
                  </text>
                );
              }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </figure>
  );
}
