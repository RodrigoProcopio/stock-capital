// src/components/DesempenhoChart.jsx
import { useMemo } from "react";
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

import c1 from "../content/rentabilidade/carteiras/carteira1.json";
import c2 from "../content/rentabilidade/carteiras/carteira2.json";
import c3 from "../content/rentabilidade/carteiras/carteira3.json";
import c4 from "../content/rentabilidade/carteiras/carteira4.json";
import c5 from "../content/rentabilidade/carteiras/carteira5.json";
import dash from "../content/rentabilidade/dashboard.json";

import {
  prepararSerieAcumulada,
  unirDatas,
  alinharPorDatas,
  montarDataset,
} from "../lib/rentabilidade";

const SITE_BG = "#f6f7f9";

// variações monocromáticas
const LINE_STYLES = {
  carteira1: { stroke: "#000000", strokeWidth: 3.0, strokeDasharray: "" },
  carteira2: { stroke: "#111111", strokeWidth: 2.6, strokeDasharray: "6 3" },
  carteira3: { stroke: "#222222", strokeWidth: 2.2, strokeDasharray: "2 4" },
  carteira4: { stroke: "#333333", strokeWidth: 2.0, strokeDasharray: "3 3" },
  carteira5: { stroke: "#555555", strokeWidth: 1.8, strokeDasharray: "8 4 2 4" },
};

// 12.3456 -> "12,35%"
const fmtPct = (v) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(Number(v ?? 0)) + "%";

export default function DesempenhoChart() {
  // séries acumuladas
  const s1 = useMemo(() => prepararSerieAcumulada(c1), []);
  const s2 = useMemo(() => prepararSerieAcumulada(c2), []);
  const s3 = useMemo(() => prepararSerieAcumulada(c3), []);
  const s4 = useMemo(() => prepararSerieAcumulada(c4), []);
  const s5 = useMemo(() => prepararSerieAcumulada(c5), []);

  // eixo e alinhamento
  const datas = useMemo(() => unirDatas(s1, s2, s3, s4, s5), [s1, s2, s3, s4, s5]);
  const a1 = useMemo(() => alinharPorDatas(datas, s1), [datas, s1]);
  const a2 = useMemo(() => alinharPorDatas(datas, s2), [datas, s2]);
  const a3 = useMemo(() => alinharPorDatas(datas, s3), [datas, s3]);
  const a4 = useMemo(() => alinharPorDatas(datas, s4), [datas, s4]);
  const a5 = useMemo(() => alinharPorDatas(datas, s5), [datas, s5]);

  const data = useMemo(() => montarDataset(datas, a1, a2, a3, a4, a5), [datas, a1, a2, a3, a4, a5]);

  const exibir = dash.exibir || {};

  // renderer que desenha label apenas no último ponto
  const endLabel =
    (serieKey, nome) =>
    ({ x, y, value, index }) => {
      if (index !== data.length - 1 || value == null) return null;
      return (
        <text
          x={x + 10}                      // desloca para a direita
          y={y}
          fill="#000"
          fontSize="var(--fs-sm)"
          fontWeight="600"
          alignmentBaseline="middle"
        >
          {`${fmtPct(value)} ${nome}`}
        </text>
      );
    };

  return (
    <div className="w-full rounded-2xl p-6" style={{ background: SITE_BG }}>
      {/* títulos centralizados */}
      <h2 className="text-black text-3xl font-semibold text-center">Desempenho Consolidado | Multi-Family Office</h2>
      <p className="text-black/70 text-base mt-1 text-center">Retorno acumulado</p>

      <div style={{ width: "100%", height: 420 }} className="mt-4">
        <ResponsiveContainer>
          {/* aumenta a margem direita para caber os rótulos */}
          <LineChart data={data} margin={{ top: 24, right: 128, left: 0, bottom: 16 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.1)" vertical={false} />
            <XAxis dataKey="date" stroke="#000" tick={{ fontSize: "var(--fs-sm)", fill: "#000" }} />
            <YAxis
              stroke="#000"
              tick={{ fontSize: "var(--fs-sm)", fill: "#000" }}
              tickFormatter={(v) => (v == null ? "" : `${v.toFixed(0)}%`)}
            />
            <Tooltip
              contentStyle={{
                background: SITE_BG,
                border: "1px solid #000",
                color: "#000",
                fontSize: "var(--fs-base)",
              }}
              formatter={(v, n) =>
                v == null ? ["—", n] : [`${Number(v).toFixed(2)}%`, n]
              }
              labelFormatter={(l) => `Mês: ${l}`}
            />

            {/* Linhas com LabelList customizado (somente no último ponto) */}
            {exibir.carteira1 && (
              <Line type="monotone" dataKey="carteira1" name={c1.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira1}>
                <LabelList dataKey="carteira1" content={endLabel("carteira1", c1.nome || "Carteira 1")} />
              </Line>
            )}
            {exibir.carteira2 && (
              <Line type="monotone" dataKey="carteira2" name={c2.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira2}>
                <LabelList dataKey="carteira2" content={endLabel("carteira2", c2.nome || "Carteira 2")} />
              </Line>
            )}
            {exibir.carteira3 && (
              <Line type="monotone" dataKey="carteira3" name={c3.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira3}>
                <LabelList dataKey="carteira3" content={endLabel("carteira3", c3.nome || "Carteira 3")} />
              </Line>
            )}
            {exibir.carteira4 && (
              <Line type="monotone" dataKey="carteira4" name={c4.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira4}>
                <LabelList dataKey="carteira4" content={endLabel("carteira4", c4.nome || "Carteira 4")} />
              </Line>
            )}
            {exibir.carteira5 && (
              <Line type="monotone" dataKey="carteira5" name={c5.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira5}>
                <LabelList dataKey="carteira5" content={endLabel("carteira5", c5.nome || "Carteira 5")} />
              </Line>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-black/60 text-sm mt-4 text-center">
        Dados atualizados mensalmente. Cada linha representa o acumulado de rendimentos mensais.
      </p>
    </div>
  );
}
