import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function PageLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white text-slate-ink">
      {/* Header simples */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-brand-navy/10">
        <Link to="/" className="flex items-center gap-3">
        <img
  src={logo}
  alt="Logo Stock Capital"
  className="h-20 w-auto"
  loading="eager"
  decoding="async"
  fetchpriority="high"
  width={160}   // ajuste para o tamanho real da sua logo
  height={80}   // ajuste para o tamanho real da sua logo
/>
        </Link>

        <Link
          to="/"
          className="rounded-lg border border-brand-navy px-4 py-2 text-sm font-medium text-brand-navy hover:bg-brand-100"
        >
          ← Voltar
        </Link>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold text-brand-navy">{title}</h1>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
