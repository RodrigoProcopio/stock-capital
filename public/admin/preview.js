/* public/admin/preview.js */
/* global CMS */

(function () {
  const CMS = window.CMS;
  const React = window.React;
  const h = React.createElement;

  // CSS exclusivo do preview (pra ficar parecido com o card do site)
  const previewCss = `
    .sc-card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,.06); max-width: 420px; }
    .sc-title { font-weight:700; color:#1c2846; margin:0 0 4px; font-size: 20px; }
    .sc-date { font-size:12px; color:#64748b; margin:0 0 8px; }
    .sc-summary { font-size:14px; color:#334155; margin:8px 0 12px; line-height:1.45; }
    .sc-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px;
              width:100%; padding:10px 12px; border-radius:10px; border:1px solid #e2e8f0;
              background:#1c2846; color:#fff; font-weight:600; text-decoration:none; }
    .sc-icon { width:16px; height:16px; }
  `;
  CMS.registerPreviewStyle(`data:text/css,${encodeURIComponent(previewCss)}`, { raw: true });

  function CardPreview({ entry, getAsset }) {
    const data = entry.get("data") || new Map();

    const title = data.get("title") || "Sem título";
    const dateRaw = data.get("date") || "";
    const summary = data.get("summary") || "";
    const pdfPath = data.get("pdf");

    const pdfAsset = pdfPath ? getAsset(pdfPath) : null;
    const pdfUrl = pdfAsset ? String(pdfAsset) : null;

    let dateText = "";
    if (dateRaw) {
      const d = new Date(dateRaw);
      dateText = isNaN(d) ? String(dateRaw) : d.toLocaleString("pt-BR");
    }

    return h("div", { className: "sc-card" }, [
      h("h3", { className: "sc-title" }, title),
      dateText ? h("p", { className: "sc-date" }, dateText) : null,
      summary ? h("p", { className: "sc-summary" }, summary) : null,
      h(
        "a",
        {
          className: "sc-btn",
          href: pdfUrl || "#",
          target: pdfUrl ? "_blank" : undefined,
          rel: pdfUrl ? "noopener noreferrer" : undefined,
        },
        [
          h(
            "svg",
            { className: "sc-icon", viewBox: "0 0 24 24", fill: "none" },
            [
              h("path", {
                d: "M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14",
                stroke: "currentColor",
                "stroke-width": 2,
                "stroke-linecap": "round",
                "stroke-linejoin": "round",
              }),
            ]
          ),
          pdfUrl ? "Abrir PDF" : "Selecione um PDF",
        ]
      ),
    ]);
  }

  // Registra nos tipos desejados
  CMS.registerPreviewTemplate("cartas", CardPreview);
  ["relatorios", "insights", "compliance"].forEach((c) =>
    CMS.registerPreviewTemplate(c, CardPreview)
  );

  console.log("preview.js carregado");
})();
