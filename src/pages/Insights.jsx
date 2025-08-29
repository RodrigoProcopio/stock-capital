import PageLayout from "../components/PageLayout";

export default function Insights() {
  const docs = [
    { title: "Nota: Copom e projeções de juros", date: "06/02/2025", summary: "Leitura rápida da decisão e implicações para duration.", href: "#" },
    { title: "Insight: IA e produtividade", date: "18/01/2025", summary: "Como a adoção de IA impacta margens e valuations.", href: "#" },
    { title: "Flash: Fluxos estrangeiros na B3", date: "10/01/2025", summary: "Comportamento recente e possíveis desdobramentos.", href: "#" },
  ];

  return (
    <PageLayout
      title="Insights"
      subtitle="Notas rápidas e estudos sobre temas relevantes."
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
