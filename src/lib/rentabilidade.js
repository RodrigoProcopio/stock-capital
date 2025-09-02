// src/lib/rentabilidade.js

/** Converte 0.1234 -> 12.34 (duas casas) */
export function toPct(x) {
    if (x == null || Number.isNaN(x)) return null;
    return +(x * 100).toFixed(2);
  }
  
  /** Produto acumulado dos rendimentos mensais em % (ex.: 0.92 => 0,92%) */
  export function acumularPercent(retornos) {
    let acc = 1;
    return retornos.map((r) => {
      const v = parseFloat(r ?? 0);
      const f = Number.isFinite(v) ? v : 0;
      acc *= 1 + f / 100;
      return acc - 1; // ex.: 0.4835 = 48.35%
    });
  }
  
  /** Normaliza YYYY-MM (corta dia/hora se vierem do CMS) */
  export function normalizeYYYYMM(s) {
    if (!s) return s;
    // aceitamos "2025-03-01T00:00:00Z" -> "2025-03"
    const m = String(s).match(/^(\d{4})-(\d{2})/);
    return m ? `${m[1]}-${m[2]}` : s;
  }
  
  /** Remove meses duplicados mantendo o último e ordena asc por YYYY-MM */
  export function dedupeAndSort(rows = []) {
    const map = new Map();
    for (const r of rows) {
      const date = normalizeYYYYMM(r.date);
      map.set(date, { ...r, date }); // se houver repetição do mês, sobrepõe
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }
  
  /** Prepara a série acumulada (rendimento mensal -> acumulado em %) para UMA carteira */
  export function prepararSerieAcumulada(carteira) {
    const rows = dedupeAndSort(carteira?.series || []);
    const acc = acumularPercent(rows.map((r) => r.rendimento));
    return rows.map((r, i) => ({ date: r.date, valor: toPct(acc[i]) }));
  }
  
  /** Une as datas de N séries em um eixo único ordenado */
  export function unirDatas(...series) {
    const set = new Set();
    series.forEach((s) => s.forEach((p) => set.add(normalizeYYYYMM(p.date))));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }
  
  /**
   * Alinha uma série às DATAS fornecidas.
   * Mantém o último valor conhecido (carry-forward) até aparecer novo ponto.
   * Retorna [{ date, valor|null }]
   */
  export function alinharPorDatas(datas, serie) {
    const map = new Map(serie.map((p) => [normalizeYYYYMM(p.date), p.valor]));
    let atual = null;
    return datas.map((d) => {
      if (map.has(d)) atual = map.get(d);
      return { date: d, valor: atual };
    });
  }
  
  /** Helper final: monta dataset para até 5 carteiras já alinhadas ao mesmo eixo */
  export function montarDataset(datas, ...seriesAlinhadas) {
    return datas.map((d, i) => {
      const row = { date: d };
      seriesAlinhadas.forEach((s, idx) => {
        row[`carteira${idx + 1}`] = s[i]?.valor ?? null;
      });
      return row;
    });
  }
  