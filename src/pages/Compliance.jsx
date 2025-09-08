import PageLayout from "../components/PageLayout.jsx";

function loadDocs() {
  const files = import.meta.glob("/src/content/compliance/*.json", { eager: true });
  return Object.values(files)
    .map((m) => m.default || m)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function Compliance() {
  const docs = loadDocs();
  return (
    <PageLayout
      title="Compliance"
      subtitle="Documentos e políticas de conformidade e ética."
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {docs.map((d, i) => (
          <DocCard key={i} {...d} />
        ))}
      </div>
    </PageLayout>
  );
}

function DocCard({ title, date, summary, pdf }) {
  return (
    <article className="rounded-xl border border-brand-navy/15 bg-white p-5 shadow-sm hover:shadow-md transition">
      <h3 className="font-semibold text-brand-navy">{title}</h3>
      {date && <p className="mt-1 text-xs text-slate-500">{date}</p>}
      {summary && <p className="mt-3 text-sm text-slate-700">{summary}</p>}
      {pdf && (
        <a
          href={pdf}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-navy/20 px-3 py-2 text-sm font-medium hover:bg-brand-100"
          download
        >
          Baixar PDF
        </a>
      )}
    </article>
  );
}
