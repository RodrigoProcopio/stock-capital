// src/lib/cmsLoader.js
function normalizeEntries(mods) {
    return Object.entries(mods).map(([path, mod]) => {
      const data = mod.default || mod; // JSON
      const [, , type] = path.split("/"); // ex: ["src","content","cartas","arquivo.json"]
      return { ...data, _type: type, _path: path };
    });
  }
  
  export function loadCartas() {
    const mods = import.meta.glob("../content/cartas/*.json", { eager: true });
    const list = normalizeEntries(mods);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  export function loadRelatorios() {
    const mods = import.meta.glob("../content/relatorios/*.json", { eager: true });
    const list = normalizeEntries(mods);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  export function loadInsights() {
    const mods = import.meta.glob("../content/insights/*.json", { eager: true });
    const list = normalizeEntries(mods);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  export function loadCompliance() {
    const mods = import.meta.glob("../content/compliance/*.json", { eager: true });
    const list = normalizeEntries(mods);
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  /** ---------------- Charts JSON Loader (bundled via Vite) ------------------ */
/**
 * Empacota todos os JSONs de charts no bundle (sem requisição de rede).
 */
const __chartJsonMods = import.meta.glob("../content/rentabilidade/charts/*.json", { eager: true });

/**
 * Aceita especificadores em diferentes formatos:
 * - "/src/content/rentabilidade/charts/volatilidade-ltm.json"
 * - "rentabilidade/charts/volatilidade-ltm.json"
 * - "volatilidade-ltm.json"
 */
function __matchChartKey(spec) {
  if (!spec) return null;
  const s = String(spec).replace(/^\//, ""); // remove "/" inicial
  const entries = Object.keys(__chartJsonMods); // "../content/rentabilidade/charts/xxx.json"

  // tenta casar o caminho completo
  let key = entries.find((k) => k.endsWith(s));
  if (key) return key;

  // tenta por nome do arquivo
  const filename = s.split("/").pop();
  key = entries.find((k) => k.endsWith("/" + filename));
  return key || null;
}

/**
 * Lê JSON pelo nome/caminho informado. Primeiro tenta charts/, depois qualquer content/**.
 */
export function readJson(spec) {
  const key = __matchChartKey(spec);
  if (key) {
    const mod = __chartJsonMods[key];
    return (mod && (mod.default || mod)) ?? null;
  }

  // fallback genérico: qualquer JSON em src/content/**
  const genericMods = {
    ...import.meta.glob("../content/**/*.json", { eager: true }),
  };
  const s = String(spec);
  const gkey = Object.keys(genericMods).find(
    (k) => k.endsWith(s) || k.endsWith("/" + s.split("/").pop())
  );
  if (gkey) {
    const mod = genericMods[gkey];
    return (mod && (mod.default || mod)) ?? null;
  }

  console.warn("[readJson] JSON não encontrado:", spec);
  return null;
}
