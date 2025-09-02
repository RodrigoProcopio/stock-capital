/* global CMS, Papa */
(function () {
    // -------- helpers --------
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
  
    // -------- React via UMD --------
    const React = window.React;
  
    class SeriesImportControl extends React.Component {
      constructor(props) {
        super(props);
        const initial = Array.isArray(props.value?.toJS?.())
          ? props.value.toJS()
          : props.value || [];
        this.state = {
          rows: initial,
          overwrite: true,
          status: "",
        };
        // bind
        this.onFile = this.onFile.bind(this);
        this.addRow = this.addRow.bind(this);
        this.delRow = this.delRow.bind(this);
        this.updRow = this.updRow.bind(this);
        this.push = this.push.bind(this);
      }
  
      componentDidUpdate(prevProps) {
        // se o valor vindo do CMS mudar (abrir item salvo etc), sincroniza
        if (prevProps.value !== this.props.value) {
          const v = Array.isArray(this.props.value?.toJS?.())
            ? this.props.value.toJS()
            : this.props.value || [];
          this.setState({ rows: v });
        }
      }
  
      push(next) {
        this.setState({ rows: next });
        this.props.onChange(next);
      }
  
      onFile(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        this.setState({ status: "Importando CSV..." });
  
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (res) => {
            const imported = (res.data || [])
              .map((r) => ({
                date: normalizeYYYYMM(
                  r.date || r.mes || r["mês"] || r.Mes || r["Mês"] || r.AnoMes || r["AnoMes"]
                ),
                rendimento: toNumberPt(
                  r.rendimento ?? r.retorno ?? r.rentabilidade ?? r.rtn
                ),
              }))
              .filter((r) => r.date && r.rendimento != null);
  
            const merged = mergeSeries(
              this.state.rows,
              imported,
              this.state.overwrite
            );
            this.push(merged);
            this.setState({
              status: `Importados ${imported.length} meses (${this.state.overwrite ? "sobrescrevendo" : "mantendo"} existentes).`,
            });
          },
          error: (err) => this.setState({ status: "Erro CSV: " + (err?.message || err) }),
        });
      }
  
      addRow() {
        this.push(sortByDateAsc([...this.state.rows, { date: "2025-01", rendimento: 0 }]));
      }
  
      delRow(i) {
        const next = this.state.rows.slice();
        next.splice(i, 1);
        this.push(next);
      }
  
      updRow(i, key, val) {
        const next = this.state.rows.slice();
        if (key === "date") {
          next[i] = { ...next[i], date: normalizeYYYYMM(val) };
        } else {
          next[i] = { ...next[i], rendimento: toNumberPt(val) ?? "" };
        }
        this.push(next);
      }
  
      render() {
        const h = React.createElement;
        const { forID, classNameWrapper } = this.props;
        const { rows, overwrite, status } = this.state;
  
        return h("div", { id: forID, className: classNameWrapper }, [
          // toolbar
          h(
            "div",
            {
              key: "toolbar",
              style: {
                display: "flex",
                gap: 12,
                alignItems: "center",
                marginBottom: 12,
              },
            },
            [
              h("input", {
                key: "file",
                type: "file",
                accept: ".csv",
                onChange: this.onFile,
              }),
              h(
                "label",
                { key: "ow" },
                [
                  h("input", {
                    type: "checkbox",
                    checked: overwrite,
                    onChange: (e) => this.setState({ overwrite: e.target.checked }),
                    style: { marginRight: 6 },
                  }),
                  "Sobrescrever meses existentes",
                ]
              ),
              h(
                "button",
                {
                  key: "add",
                  type: "button",
                  onClick: this.addRow,
                  style: {
                    padding: "6px 10px",
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    cursor: "pointer",
                  },
                },
                "+ Adicionar mês"
              ),
            ]
          ),
  
          status &&
            h(
              "div",
              { key: "status", style: { color: "#555", marginBottom: 8 } },
              status
            ),
  
          // tabela
          h(
            "table",
            { key: "table", style: { width: "100%", borderCollapse: "collapse" } },
            [
              h(
                "thead",
                { key: "th" },
                h("tr", null, [
                  h(
                    "th",
                    {
                      style: {
                        textAlign: "left",
                        padding: 6,
                        borderBottom: "1px solid #eee",
                      },
                    },
                    "Mês (YYYY-MM)"
                  ),
                  h(
                    "th",
                    {
                      style: {
                        textAlign: "left",
                        padding: 6,
                        borderBottom: "1px solid #eee",
                      },
                    },
                    "Rendimento (%)"
                  ),
                  h("th", { style: { width: 80 } }, ""),
                ])
              ),
              h(
                "tbody",
                { key: "tb" },
                rows.map((r, i) =>
                  h("tr", { key: i }, [
                    h(
                      "td",
                      {
                        style: {
                          padding: 6,
                          borderBottom: "1px solid #f3f3f3",
                        },
                      },
                      h("input", {
                        type: "text",
                        value: r.date || "",
                        placeholder: "YYYY-MM",
                        onChange: (e) => this.updRow(i, "date", e.target.value),
                        style: { width: "100%" },
                      })
                    ),
                    h(
                      "td",
                      {
                        style: {
                          padding: 6,
                          borderBottom: "1px solid #f3f3f3",
                        },
                      },
                      h("input", {
                        type: "text",
                        value: r.rendimento ?? "",
                        placeholder: "0,00",
                        onChange: (e) =>
                          this.updRow(i, "rendimento", e.target.value),
                        style: { width: "100%" },
                      })
                    ),
                    h(
                      "td",
                      { style: { textAlign: "right" } },
                      h(
                        "button",
                        {
                          type: "button",
                          onClick: () => this.delRow(i),
                          style: {
                            padding: "6px 10px",
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            cursor: "pointer",
                          },
                        },
                        "Remover"
                      )
                    ),
                  ])
                )
              ),
            ]
          ),
        ]);
      }
    }
  
    // preview simples (opcional)
    const SeriesImportPreview = (props) => {
      const rows = Array.isArray(props.value?.toJS?.())
        ? props.value.toJS()
        : props.value || [];
      return React.createElement(
        "pre",
        null,
        JSON.stringify(sortByDateAsc(rows), null, 2)
      );
    };
  
    CMS.registerWidget("series-import", SeriesImportControl, SeriesImportPreview);
    console.log("series-import widget registrado");
  })();
  