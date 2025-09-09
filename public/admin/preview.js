/* /public/admin/preview.js */
(() => {
  const CMS = window.CMS;
  if (!CMS) {
    console.error("Decap CMS não carregou (window.CMS indefinido). Verifique a ordem dos scripts em /admin/index.html");
    return;
  }

  // CSS inline para o preview (sem usar data:)
  const previewCss = `
    .sc-card { border:1px solid #e5e7eb; border-radius:12px; padding:16px; background:#fff; box-shadow:0 4px 12px rgba(0,0,0,.06); }
    .sc-title { font-weight:700; color:#1c2846; margin:0 0 4px; }
    .sc-date { font-size:12px; color:#64748b; margin:0 0 8px; }
    .sc-summary { font-size:14px; color:#334155; margin:8px 0 12px; }
    .sc-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px;
              width:100%; padding:10px 12px; border-radius:10px; border:1px solid #e2e8f0;
              background:#1c2846; color:#fff; font-weight:600; }
    .sc-icon { width:16px; height:16px; }
  `;
  CMS.registerPreviewStyle(previewCss, { raw: true });

  // Preact (do Decap)
  const h = (window.h || window.preact?.h);
  if (!h) {
    console.error("Preact (h) não disponível no preview.");
    return;
  }

  function CardPreview({ entry, getAsset }) {
    const data = entry.get('data');
    const title = data.get('title') || 'Sem título';
    const date  = data.get('date')  || '';          // já vem como DD/MM/YYYY pelo config.yml
    const summary = data.get('summary') || '';      // opcional
    const pdfPath = data.get('pdf');
    const pdfUrl  = pdfPath ? getAsset(pdfPath) : null;

    return h('div', { className: 'sc-card' }, [
      h('h3', { className: 'sc-title' }, title),
      date ? h('p', { className: 'sc-date' }, String(date)) : null,
      summary ? h('p', { className: 'sc-summary' }, summary) : null,
      h('a', {
        className: 'sc-btn',
        href: pdfUrl || '#',
        target: pdfUrl ? '_blank' : undefined,
        rel: pdfUrl ? 'noopener noreferrer' : undefined
      }, [
        h('svg', { className: 'sc-icon', viewBox: '0 0 24 24', fill: 'none' }, [
          h('path', { d: 'M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
        ]),
        pdfUrl ? 'Abrir PDF' : 'Selecione um PDF'
      ])
    ]);
  }

  ['cartas', 'relatorios', 'insights', 'compliance'].forEach((coll) => {
    CMS.registerPreviewTemplate(coll, CardPreview);
  });
})();
