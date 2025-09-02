/* global CMS, Papa */
(function () {
    // ---- helpers ----
    function normalizeYYYYMM(s) {
      if (!s) return s;
      const m = String(s).match(/^(\d{4})[-/](\d{1,2})/);
      if (!m) return s;
      return `${m[1]}-${m[2].padStart(2, "0")}`;
    }
    function toNumberPt(v) {
      if (v == null || v === "") return null;
      const s = String(v).replace(/\./g, "").replace(",", ".");
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }
    function sortByDateAsc(rows) {
      return [...rows].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    }
    function mergeSeries(existing, imported, overwrite) {
      const map = new Map(
        existing.map((r) => [normalizeYYYYMM(r.date), { ...r, date: normalizeYYYYMM(r.date) }])
      );
      for (const r of imported) {
        const d = normalizeYYYYMM(r.date);
        if (!map.has(d) || overwrite) map.set(d, { date: d, rendimento: r.rendimento });
      }
      return sortByDateAsc(Array.from(map.values()));
    }
  
    console.log("admin/index.js carregado");
  
    // ---- React via UMD (não usar CMS.getLib) ----
    const React = window.React;
    const { useState, useEffect } = React;
  
    // ---- Control ----
    const SeriesImportControl = ({ value, onChange, forID, classNameWrapper }) => {
      const initial = Array.isArray(value?.toJS?.()) ? value.toJS() : value || [];
      const [rows, setRows] = useState(initial);
      const [overwrite, setOverwrite] = useState(true);
      const [status, setStatus] = useState("");
  
      useEffect(() => {
        const v = Array.isArray(value?.toJS?.()) ? value.toJS() : value || [];
        setRows(v);
      }, [value]);
  
      function push(next) { setRows(next); onChange(next); }
  
      function onFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setStatus("Importando CSV...");
        Papa.parse(file, {
          header: true, skipEmptyLines: true,
          complete: (res) => {
            const imported = (res.data || [])
              .map((r) => ({
                date: normalizeYYYYMM(r.date || r.mes || r["mês"] || r.Mes || r["Mês"] || r.AnoMes || r["AnoMes"]),
                rendimento: toNumberPt(r.rendimento ?? r.retorno ?? r.rentabilidade ?? r.rtn),
              }))
              .filter((r) => r.date && r.rendimento != null);
  
            push(mergeSeries(rows, imported, overwrite));
            setStatus(`Importados ${imported.length} meses (${overwrite ? "sobrescrevendo" : "mantendo"} existentes).`);
          },
          error: (err) => setStatus("Erro CSV: " + err?.message),
        });
      }
  
      function addRow() { push(sortByDateAsc([...rows, { date: "2025-01", rendimento: 0 }])); }
      function delRow(i) { const n = rows.slice(); n.splice(i, 1); push(n); }
      function updRow(i, key, val) {
        const n = rows.slice();
        n[i] = key === "date" ? { ...n[i], date: normalizeYYYYMM(val) }
                              : { ...n[i], rendimento: toNumberPt(val) ?? "" };
        push(n);
      }
  
      return React.createElement("div", { id: forID, className: classNameWrapper }, [
        React.createElement("div", { key: "toolbar", style: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 } }, [
          React.createElement("input", { key: "file", type: "file", accept: ".csv", onChange: onFile }),
          React.createElement("label", { key: "ow" }, [
            React.createElement("input", { type: "checkbox", checked: overwrite, onChange: (e) => setOverwrite(e.target.checked), style: { marginRight: 6 } }),
            "Sobrescrever meses existentes",
          ]),
          React.createElement("button", { key: "add", type: "button", onClick: addRow, style: { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" } }, "+ Adicionar mês"),
        ]),
        status && React.createElement("div", { key: "status", style: { color: "#555", marginBottom: 8 } }, status),
  
        React.createElement("table", { key: "table", style: { width: "100%", borderCollapse: "collapse" } }, [
          React.createElement("thead", { key: "th" }, React.createElement("tr", null, [
            React.createElement("th", { style: { textAlign: "left", padding: 6, borderBottom: "1px solid #eee" } }, "Mês (YYYY-MM)"),
            React.createElement("th", { style: { textAlign: "left", padding: 6, borderBottom: "1px solid #eee" } }, "Rendimento (%)"),
            React.createElement("th", { style: { width: 80 } }, ""),
          ])),
          React.createElement("tbody", { key: "tb" },
            rows.map((r, i) =>
              React.createElement("tr", { key: i }, [
                React.createElement("td", { style: { padding: 6, borderBottom: "1px solid #f3f3f3" } },
                  React.createElement("input", { type: "text", value: r.date || "", placeholder: "YYYY-MM", onChange: (e) => updRow(i, "date", e.target.value), style: { width: "100%" } })
                ),
                React.createElement("td", { style: { padding: 6, borderBottom: "1px solid #f3f3f3" } },
                  React.createElement("input", { type: "text", value: r.rendimento ?? "", placeholder: "0,00", onChange: (e) => updRow(i, "rendimento", e.target.value), style: { width: "100%" } })
                ),
                React.createElement("td", { style: { textAlign: "right" } },
                  React.createElement("button", { type: "button", onClick: () => delRow(i), style: { padding: "6px 10px", border: "1px solid #ccc", borderRadius: 8, cursor: "pointer" } }, "Remover")
                ),
              ])
            )
          ),
        ]),
      ]);
    };
  
    // ---- Preview (opcional) ----
    const SeriesImportPreview = (props) => {
      const rows = Array.isArray(props.value?.toJS?.()) ? props.value.toJS() : props.value || [];
      return React.createElement("pre", null, JSON.stringify(sortByDateAsc(rows), null, 2));
    };
  
    // ---- register ----
    CMS.registerWidget("series-import", SeriesImportControl, SeriesImportPreview);
    console.log("series-import widget registrado");
  })();
  