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
  