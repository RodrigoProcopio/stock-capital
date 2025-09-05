// src/components/DesempenhoChart.jsx
import { useMemo, useId } from "react";
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

const SITE_BG = "#f6f7f9";

// variações monocromáticas (mantido)
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

// util p/ achar último valor não-nulo
const lastNonNull = (arr, key) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    const v = arr[i]?.[key];
    if (v !== null && v !== undefined) return v;
  }
  return null;
};

// -------- Helpers (independentes do lib) --------

// normaliza número (1.57, "1,57", "-0.9", "1.57%")
function toNum(v) {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace("%", "").replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// recebe {series: [{date:"YYYY-MM", rendimento:<%>}, ...]}
// retorna [{date, value}] onde value é acumulado por soma simples
function serieSomaSimples(carteira) {
  const items = Array.isArray(carteira?.series) ? [...carteira.series] : [];
  items.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  let soma = 0;
  const out = [];
  for (const row of items) {
    const r = toNum(row?.rendimento);
    if (!Number.isFinite(r)) continue;
    soma += r;
    out.push({ date: String(row.date), value: soma });
  }
  return out;
}

// união ordenada de datas de N séries [{date,value}]
function unirDatas(...series) {
  const set = new Set();
  for (const s of series) for (const p of s || []) set.add(p.date);
  return Array.from(set).sort();
}

// índice rápido de {date -> value}
function indexar(serie) {
  const m = new Map();
  for (const p of serie) m.set(p.date, Number(p.value) || 0);
  return m;
}

// monta o dataset final [{date, carteira1, carteira2, ...}]
function montarDatasetFinal(datas, sMap) {
  // sMap: {carteira1: Map(date->value), ...}
  return datas.map((d) => ({
    date: d,
    carteira1: sMap.carteira1?.get(d) ?? null,
    carteira2: sMap.carteira2?.get(d) ?? null,
    carteira3: sMap.carteira3?.get(d) ?? null,
    carteira4: sMap.carteira4?.get(d) ?? null,
    carteira5: sMap.carteira5?.get(d) ?? null,
  }));
}

export default function DesempenhoChart() {
  const captionId = useId();
  const exibir = dash?.exibir || {};

  // 1) séries por SOMA SIMPLES diretamente do JSON
  const s1 = useMemo(() => serieSomaSimples(c1), []);
  const s2 = useMemo(() => serieSomaSimples(c2), []);
  const s3 = useMemo(() => serieSomaSimples(c3), []);
  const s4 = useMemo(() => serieSomaSimples(c4), []);
  const s5 = useMemo(() => serieSomaSimples(c5), []);

  // 2) eixo X
  const datas = useMemo(() => unirDatas(s1, s2, s3, s4, s5), [s1, s2, s3, s4, s5]);

  // 3) dataset final para o Recharts
  const data = useMemo(() => {
    const sMap = {
      carteira1: indexar(s1),
      carteira2: indexar(s2),
      carteira3: indexar(s3),
      carteira4: indexar(s4),
      carteira5: indexar(s5),
    };
    return montarDatasetFinal(datas, sMap);
  }, [datas, s1, s2, s3, s4, s5]);

  // 4) séries ativas (só se há dados)
  const series = useMemo(() => {
    const arr = [];
    if (exibir.carteira1 && s1.length) arr.push({ key: "carteira1", name: c1.nome || "Carteira 1" });
    if (exibir.carteira2 && s2.length) arr.push({ key: "carteira2", name: c2.nome || "Carteira 2" });
    if (exibir.carteira3 && s3.length) arr.push({ key: "carteira3", name: c3.nome || "Carteira 3" });
    if (exibir.carteira4 && s4.length) arr.push({ key: "carteira4", name: c4.nome || "Carteira 4" });
    if (exibir.carteira5 && s5.length) arr.push({ key: "carteira5", name: c5.nome || "Carteira 5" });
    return arr;
  }, [exibir, s1.length, s2.length, s3.length, s4.length, s5.length]);

  // 5) resumo dos últimos valores
  const latestSummary = useMemo(() => {
    const out = [];
    for (const s of series) {
      const v = lastNonNull(data, s.key);
      if (v !== null) out.push(`${s.name}: ${fmtPct(v)}`);
    }
    return out;
  }, [series, data]);

  // label só no último ponto
  const endLabel =
    (serieKey, nome) =>
    ({ x, y, value, index }) => {
      if (index !== data.length - 1 || value == null) return null;
      return (
        <text
          x={x + 10}
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

  const tableRows = useMemo(() => data.slice(-12), [data]); // últimos 12 meses

  return (
    <div className="w-full rounded-2xl p-6" style={{ background: SITE_BG }}>
      {/* títulos centralizados (mantidos) */}
      <h2 className="text-black text-3xl font-semibold text-center">
        Desempenho Consolidado | Multi-Family Office
      </h2>

      {/* A11y: figure + figcaption + tabela fallback */}
      <figure
        aria-label="Gráfico de linhas com o retorno acumulado das carteiras ao longo do tempo"
        aria-describedby={captionId}
        className="mt-4"
      >
        <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer>
            {/* aumenta a margem direita para caber os rótulos */}
            <LineChart data={data} margin={{ top: 24, right: 140, left: 0, bottom: 16 }}>
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
                formatter={(v, n) => (v == null ? ["—", n] : [`${Number(v).toFixed(2)}%`, n])}
                labelFormatter={(l) => `Mês: ${l}`}
              />

              {exibir.carteira1 && s1.length > 0 && (
                <Line type="monotone" dataKey="carteira1" name={c1.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira1}>
                  <LabelList dataKey="carteira1" content={endLabel("carteira1", c1.nome || "Carteira 1")} />
                </Line>
              )}
              {exibir.carteira2 && s2.length > 0 && (
                <Line type="monotone" dataKey="carteira2" name={c2.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira2}>
                  <LabelList dataKey="carteira2" content={endLabel("carteira2", c2.nome || "Carteira 2")} />
                </Line>
              )}
              {exibir.carteira3 && s3.length > 0 && (
                <Line type="monotone" dataKey="carteira3" name={c3.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira3}>
                  <LabelList dataKey="carteira3" content={endLabel("carteira3", c3.nome || "Carteira 3")} />
                </Line>
              )}
              {exibir.carteira4 && s4.length > 0 && (
                <Line type="monotone" dataKey="carteira4" name={c4.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira4}>
                  <LabelList dataKey="carteira4" content={endLabel("carteira4", c4.nome || "Carteira 4")} />
                </Line>
              )}
              {exibir.carteira5 && s5.length > 0 && (
                <Line type="monotone" dataKey="carteira5" name={c5.nome} dot={false} activeDot={{ r: 3, fill: "#000" }} {...LINE_STYLES.carteira5}>
                  <LabelList dataKey="carteira5" content={endLabel("carteira5", c5.nome || "Carteira 5")} />
                </Line>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda/descrição do figure com resumo dos últimos valores */}
<figcaption
  id={captionId}
  className="text-black/60 text-sm mt-3 text-left whitespace-pre-line"
>
  {"¹ Retorno acima do IPCA\n² IFHA indica a rentabilidade dos fundos multimercado no Brasil"}
</figcaption>


        {/* Tabela fallback (a11y) */}
        <div className="sr-only">
          <table>
            <caption>Resumo tabular do desempenho acumulado (últimos 12 meses).</caption>
            <thead>
              <tr>
                <th scope="col">Mês</th>
                {series.map((s) => (
                  <th key={s.key} scope="col">{s.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i}>
                  <th scope="row">{row.date}</th>
                  {series.map((s) => (
                    <td key={s.key}>{row[s.key] == null ? "—" : fmtPct(row[s.key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
    </div>
  );
}
