import PageLayout from "../components/PageLayout";

export default function Cartas() {
  const docs = [
    { title: "Carta de Gestão - Dezembro 2024", date: "31/12/2024", summary: "Análise do cenário macroeconômico e perspectivas para 2025.", href: "#" },
    { title: "Carta de Gestão - Novembro 2024", date: "30/11/2024", summary: "Revisão da carteira e posicionamento estratégico.", href: "#" },
    { title: "Carta de Gestão - Outubro 2024", date: "31/10/2024", summary: "Impactos das eleições americanas nos mercados.", href: "#" },
    { title: "Carta de Gestão - Setembro 2024", date: "30/09/2024", summary: "Análise setorial e oportunidades de investimento.", href: "#" },
  ];

  return (
    <PageLayout
      title="Cartas de Gestão"
      subtitle="Análises periódicas com visão de mercado e posicionamento estratégico."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((d, i) => (
          <DocCard key={i} {...d} />
        ))}
      </div>
    </PageLayout>
  );
}

function DocCard({ title, date, summary, href }) {
  return (
    <article className="rounded-xl border border-brand-navy/15 bg-white p-5 shadow-sm hover:shadow-md transition">
      <h3 className="font-semibold text-brand-navy">{title}</h3>
      {date && <p className="mt-1 text-xs text-slate-500">{date}</p>}
      {summary && <p className="mt-3 text-sm text-slate-700">{summary}</p>}
      <a
        href={href}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-navy/20 px-3 py-2 text-sm font-medium hover:bg-brand-100"
        download
      >
        Baixar PDF
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </a>
    </article>
  );
}
