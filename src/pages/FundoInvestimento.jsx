// src/pages/FundoInvestimento.jsx
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

// JSON do Fundo (CMS)
import fundo from "../content/fundos/stock-capital-fif-multimercado-cp-rl.json";

// Charts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from "recharts";

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

function brl(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format(v);
  } catch {
    return `R$ ${v}`;
  }
}

function pct(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return `${n.toFixed(2)}%`;
}

function parseMesToSortable(mes) {
  // mes: "MM/AAAA"
  if (!mes || typeof mes !== "string") return 0;
  const [mm, yyyy] = mes.split("/");
  const m = Number(mm);
  const y = Number(yyyy);
  if (!m || !y) return 0;
  return new Date(y, m - 1, 1).getTime();
}

function buildCrescimentoHipotetico(rows) {
  // rows: [{mes, fundo, cdi}] em % mensal (ex.: 1.23)
  // retorna [{mes, fundoBase100, cdiBase100}]
  const sorted = [...rows].sort((a, b) => parseMesToSortable(a.mes) - parseMesToSortable(b.mes));
  let fundoAcc = 100;
  let cdiAcc = 100;

  const out = [];
  for (const r of sorted) {
    const rf = Number(r.fundo ?? 0);
    const rc = Number(r.cdi ?? 0);
    fundoAcc *= 1 + (Number.isFinite(rf) ? rf : 0) / 100;
    cdiAcc *= 1 + (Number.isFinite(rc) ? rc : 0) / 100;
    out.push({
      mes: r.mes,
      fundoBase100: Number(fundoAcc.toFixed(2)),
      cdiBase100: Number(cdiAcc.toFixed(2)),
    });
  }
  return out;
}

function FundHeader({ data }) {
  const topo = data?.topo ?? {};
  const vc = topo?.valor_cota ?? {};
  const vari = topo?.variacao_cota ?? {};
  const rend = topo?.rendimento_total_cota ?? {};

  return (
    <div className="rounded-2xl border border-brand-navy/15 bg-white shadow-subtle">
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-navy/15 bg-brand-100/40 px-3 py-1 text-xs font-semibold text-brand-navy">
              {data?.categoria_label ?? "—"}
            </div>

            <h1 className="mt-3 text-3xl font-semibold text-brand-navy">
              {data?.nome ?? "—"}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Símbolo: <span className="font-semibold text-slate-ink">{data?.simbolo ?? "—"}</span>
              {" · "}
              <span className="font-semibold">{data?.labels?.benchmark ?? "Benchmark"}</span>
            </p>
          </div>

          <div className="rounded-xl border border-brand-navy/15 bg-white px-4 py-3">
            <div className="text-xs text-slate-500">Taxa de Administração</div>
            <div className="text-lg font-semibold text-brand-navy">
              {topo?.taxa_administracao_destaque ?? "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {topo?.prospecto_label ?? data?.labels?.prospecto ?? ""}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <KpiCard
            title={vc?.label ?? data?.labels?.valor_cota ?? "Valor da Cota"}
            value={brl(vc?.valor)}
            meta={vc?.data_referencia ? `Ref.: ${vc.data_referencia}` : ""}
          />
          <KpiCard
            title={vari?.label ?? data?.labels?.variacao_cota ?? "Variação da cota"}
            value={pct(vari?.valor)}
            meta={vari?.data_referencia ? `Ref.: ${vari.data_referencia}` : ""}
          />
          <KpiCard
            title={rend?.label ?? data?.labels?.rendimento_total_cota ?? "Rendimento total da Cota"}
            value={pct(rend?.valor)}
            meta={rend?.data_referencia ? `Ref.: ${rend.data_referencia}` : ""}
          />
        </div>

        {data?.avisos?.texto_principal && (
          <div className="mt-6 rounded-xl border border-brand-navy/10 bg-brand-100/30 p-4 text-sm text-slate-700">
            {data.avisos.texto_principal}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ title, value, meta }) {
  return (
    <div className="rounded-xl border border-brand-navy/15 bg-white p-4">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-brand-navy">{value}</div>
      {meta ? <div className="mt-1 text-xs text-slate-500">{meta}</div> : null}
    </div>
  );
}

function SectionCard({ id, title, subtitle, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="rounded-2xl border border-brand-navy/15 bg-white shadow-subtle">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-semibold text-brand-navy">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm text-slate-600">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Table2Col({ rows }) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-navy/15">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className={cx("border-b border-brand-navy/10", idx === rows.length - 1 && "border-b-0")}>
              <td className="w-1/2 bg-brand-100/20 px-4 py-3 font-semibold text-slate-700">
                {r.label}
              </td>
              <td className="px-4 py-3 text-slate-700">{r.value ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tabs({ tabs, activeId, onSelect }) {
  return (
    <div className="sticky top-0 z-40 border-b border-brand-navy/10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-auto px-6 py-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cx(
              "whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition",
              activeId === t.id
                ? "border-brand-navy bg-brand-100/60 text-brand-navy"
                : "border-brand-navy/15 bg-white text-slate-700 hover:bg-brand-100/40"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FundoInvestimento() {
  const data = fundo;

  const tabs = useMemo(
    () => [
      { id: "visao-geral", label: "Visão geral" },
      { id: "rentabilidade", label: "Rentabilidade" },
      { id: "portfolio", label: "Portfólio" },
      { id: "taxas", label: "Taxas" },
      { id: "documentos", label: "Documentos" },
    ],
    []
  );

  const [active, setActive] = useState(tabs[0].id);

  function go(id) {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const rentRows = useMemo(() => {
    const rows = Array.isArray(data?.rentabilidade?.tabela_mensal) ? data.rentabilidade.tabela_mensal : [];
    return [...rows].sort((a, b) => parseMesToSortable(b.mes) - parseMesToSortable(a.mes));
  }, [data]);

  const crescimento = useMemo(() => {
    const rows = Array.isArray(data?.rentabilidade?.tabela_mensal) ? data.rentabilidade.tabela_mensal : [];
    return buildCrescimentoHipotetico(rows);
  }, [data]);

  const exposicao = useMemo(() => {
    const items = Array.isArray(data?.exposicao?.itens) ? data.exposicao.itens : [];
    return items
      .map((x) => ({
        setor: x.setor ?? "—",
        percentual: Number(x.percentual ?? 0),
      }))
      .sort((a, b) => (b.percentual ?? 0) - (a.percentual ?? 0));
  }, [data]);

  const docs = useMemo(() => {
    const list = Array.isArray(data?.documentos) ? data.documentos : [];
    return [...list].sort((a, b) => {
      // tenta ordenar por data "DD/MM/AAAA" (se existir), senão mantém
      const da = a?.data ? a.data.split("/").reverse().join("-") : "";
      const db = b?.data ? b.data.split("/").reverse().join("-") : "";
      if (!da || !db) return 0;
      return db.localeCompare(da);
    });
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-ink">
      {/* Header simples (mantém estilo do site) */}
      <header className="border-b border-brand-navy/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3" aria-label="Voltar para Home">
            <img
              src={logo}
              alt="Logo Stock Capital"
              className="h-16 w-auto"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
          </Link>

          <Link
            to="/"
            className="rounded-xl border border-brand-navy/15 bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-100/40"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <Tabs tabs={tabs} activeId={active} onSelect={go} />

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        {/* Topo */}
        <FundHeader data={data} />

        {/* Visão geral */}
        <SectionCard
          id="visao-geral"
          title="Características-chave"
          subtitle="Informações gerais do fundo."
        >
          <Table2Col
            rows={[
              { label: "Patrimônio líquido do fundo", value: data?.caracteristicas_chave?.patrimonio_liquido ?? "—" },
              { label: "Bolsa", value: data?.caracteristicas_chave?.bolsa ?? "—" },
              { label: "Classe de ativos", value: data?.caracteristicas_chave?.classe_de_ativos ?? "—" },
              { label: "Código CVM", value: data?.caracteristicas_chave?.codigo_cvm ?? "—" },
              { label: "Domicílio", value: data?.caracteristicas_chave?.domicilio ?? "—" },
              { label: "Data de constituição", value: data?.caracteristicas_chave?.data_constituicao ?? "—" },
              { label: "Moeda", value: data?.caracteristicas_chave?.moeda ?? "—" },
              { label: "Índice de benchmark", value: data?.caracteristicas_chave?.benchmark ?? "—" }
            ]}
          />
        </SectionCard>

        {/* Rentabilidade */}
        <SectionCard
          id="rentabilidade"
          title="Rentabilidade"
          subtitle={`Tabela mensal (${data?.rentabilidade?.formato_mes ?? "MM/AAAA"}) e crescimento hipotético (base 100).`}
        >
          {/* Gráfico crescimento hipotético */}
          <div className="h-[320px] w-full rounded-xl border border-brand-navy/15 p-4">
            {crescimento.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                Sem dados para exibir o gráfico. Adicione linhas em “Rentabilidade → Tabela Mensal” no CMS.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={crescimento}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="fundoBase100" name="Fundo (Base 100)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="cdiBase100" name="CDI (Base 100)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabela mensal */}
          <div className="mt-6 overflow-hidden rounded-xl border border-brand-navy/15">
            <table className="w-full text-sm">
              <thead className="bg-brand-100/30">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">Mês</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Fundo (%)</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">CDI (%)</th>
                </tr>
              </thead>
              <tbody>
                {rentRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-600">
                      Nenhum registro ainda. Cadastre no CMS em: <b>Fundo • Página → Rentabilidade → Tabela Mensal</b>.
                    </td>
                  </tr>
                ) : (
                  rentRows.map((r, idx) => (
                    <tr key={idx} className="border-t border-brand-navy/10">
                      <td className="px-4 py-3 font-semibold text-slate-700">{r.mes}</td>
                      <td className="px-4 py-3 text-slate-700">{pct(r.fundo)}</td>
                      <td className="px-4 py-3 text-slate-700">{pct(r.cdi)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Portfólio */}
        <SectionCard
          id="portfolio"
          title="Características do portfólio"
          subtitle="Indicadores e repartições de exposição."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Table2Col
              rows={[
                { label: "Número de ativos na carteira", value: data?.caracteristicas_portfolio?.numero_ativos_carteira ?? "—" },
                { label: "Retorno 12m", value: data?.caracteristicas_portfolio?.retorno_12m ?? "—" },
                { label: "Volatilidade", value: data?.caracteristicas_portfolio?.volatilidade ?? "—" },
                { label: "Beta (Versus CDI)", value: data?.caracteristicas_portfolio?.beta ?? "—" },
                { label: "Sharpe", value: data?.caracteristicas_portfolio?.sharpe ?? "—" },
                { label: "Máximo drawdown", value: data?.caracteristicas_portfolio?.maximo_drawdown ?? "—" }
              ]}
            />

            <div className="rounded-xl border border-brand-navy/15 p-4">
              <div className="text-sm font-semibold text-brand-navy">Repartições da Exposição</div>

              <div className="mt-3 h-[280px] w-full">
                {exposicao.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-600">
                    Sem dados de exposição. Cadastre no CMS em: <b>Exposição → Itens</b>.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exposicao}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="setor" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={70} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="percentual" name="Percentual (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Taxas */}
        <SectionCard id="taxas" title="Taxas" subtitle="Conforme configuração do fundo.">
          <div className="overflow-hidden rounded-xl border border-brand-navy/15">
            <table className="w-full text-sm">
              <thead className="bg-brand-100/30">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">Nome</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Valor</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(data?.taxas) ? data.taxas : []).map((t, idx) => (
                  <tr key={idx} className="border-t border-brand-navy/10">
                    <td className="px-4 py-3 font-semibold text-slate-700">{t.nome}</td>
                    <td className="px-4 py-3 text-slate-700">{t.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Documentos */}
        <SectionCard
          id="documentos"
          title="Documentos"
          subtitle="Cards de download (mesmo padrão do Compliance)."
        >
          {docs.length === 0 ? (
            <div className="rounded-xl border border-brand-navy/15 bg-white p-5 text-sm text-slate-600">
              Nenhum documento cadastrado ainda. Cadastre no CMS em: <b>Documentos</b> (título + data + PDF).
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {docs.map((d, i) => (
                <DocCard key={i} titulo={d.titulo} data={d.data} pdf={d.pdf} />
              ))}
            </div>
          )}
        </SectionCard>

        {/* Rodapé pequeno */}
        <div className="pb-10 text-center text-xs text-slate-500">
          {data?.labels?.prospecto ?? "De acordo com o prospecto atual"}
        </div>
      </main>
    </div>
  );
}

function DocCard({ titulo, data, pdf }) {
  return (
    <article className="rounded-xl border border-brand-navy/15 bg-white p-5 shadow-sm hover:shadow-md transition">
      <h3 className="font-semibold text-brand-navy">{titulo}</h3>
      {data && <p className="mt-1 text-xs text-slate-500">{data}</p>}
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
