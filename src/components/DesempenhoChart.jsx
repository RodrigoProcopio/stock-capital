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

import {
  prepararSerieAcumulada,
  unirDatas,
  alinharPorDatas,
  montarDataset,
} from "../lib/rentabilidade";

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

/* ============================================================================
   NOVO: suporte a "soma simples" (para bater com a tabela do cliente)
   ----------------------------------------------------------------------------
   - Lê os retornos mensais da carteira (em %) e acumula por somatório.
   - Robusto a diferentes formatos de JSON (tenta várias chaves comuns).
============================================================================ */

/** Tenta extrair a série mensal {date, retPct} da carteira */
function extractMensal(carteira) {
  // candidatos de onde pode vir a lista
  const candidates = [
    carteira?.mensal,
    carteira?.series,
    carteira?.dados,
    carteira?.valores,
    carteira, // em último caso, a própria coisa pode ser um array
  ].find((x) => Array.isArray(x));

  const rows = Array.isArray(candidates) ? candidates : [];

  return rows
    .map((row) => {
      // possíveis chaves de data
      const date =
        row.date ??
        row.data ??
        row.mes ??
        row.mês ??
        row.periodo ??
        row.período ??
        null;

      // possíveis chaves de retorno (em %)
      let ret =
        row.retorno ?? row.variacao ?? row.var ?? row.valor ?? row.value ?? row.pct ?? null;

      // normaliza número; se vier string "1,23", troca vírgula por ponto
      if (typeof ret === "string") {
        ret = Number(ret.replace(",", "."));
      }

      // se o dado já for fração (ex.: 0.0123 = 1,23%), converte para %
      // heurística: |ret| <= 1 => assume fração e multiplica por 100
      if (typeof ret === "number" && Math.abs(ret) <= 1) {
        ret = ret * 100;
      }

      return date ? { date: String(date), retPct: Number(ret) } : null;
    })
    .filter(Boolean);
}

/** Constrói [{date, value}] onde value é o acumulado por soma simples em % */
function prepararSerieSomaSimples(carteira) {
  const mensal = extractMensal(carteira);
  let acc = 0;
  return mensal.map(({ date, retPct }) => {
    const v = Number.isFinite(retPct) ? retPct : 0;
    acc += v; // soma simples (em %)
    return { date, value: acc };
  });
}

/** Wrapper que escolhe a metodologia */
function prepararSeriePorMetodologia(carteira, metodologia) {
  return metodologia === "simples"
    ? prepararSerieSomaSimples(carteira)
    : prepararSerieAcumulada(carteira); // padrão: composto
}

export default function DesempenhoChart() {
  const captionId = useId();

  // metodologia: "composto" (default) ou "simples"
  const metodologia = (dash?.metodologia ?? "composto").toLowerCase();

  // séries acumuladas conforme metodologia
  const s1 = useMemo(() => prepararSeriePorMetodologia(c1, metodologia), [metodologia]);
  const s2 = useMemo(() => prepararSeriePorMetodologia(c2, metodologia), [metodologia]);
  const s3 = useMemo(() => prepararSeriePorMetodologia(c3, metodologia), [metodologia]);
  const s4 = useMemo(() => prepararSeriePorMetodologia(c4, metodologia), [metodologia]);
  const s5 = useMemo(() => prepararSeriePorMetodologia(c5, metodologia), [metodologia]);

  // eixo e alinhamento
  const datas = useMemo(() => unirDatas(s1, s2, s3, s4, s5), [s1, s2, s3, s4, s5]);
  const a1 = useMemo(() => alinharPorDatas(datas, s1), [datas, s1]);
  const a2 = useMemo(() => alinharPorDatas(datas, s2), [datas, s2]);
  const a3 = useMemo(() => alinharPorDatas(datas, s3), [datas, s3]);
  const a4 = useMemo(() => alinharPorDatas(datas, s4), [datas, s4]);
  const a5 = useMemo(() => alinharPorDatas(datas, s5), [datas, s5]);

  const data = useMemo(() => montarDataset(datas, a1, a2, a3, a4, a5), [datas, a1, a2, a3, a4, a5]);

  const exibir = dash.exibir || {};

  // metadados das séries ativas
  const series = useMemo(() => {
    const arr = [];
    if (exibir.carteira1) arr.push({ key: "carteira1", name: c1.nome || "Carteira 1" });
    if (exibir.carteira2) arr.push({ key: "carteira2", name: c2.nome || "Carteira 2" });
    if (exibir.carteira3) arr.push({ key: "carteira3", name: c3.nome || "Carteira 3" });
    if (exibir.carteira4) arr.push({ key: "carteira4", name: c4.nome || "Carteira 4" });
    if (exibir.carteira5) arr.push({ key: "carteira5", name: c5.nome || "Carteira 5" });
    return arr;
  }, [exibir]);

  // resumo dos últimos valores (para figcaption/table)
  const latestSummary = useMemo(() => {
    const out = [];
    for (const s of series) {
      const v = lastNonNull(data, s.key);
      if (v !== null) out.push(`${s.name}: ${fmtPct(v)}`);
    }
    return out;
  }, [series, data]);

  // renderer que desenha label apenas no último ponto
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

  // quantidade de linhas para a tabela fallback (evitar excesso para leitores)
  const tableRows = useMemo(() => data.slice(-12), [data]); // últimos 12 meses

  return (
    <div className="w-full rounded-2xl p-6" style={{ background: SITE_BG }}>
      {/* títulos centralizados (mantidos) */}
      <h2 className="text-black text-3xl font-semibold text-center">
        Desempenho Consolidado | Multi-Family Office
      </h2>
      <p className="text-black/70 text-base mt-1 text-center">
      </p>

      {/* A11y: figure + figcaption + tabela fallback */}
      <figure
        aria-label="Gráfico de linhas com o retorno acumulado das carteiras ao longo do tempo"
        aria-describedby={captionId}
        className="mt-4"
      >
        <div style={{ width: "100%", height: 420 }}>
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
                formatter={(v, n) => (v == null ? ["—", n] : [`${Number(v).toFixed(2)}%`, n])}
                labelFormatter={(l) => `Mês: ${l}`}
              />

              {exibir.carteira1 && (
                <Line
                  type="monotone"
                  dataKey="carteira1"
                  name={c1.nome}
                  dot={false}
                  activeDot={{ r: 3, fill: "#000" }}
                  {...LINE_STYLES.carteira1}
                >
                  <LabelList dataKey="carteira1" content={endLabel("carteira1", c1.nome || "Carteira 1")} />
                </Line>
              )}
              {exibir.carteira2 && (
                <Line
                  type="monotone"
                  dataKey="carteira2"
                  name={c2.nome}
                  dot={false}
                  activeDot={{ r: 3, fill: "#000" }}
                  {...LINE_STYLES.carteira2}
                >
                  <LabelList dataKey="carteira2" content={endLabel("carteira2", c2.nome || "Carteira 2")} />
                </Line>
              )}
              {exibir.carteira3 && (
                <Line
                  type="monotone"
                  dataKey="carteira3"
                  name={c3.nome}
                  dot={false}
                  activeDot={{ r: 3, fill: "#000" }}
                  {...LINE_STYLES.carteira3}
                >
                  <LabelList dataKey="carteira3" content={endLabel("carteira3", c3.nome || "Carteira 3")} />
                </Line>
              )}
              {exibir.carteira4 && (
                <Line
                  type="monotone"
                  dataKey="carteira4"
                  name={c4.nome}
                  dot={false}
                  activeDot={{ r: 3, fill: "#000" }}
                  {...LINE_STYLES.carteira4}
                >
                  <LabelList dataKey="carteira4" content={endLabel("carteira4", c4.nome || "Carteira 4")} />
                </Line>
              )}
              {exibir.carteira5 && (
                <Line
                  type="monotone"
                  dataKey="carteira5"
                  name={c5.nome}
                  dot={false}
                  activeDot={{ r: 3, fill: "#000" }}
                  {...LINE_STYLES.carteira5}
                >
                  <LabelList dataKey="carteira5" content={endLabel("carteira5", c5.nome || "Carteira 5")} />
                </Line>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda/descrição do figure com resumo dos últimos valores */}
        <figcaption id={captionId} className="text-black/60 text-sm mt-3 text-center">
          Dados atualizados mensalmente. 
          Acumulado: {latestSummary.join(" · ")}.
        </figcaption>

        {/* Tabela fallback (a11y): visível para leitores de tela (Tailwind 'sr-only').
            Se quiser ver na tela para QA, troque 'sr-only' por 'mt-6 overflow-auto' */}
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
