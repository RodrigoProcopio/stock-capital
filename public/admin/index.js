/* global CMS, Papa, XLSX */

function normalizeYYYYMM(s) {
    if (!s) return s;
    const m = String(s).match(/^(\d{4})[-/](\d{1,2})/);
    if (!m) return s;
    const mm = m[2].padStart(2, "0");
    return `${m[1]}-${mm}`;
  }
  
  function toNumberPt(v) {
    if (v == null || v === "") return null;
    // aceita "1,23" ou "1.23" -> 1.23
    const s = String(v).replace(/\./g, "").replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  
  function sortByDateAsc(rows) {
    return [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  
  function mergeSeries(existing, imported, overwrite = true) {
    // existing / imported: [{date:'YYYY-MM', rendimento:number}]
    const map = new Map(existing.map(r => [normalizeYYYYMM(r.date), { ...r, date: normalizeYYYYMM(r.date) }]));
    for (const r of imported) {
      const date = normalizeYYYYMM(r.date);
      if (!map.has(date) || overwrite) {
        map.set(date, { date, rendimento: r.rendimento });
      }
    }
    return sortByDateAsc(Array.from(map.values()));
  }
  
  // React control
  const SeriesImportControl = ({ value, onChange, forID, classNameWrapper }) => {
    const React = window.React;
    const { useState, useEffect } = React;
  
    const initial = Array.isArray(value?.toJS?.()) ? value.toJS() : (value || []);
    const [rows, setRows] = useState(initial);
    const [overwrite, setOverwrite] = useState(true);
    const [status, setStatus] = useState("");
  
    useEffect(() => {
      // garante sync ao abrir item já salvo
      const v = Array.isArray(value?.toJS?.()) ? value.toJS() : (value || []);
      setRows(v);
    }, [value]);
  
    function pushChange(next) {
      setRows(next);
      onChange(next);
    }
  
    function onFile(e) {
      const file = e.target.files?.[0];
      if (!file) return;
      setStatus("Importando...");
  
      const ext = file.name.split(".").pop().toLowerCase();
  
      // CSV
      if (ext === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            const imported = (res.data || [])
              .map(r => ({
                date: normalizeYYYYMM(r.date || r.mes || r["mês"] || r["Mes"] || r["Mês"] || r["AnoMes"]),
                rendimento: toNumberPt(r.rendimento ?? r["retorno"] ?? r["rentabilidade"] ?? r["rtn"])
              }))
              .filter(r => r.date && r.rendimento != null);
            const merged = mergeSeries(rows, imported, overwrite);
            pushChange(merged);
            setStatus(`Importados ${imported.length} meses (policy: ${overwrite ? "sobrescrever" : "manter existente"})`);
          },
          error: (err) => setStatus("Erro CSV: " + err?.message),
        });
        return;
      }
  
      // XLSX opcional
      if (ext === "xlsx" || ext === "xls") {
        if (!window.XLSX) {
          setStatus("Suporte a Excel não carregado. Habilite a tag <script> do XLSX no index.html.");
          return;
        }
        const reader = new FileReader();
        reader.onload = (evt) => {
          const wb = XLSX.read(evt.target.result, { type: "binary" });
          const sheet = wb.SheetNames[0];
          const json = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
          const imported = (json || [])
            .map(r => ({
              date: normalizeYYYYMM(r.date || r.mes || r["mês"] || r["Mes"] || r["Mês"] || r["AnoMes"]),
              rendimento: toNumberPt(r.rendimento ?? r["retorno"] ?? r["rentabilidade"] ?? r["rtn"])
            }))
            .filter(r => r.date && r.rendimento != null);
          const merged = mergeSeries(rows, imported, overwrite);
          pushChange(merged);
          setStatus(`Importados ${imported.length} meses (Excel).`);
        };
        reader.readAsBinaryString(file);
        return;
      }
  
      setStatus("Formato não suportado. Use .csv (ou habilite .xlsx).");
    }
  
    function addRow() {
      pushChange(sortByDateAsc([...rows, { date: "2025-01", rendimento: 0 }]));
    }
  
    function removeRow(idx) {
      const next = [...rows];
      next.splice(idx, 1);
      pushChange(next);
    }
  
    function updateRow(idx, key, val) {
      const next = [...rows];
      next[idx] = { ...next[idx], [key]: key === "date" ? normalizeYYYYMM(val) : toNumberPt(val) ?? "" };
      pushChange(next);
    }
  
    return React.createElement(
      "div",
      { id: forID, className: classNameWrapper },
      [
        React.createElement("div", { key: "toolbar", style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 } }, [
          React.createElement("input", { key: "file", type: "file", accept: ".csv,.xlsx,.xls", onChange: onFile }),
          React.createElement("label", { key: "ow" }, [
            React.createElement("input", {
              type: "checkbox",
              checked: overwrite,
              onChange: (e) => setOverwrite(e.target.checked),
              style: { marginRight: 6 },
            }),
            "Sobrescrever meses existentes",
          ]),
          React.createElement("button", { key: "add", type: "button", onClick: addRow, style: { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" } }, "+ Adicionar mês"),
        ]),
        status && React.createElement("div", { key: "status", style: { color: "#555", marginBottom: 8 } }, status),
  
        // Tabela simples de edição
        React.createElement("table", { key: "table", style: { width: "100%", borderCollapse: "collapse" } },
          [
            React.createElement("thead", { key: "th" }, React.createElement("tr", null, [
              React.createElement("th", { style: { textAlign: "left", padding: 6, borderBottom: "1px solid #eee" } }, "Mês (YYYY-MM)"),
              React.createElement("th", { style: { textAlign: "left", padding: 6, borderBottom: "1px solid #eee" } }, "Rendimento (%)"),
              React.createElement("th", { style: { width: 80 } }, ""),
            ])),
            React.createElement("tbody", { key: "tb" },
              rows.map((r, i) =>
                React.createElement("tr", { key: i }, [
                  React.createElement("td", { style: { padding: 6, borderBottom: "1px solid #f3f3f3" } },
                    React.createElement("input", {
                      type: "text",
                      value: r.date || "",
                      placeholder: "YYYY-MM",
                      onChange: (e) => updateRow(i, "date", e.target.value),
                      style: { width: "100%" },
                    })
                  ),
                  React.createElement("td", { style: { padding: 6, borderBottom: "1px solid #f3f3f3" } },
                    React.createElement("input", {
                      type: "text",
                      value: r.rendimento ?? "",
                      placeholder: "0,00",
                      onChange: (e) => updateRow(i, "rendimento", e.target.value),
                      style: { width: "100%" },
                    })
                  ),
                  React.createElement("td", { style: { textAlign: "right" } },
                    React.createElement("button", {
                      type: "button",
                      onClick: () => removeRow(i),
                      style: { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" }
                    }, "Remover")
                  ),
                ])
              )
            ),
          ]
        ),
      ]
    );
  };
  
  const SeriesImportPreview = (props) => {
    const React = window.React;
    const rows = Array.isArray(props.value?.toJS?.()) ? props.value.toJS() : (props.value || []);
    return React.createElement("pre", null, JSON.stringify(sortByDateAsc(rows), null, 2));
  };
  
  // registra o widget
  CMS.registerWidget("series-import", SeriesImportControl, SeriesImportPreview);
  