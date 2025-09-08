// src/components/charts/types/ChartDesempenho.jsx
import React, { useEffect, useMemo, useState } from "react";
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

// 12.34 -> "12,34%"
const ptPct = (v) => `${(Number(v) ?? 0).toFixed(2).replace(".", ",")}%`;

/**
 * Constrói série acumulada a partir dos retornos mensais em %.
 * mode = "sum"  -> soma simples (1.00 + 2.00 = 3.00)
 * mode = "compound" (padrão) -> capitalização ( (1+1%)*(1+2%) - 1 )
 */
function buildAccumulated(arr = [], mode = "compound") {
  const sorted = [...arr].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (mode === "sum") {
    let acc = 0;
    return sorted.map(({ date, rendimento }) => {
      acc += Number(rendimento) || 0;
      return { date, rendimento: acc };
    });
  }

  // compound
  let accMul = 1;
  return sorted.map(({ date, rendimento }) => {
    const r = Number(rendimento) / 100;
    accMul *= 1 + (isFinite(r) ? r : 0);
    return { date, rendimento: (accMul - 1) * 100 };
  });
}

function styleFor(label, idx) {
  const name = String(label || "").toLowerCase();
  if (name.includes("ipca")) {
    return { stroke: "#0b0b0b", strokeWidth: 2.5, strokeDasharray: undefined };
  }
  const styles = [
    { stroke: "#111827", strokeWidth: 2.5, strokeDasharray: "6 4" }, // Portfólio
    { stroke: "#111827", strokeWidth: 2.0, strokeDasharray: "3 4" }, // Alpha¹
    { stroke: "#111827", strokeWidth: 2.0, strokeDasharray: "1 6" }, // IFHA²
  ];
  return styles[idx % styles.length];
}

export default function ChartDesempenho({ config }) {
  const [series, setSeries] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mode = (config.accumulation || "compound").toLowerCase(); // "sum" | "compound"
        const loaded = await Promise.all(
          (config.series || []).map(async (s) => {
            const mod = await import(/* @vite-ignore */ `${s.source}`);
            const raw = mod.default || mod;
            const rows = Array.isArray(raw) ? raw : Array.isArray(raw?.series) ? raw.series : [];
            const data = buildAccumulated(rows, mode);
            const label =
              s.label ||
              raw?.nome ||
              s.source?.split("/").pop()?.replace(".json", "") ||
              "Série";
            return { label, data, yKey: s.y || "rendimento" };
          })
        );
        const withData = loaded.filter((s) => s.data?.length);
        if (alive) setSeries(withData);
      } catch (e) {
        console.error("Erro carregando séries de desempenho:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [config]);

  // eixo X unificado
  const baseData = useMemo(() => {
    const set = new Set();
    series.forEach((s) => s.data?.forEach((p) => set.add(p.date)));
    return Array.from(set).sort().map((date) => ({ date }));
  }, [series]);

  if (!series.length) {
    return <div className="h-[460px] grid place-items-center">Carregando…</div>;
  }

  // domínio Y: até 16% por padrão; aumenta automaticamente se alguma série passar disso
  const maxY = Math.max(
    16,
    ...series.flatMap((s) => s.data.map((d) => Number(d.rendimento) || 0))
  );
  const top = Math.ceil(maxY / 4) * 4; // arredonda para múltiplo de 4
  const yTicks = Array.from({ length: Math.floor(top / 4) + 1 }, (_, i) => i * 4);

  // se o gráfico estiver em modo "sum", os dados já estão em %
  const isSum = (config.accumulation || "compound").toLowerCase() === "sum";

  return (
    <figure className="w-full">
      {config.title && (
        <figcaption className="text-center mb-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold">{config.title}</h2>
          {config.subtitle && <p className="text-black/60 mt-1">{config.subtitle}</p>}
        </figcaption>
      )}

      <ResponsiveContainer width="100%" height={460}>
        <LineChart data={baseData} margin={{ top: 12, right: 170, left: 48, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} tickMargin={8} />
          <YAxis
            ticks={yTicks}
            domain={[0, top]}
            tickFormatter={(v) => `${v}%`}
            width={44}
          />
          <Tooltip
            formatter={(v, name) => [ptPct(v), name]}
            labelFormatter={(l) => `Mês: ${l}`}
          />

          {series.map((s, idx) => {
            const sty = styleFor(s.label, idx);
            const yKey = s.yKey || "rendimento";
            return (
              <Line
                key={idx}
                type="monotone"
                data={s.data}
                dataKey={yKey}
                name={s.label}
                stroke={sty.stroke}
                strokeWidth={sty.strokeWidth}
                strokeDasharray={sty.strokeDasharray}
                dot={false}
              >
                {/* rótulo final, idêntico ao do arte */}
                <LabelList
                  dataKey={yKey}
                  position="right"
                  content={({ x, y, value, index }) => {
                    const isLast = index === (s.data?.length ?? 1) - 1;
                    if (!isLast || value == null) return null;
                    return (
                      <text x={x + 8} y={y + 4} fontSize={16} fontWeight={700} fill="#0b0b0b">
                        {ptPct(value)} {s.label}
                      </text>
                    );
                  }}
                />
              </Line>
            );
          })}
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
