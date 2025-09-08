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
import { readJson } from "../../../lib/cmsLoader.js";

const num = (v) => (Number(v) ?? 0).toFixed(2).replace(".", ",");

export default function ChartVolatility({ config }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    try {
      const raw = readJson(String(config.source));
      const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.series) ? raw.series : [];
      setData(rows);
    } catch (e) {
      console.error("ChartVolatility: falha ao carregar JSON", e);
      setData([]);
    }
  }, [config?.source]);

  const title = config.title || "Volatilidade (últimos 12 meses)";
  const subtitle = config.subtitle || "";
  const xKey = config.options?.x || "date";
  const yKey = config.options?.y || "vol";
  const lineName = config.options?.label || "Volatilidade";

  return (
    <figure className="w-full">
      {(title || subtitle) && (
        <header className="mb-3 text-center">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {subtitle && <p className="text-sm text-black/60">{subtitle}</p>}
        </header>
      )}

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 6, right: 96, bottom: 0, left: 6 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis width={44} />
          <Tooltip
            formatter={(v, n) => [`${num(v)}%`, n]}
            labelFormatter={(l) => `Mês: ${l}`}
          />
          <Line type="monotone" dataKey={yKey} name={lineName} stroke="#111827" strokeWidth={2.2} dot={false}>
<LabelList
  dataKey={yKey}
  position="right"
  content={({ x, y, value, index }) => {
    if (index !== data.length - 1 || value == null) return null;
    return (
      <text x={x + 8} y={y + 4} fontSize={16} fontWeight={700} fill="#0b0b0b">
        {num(value)}% LTM³
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
