// src/lib/rentabilidade.js

// (Opcional) usar o loader central para ler JSON do CMS quando precisar daqui.
import { readJson } from "./cmsLoader";

/** Converte fração ou número para percentual com 2 casas e vírgula */
export function toPct(x) {
  if (x == null || Number.isNaN(Number(x))) return null;
  return +(Number(x).toFixed(2));
}

/** Normaliza YYYY-MM (corta dia/hora se vierem do CMS) */
export function normalizeYYYYMM(s) {
  if (!s) return s;
  const m = String(s).match(/^(\d{4})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}` : s;
}

/** Remove meses duplicados mantendo o último e ordena asc por YYYY-MM */
export function dedupeAndSort(rows = [], dateKey = "date") {
  const map = new Map();
  for (const r of rows) {
    const date = normalizeYYYYMM(r[dateKey]);
    map.set(date, { ...r, [dateKey]: date }); // se houver repetição do mês, sobrepõe
  }
  return Array.from(map.values()).sort((a, b) => String(a[dateKey]).localeCompare(String(b[dateKey])));
}

/** Acumulação por capitalização (composto) — entrada em % (ex.: 1.23) → saída em % acumulado */
export function accumulateCompound(monthlyPercents) {
  let accMul = 1;
  return monthlyPercents.map((p) => {
    const v = Number(p) / 100;
    accMul *= 1 + (Number.isFinite(v) ? v : 0);
    return (accMul - 1) * 100;
  });
}

/** Acumulação por soma simples — entrada em % → saída em % acumulado */
export function accumulateSum(monthlyPercents) {
  let acc = 0;
  return monthlyPercents.map((p) => {
    const v = Number(p);
    acc += Number.isFinite(v) ? v : 0;
    return acc;
  });
}

/**
 * Calcula série acumulada a partir de uma "carteira" (obj ou array com {date, rendimento}).
 * @param {Object|Array} carteiraObj objeto que contém `series: [{date, rendimento}]` ou um array diretamente
 * @param {"compound"|"sum"} mode forma de acumulação
 * @param {string} dateKey chave de data nos pontos (default: "date")
 * @param {string} valueKey chave do valor mensal em % (default: "rendimento")
 * @returns Array<{date: string, valor: number}>
 */
export function buildAccumulatedSeries(carteiraObj, mode = "compound", dateKey = "date", valueKey = "rendimento") {
  const rows0 = Array.isArray(carteiraObj)
    ? carteiraObj
    : Array.isArray(carteiraObj?.series)
    ? carteiraObj.series
    : [];

  const rows = dedupeAndSort(rows0, dateKey);
  const monthly = rows.map((r) => Number(r[valueKey]) || 0);
  const acc =
    String(mode).toLowerCase() === "sum" ? accumulateSum(monthly) : accumulateCompound(monthly);

  return rows.map((r, i) => ({ date: r[dateKey], valor: toPct(acc[i]) }));
}

/** Une as datas de N séries em um eixo único ordenado (YYYY-MM) */
export function mergeDates(...series) {
  const set = new Set();
  series.forEach((s) => s?.forEach((p) => set.add(normalizeYYYYMM(p.date))));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Alinha uma série às DATAS fornecidas.
 * Mantém o último valor conhecido (carry-forward) até aparecer novo ponto.
 * @returns Array<{date: string, valor: number|null}>
 */
export function alignByDates(dates, series) {
  const map = new Map((series || []).map((p) => [normalizeYYYYMM(p.date), p.valor]));
  let last = null;
  return dates.map((d) => {
    if (map.has(d)) last = map.get(d);
    return { date: d, valor: last };
  });
}

/**
 * Monta dataset multi-séries com chaves dinâmicas.
 * @param {string[]} dates eixo X unificado
 * @param {{key: string, points: Array<{date, valor}>}[]} namedSeries
 * @example
 *   const dates = mergeDates(s1, s2)
 *   const data = buildDataset(dates, { key: "ipca", points: sIpca }, { key: "portfolio", points: sPort })
 *   // => [{ date, ipca, portfolio }, ...]
 */
export function buildDataset(dates, ...namedSeries) {
  const maps = namedSeries.map(({ key, points }) => ({
    key,
    map: new Map(points.map((p) => [normalizeYYYYMM(p.date), p.valor])),
  }));

  return dates.map((d) => {
    const row = { date: d };
    maps.forEach(({ key, map }) => {
      row[key] = map.has(d) ? map.get(d) : null;
    });
    return row;
  });
}

/* =========================
   Helpers voltados ao CMS
   ========================= */

/**
 * Lê um JSON de conteúdo do CMS pelo caminho absoluto (mesma chave usada em index.json).
 * Retorna o objeto JS já carregado do bundle (via import.meta.glob).
 */
export function readCmsJson(path) {
  return readJson(String(path));
}

/**
 * Dado um config de gráfico "desempenho" do CMS,
 * carrega as séries e retorna um array [{label, data:[{date, valor}]}]
 *
 * @param {{ accumulation?: "sum"|"compound", series: Array<{ source: string, label?: string }> }} cfg
 */
export function loadPerformanceSeriesFromConfig(cfg) {
  const mode = (cfg?.accumulation || "compound").toLowerCase();
  const arr = (cfg?.series || []).map((s) => {
    const raw = readCmsJson(String(s.source));
    const data = buildAccumulatedSeries(raw, mode);
    const label =
      s.label ||
      raw?.nome ||
      String(s.source).split("/").pop()?.replace(".json", "") ||
      "Série";
    return { label, data };
  });
  return arr.filter((s) => s.data?.length);
}
