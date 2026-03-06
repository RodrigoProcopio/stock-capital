import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

import logoNovaFutura from "../assets/logos/nova-futura.png";
import logoSmartSave from "../assets/logos/smartsave.png";
import logoB3 from "../assets/logos/b3.png";
import logoStockCapital from "../assets/logos/stock-capital.png";
import logoANBIMA from "../assets/logos/anbima.png";
import logoCVM from "../assets/logos/cvm.png";

import FloatingWhatsApp from "../components/FloatingWhatsApp.jsx";
import ScrollToTopButton from "../components/ScrollToTopButton.jsx";

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
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
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

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(d)
      .replace(".", "");
  } catch {
    return dateStr;
  }
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

/* =========================
   UI COMPONENTS
========================= */

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
              Símbolo:{" "}
              <span className="font-semibold text-slate-ink">
                {data?.simbolo ?? "—"}
              </span>
              {" · "}
              <span className="font-semibold">
                {data?.labels?.benchmark ?? "Benchmark"}
              </span>
            </p>
          </div>

          <div
            className="
              flex flex-col items-center justify-center text-center
              rounded-xl border border-brand-navy/15 bg-gradient-to-br from-white to-brand-100/30
              px-6 py-4 min-w-[220px]
            "
          >
            <div className="text-xs text-slate-500">Taxa de Administração</div>
            <div className="text-2xl font-bold text-brand-navy">
              {topo?.taxa_administracao_destaque ?? "—"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {topo?.prospecto_label ?? data?.labels?.prospecto ?? ""}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <KpiCard
            title={
              vc?.label ||
              (vc?.data_referencia
                ? `Valor da Cota em ${formatDateBR(vc.data_referencia)}`
                : "Valor da Cota")
            }
            value={brl(vc?.valor)}
            meta={
              vc?.data_referencia ? `Ref.: ${formatDateBR(vc.data_referencia)}` : ""
            }
          />

          <KpiCard
            title={
              vari?.label ||
              (vari?.data_referencia
                ? `Variação da cota em ${formatDateBR(vari.data_referencia)}`
                : "Variação da cota")
            }
            value={pct(vari?.valor)}
            meta={
              vari?.data_referencia ? `Ref.: ${formatDateBR(vari.data_referencia)}` : ""
            }
          />

          <KpiCard
            title={
              rend?.label ||
              (rend?.data_referencia
                ? `Rendimento total da Cota em ${formatDateBR(rend.data_referencia)}`
                : "Rendimento total da Cota")
            }
            value={pct(rend?.valor)}
            meta={
              rend?.data_referencia ? `Ref.: ${formatDateBR(rend.data_referencia)}` : ""
            }
          />
        </div>

        {data?.avisos?.texto_principal && (
          <div className="mt-6 rounded-lg border border-brand-navy/10 bg-gray-50 px-4 py-3 text-[10px] leading-relaxed text-slate-500">
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
          {subtitle ? (
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          ) : null}
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
            <tr
              key={idx}
              className={cx(
                "border-b border-brand-navy/10",
                idx === rows.length - 1 && "border-b-0"
              )}
            >
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
      <div className="relative">
        <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-white to-transparent" />

        <div
          className="
            mx-auto flex max-w-6xl items-center gap-2
            overflow-x-auto scroll-smooth scrollbar-hide
            snap-x snap-mandatory
            px-6 py-3
          "
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cx(
                "whitespace-nowrap snap-start rounded-lg border px-2 py-1 text-sm font-semibold transition",
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
    </div>
  );
}

/* =========================
   PREMIUM DONUT (EXPOSIÇÃO)
========================= */

function ExposureDonutCard({ title = "Repartições da Exposição", items }) {
  const [showLegendMobile, setShowLegendMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const palette = [
    "#0f2a5f",
    "#2563eb",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6",
    "#64748b",
  ];

  function fmtPct(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return `${n.toFixed(n % 1 === 0 ? 0 : 1)}%`;
  }

  const data = useMemo(() => {
    const safe = Array.isArray(items) ? items : [];
    const cleaned = safe
      .map((x, idx) => ({
        name: x.setor ?? "—",
        value: Number(x.percentual ?? 0),
        color: palette[idx % palette.length],
      }))
      .filter((x) => Number.isFinite(x.value) && x.value > 0)
      .sort((a, b) => b.value - a.value);

    return { cleaned };
  }, [items]);

  function CustomTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
    return (
      <div className="rounded-lg border border-brand-navy/10 bg-white px-3 py-2 shadow-md">
        <div className="text-xs font-semibold text-slate-700">{p?.name}</div>
        <div className="mt-1 text-sm font-bold text-brand-navy">
          {fmtPct(p?.value)}
        </div>
      </div>
    );
  }

  const renderPercentLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props;
    const RADIAN = Math.PI / 180;

    const r = innerRadius + (outerRadius - innerRadius) * 0.62;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-[11px] font-extrabold"
      >
        {fmtPct(payload?.value)}
      </text>
    );
  };

  const renderActiveShape = (props) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          opacity={0.15}
        />
      </g>
    );
  };

  if (!data.cleaned.length) {
    return (
      <div className="rounded-2xl border border-brand-navy/10 p-6 bg-white">
        <div className="text-base font-semibold text-brand-navy text-center">
          {title}
        </div>
        <div className="mt-3 flex h-[220px] items-center justify-center text-sm text-slate-600">
          Sem dados de exposição.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-navy/15 bg-white p-4">
      <div className="text-base font-semibold text-brand-navy text-center">
        {title}
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />

              <Pie
                data={data.cleaned}
                dataKey="value"
                nameKey="name"
                innerRadius="50%"
                outerRadius="92%"
                paddingAngle={2}
                stroke="rgba(15, 42, 95, 0.08)"
                strokeWidth={1}
                isAnimationActive
                labelLine={false}
                label={renderPercentLabel}
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                {data.cleaned.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="md:block">
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setShowLegendMobile((s) => !s)}
              className="w-full rounded-lg border border-brand-navy/15 bg-white px-3 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-100/40"
            >
              {showLegendMobile ? "Ocultar legenda" : "Mostrar legenda"}
            </button>
          </div>

          <div
            className={[
              "mt-3 space-y-1.5",
              "md:mt-0 md:space-y-1.5",
              "md:max-h-[260px] md:overflow-auto md:pr-1",
              "md:[scrollbar-width:thin]",
              showLegendMobile ? "block" : "hidden md:block",
            ].join(" ")}
          >
            {data.cleaned.map((item, i) => (
              <div
                key={`${item.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-brand-navy/10 bg-white px-2 py-1.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 flex-none rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate text-xs text-slate-600">
                    {item.name}
                  </span>
                </div>
                <span className="flex-none text-xs font-semibold text-slate-700">
                  {fmtPct(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   PLATAFORMAS DE DISTRIBUIÇÃO
========================= */

function PlataformasDistribuicao({ plataformas = [] }) {
  return (
    <SectionCard
      id="plataformas"
      title="Invista por meio das plataformas de distribuição"
      subtitle="O Stock Capital Fundo de Investimento Financeiro Multimercado está disponível nas plataformas parceiras:"
    >
      <div className="flex flex-wrap justify-center gap-6">
        {plataformas.map((p, i) => (
          <a
            key={i}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="
              group w-[260px]
              rounded-xl border border-brand-navy/10 bg-white p-6
              flex items-center justify-center
              transition hover:shadow-md hover:border-brand-navy/20
            "
            aria-label={`Abrir ${p.name}`}
            title={p.name}
          >
            <div className="flex h-24 items-center justify-center">
              <img
                src={p.logo}
                alt={p.name}
                className={cx("w-auto object-contain", p.imgClass || "h-16")}
                loading="lazy"
                decoding="async"
              />
            </div>
          </a>
        ))}
      </div>
    </SectionCard>
  );
}

/* =========================
   INSTITUIÇÕES (LOGO CARDS)
========================= */

function LogoCard({ label, src, alt, imgClass = "h-14" }) {
  return (
    <div className="rounded-xl border border-brand-navy/10 bg-white p-4 text-center">
      <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase text-center">
        {label}
      </div>
      <div className="mt-4 flex h-24 w-full items-center justify-center">
        <img
          src={src}
          alt={alt}
          className={cx("w-auto object-contain", imgClass)}
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

function DocCard({ titulo, data, pdf }) {
  return (
    <article
      className="
        flex h-full min-h-[170px] flex-col justify-between
        rounded-xl border border-brand-navy/15 bg-white p-5 shadow-sm
        transition hover:shadow-md
      "
    >
      <div>
        <h3 className="font-semibold text-brand-navy line-clamp-2">{titulo}</h3>
        {data && <p className="mt-1 text-xs text-slate-500">{data}</p>}
      </div>

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

/* =========================
   PAGE
========================= */

export default function FundoInvestimento() {
  const data = fundo;

  const tabs = useMemo(
    () => [
      { id: "visao-geral", label: "Visão geral" },
      { id: "objetivo", label: "Objetivo do Fundo" },
      { id: "perfil-investidor", label: "Perfil do Investidor" },
      { id: "rentabilidade", label: "Rentabilidade" },
      { id: "portfolio", label: "Portfólio" },
      { id: "taxas", label: "Taxas" },
      { id: "plataformas", label: "Onde Investir" },
      { id: "documentos", label: "Documentos" },
      { id: "instituicoes", label: "Instituições" },
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
    const rows = Array.isArray(data?.rentabilidade?.tabela_mensal)
      ? data.rentabilidade.tabela_mensal
      : [];
    return [...rows].sort(
      (a, b) => parseMesToSortable(b.mes) - parseMesToSortable(a.mes)
    );
  }, [data]);

  const rentChartRows = useMemo(() => {
    const rows = Array.isArray(data?.rentabilidade?.tabela_mensal)
      ? data.rentabilidade.tabela_mensal
      : [];

    return [...rows]
      .sort((a, b) => parseMesToSortable(a.mes) - parseMesToSortable(b.mes))
      .map((r) => ({
        mes: r.mes,
        fundo: Number(r.fundo ?? 0),
        cdi: Number(r.cdi ?? 0),
      }));
  }, [data]);

  const visibleRentRows = useMemo(() => {
    return rentRows.slice(0, 12);
  }, [rentRows]);

  const hasMoreThan12Rows = rentRows.length > 12;

  const exposicao = useMemo(() => {
    const items = Array.isArray(data?.exposicao?.itens)
      ? data.exposicao.itens
      : [];
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
      const da = a?.data ? a.data.split("/").reverse().join("-") : "";
      const db = b?.data ? b.data.split("/").reverse().join("-") : "";
      if (!da || !db) return 0;
      return db.localeCompare(da);
    });
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 text-slate-ink">
      <header className="border-b border-brand-navy/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label="Voltar para Home"
          >
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

      <Tabs tabs={tabs} activeId={active} onSelect={go} />

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <FundHeader data={data} />

        <SectionCard
          id="visao-geral"
          title="Características-chave"
          subtitle="Informações gerais do fundo."
        >
          <Table2Col
            rows={[
              {
                label: "Patrimônio líquido do fundo",
                value: data?.caracteristicas_chave?.patrimonio_liquido ?? "—",
              },
              { label: "Bolsa", value: data?.caracteristicas_chave?.bolsa ?? "—" },
              {
                label: "Classe de ativos",
                value: data?.caracteristicas_chave?.classe_de_ativos ?? "—",
              },
              {
                label: "Código CVM",
                value: data?.caracteristicas_chave?.codigo_cvm ?? "—",
              },
              {
                label: "Domicílio",
                value: data?.caracteristicas_chave?.domicilio ?? "—",
              },
              {
                label: "Data de constituição",
                value: data?.caracteristicas_chave?.data_constituicao ?? "—",
              },
              { label: "Moeda", value: data?.caracteristicas_chave?.moeda ?? "—" },
              {
                label: "Índice de benchmark",
                value: data?.caracteristicas_chave?.benchmark ?? "—",
              },
            ]}
          />
        </SectionCard>

        <SectionCard id="objetivo" title="Objetivo do Fundo">
          <p className="text-sm leading-relaxed text-slate-700">
            Proporcionar retornos consistentes ajustados ao risco no médio e longo prazo,
            por meio de uma estratégia multimercado dinâmica e altamente diversificada,
            com baixa correlação estrutural em relação às estratégias tradicionais.
          </p>
        </SectionCard>

        <SectionCard id="perfil-investidor" title="Perfil do Investidor">
          <p className="text-sm leading-relaxed text-slate-700">
            Investidores que buscam rentabilidade superior ao CDI no médio e longo prazo,
            com tolerância a volatilidade moderada/alta e interesse em exposição diversificada
            a setores disruptivos e tradicionais.
          </p>
        </SectionCard>

        <SectionCard
          id="rentabilidade"
          title="Rentabilidade"
          subtitle="Tabela mensal (MM/AAAA) e crescimento hipotético (%)"
        >
          <div className="h-[320px] w-full rounded-xl border border-brand-navy/15 p-4">
            {rentChartRows.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-600">
                Sem dados para exibir o gráfico. Adicione linhas em “Rentabilidade → Tabela Mensal” no CMS.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
  <LineChart data={rentChartRows}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip formatter={(value) => pct(value)} />
    <Legend />

    <Line
      type="monotone"
      dataKey="fundo"
      name="Fundo (%)"
      stroke="#3b82f6"
      strokeWidth={2.5}
      dot={false}
      activeDot={{ r: 5 }}
    />

    <Line
      type="monotone"
      dataKey="cdi"
      name="CDI (%)"
      stroke="#0f2a5f"
      strokeWidth={2.5}
      dot={false}
      activeDot={{ r: 5 }}
    />
  </LineChart>
</ResponsiveContainer>
            )}
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-brand-navy/15">
            <div
              className={cx(
                "overflow-y-auto",
                hasMoreThan12Rows ? "max-h-[565px]" : ""
              )}
            >
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-brand-100/30">
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
                        Nenhum registro ainda. Cadastre no CMS em:{" "}
                        <b>Fundo • Página → Rentabilidade → Tabela Mensal</b>.
                      </td>
                    </tr>
                  ) : (
                    rentRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className={cx(
                          "border-t border-brand-navy/10",
                          idx >= visibleRentRows.length ? "opacity-100" : ""
                        )}
                      >
                        <td className="px-4 py-3 font-semibold text-slate-700">{r.mes}</td>
                        <td className="px-4 py-3 text-slate-700">{pct(r.fundo)}</td>
                        <td className="px-4 py-3 text-slate-700">{pct(r.cdi)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {hasMoreThan12Rows && (
            <p className="mt-3 text-xs text-slate-500">
              Exibindo os 12 meses mais recentes primeiro. Role a tabela para visualizar os períodos anteriores.
            </p>
          )}
        </SectionCard>

        <SectionCard
          id="portfolio"
          title="Características do portfólio"
          subtitle="Indicadores e repartições de exposição."
        >
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] items-start">
            <Table2Col
              rows={[
                {
                  label: "Número de ativos na carteira",
                  value: data?.caracteristicas_portfolio?.numero_ativos_carteira ?? "—",
                },
                { label: "Retorno 12m", value: data?.caracteristicas_portfolio?.retorno_12m ?? "—" },
                { label: "Volatilidade", value: data?.caracteristicas_portfolio?.volatilidade ?? "—" },
                { label: "Beta (Versus CDI)", value: data?.caracteristicas_portfolio?.beta ?? "—" },
                { label: "Sharpe", value: data?.caracteristicas_portfolio?.sharpe ?? "—" },
                { label: "Máximo drawdown", value: data?.caracteristicas_portfolio?.maximo_drawdown ?? "—" },
              ]}
            />

            <ExposureDonutCard items={exposicao} />
          </div>
        </SectionCard>

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

        <PlataformasDistribuicao
          plataformas={[
            {
              name: "Nova Futura",
              logo: logoNovaFutura,
              href: "https://www.novafutura.com.br/",
              imgClass: "h-48",
            },
          ]}
        />

        <SectionCard id="documentos" title="Documentos">
          {docs.length === 0 ? (
            <div className="rounded-xl border border-brand-navy/15 bg-white p-5 text-sm text-slate-600">
              Nenhum documento cadastrado ainda.
            </div>
          ) : (
            <div className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
              {docs.map((d, i) => (
                <DocCard key={i} titulo={d.titulo} data={d.data} pdf={d.pdf} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          id="instituicoes"
          title="Instituições"
          subtitle="Administração, gestão, custódia e registros relacionados ao fundo."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <LogoCard label="ADMINISTRADORA E DISTRIBUIDORA" src={logoNovaFutura} alt="Nova Futura" imgClass="h-48" />
            <LogoCard label="GESTORA DE RECURSOS" src={logoSmartSave} alt="SmartSave" imgClass="h-12" />
            <LogoCard label="BANCO CUSTODIANTE" src={logoB3} alt="B3" imgClass="h-24" />
            <LogoCard label="CONSULTOR DE VALORES MOBILIÁRIOS" src={logoStockCapital} alt="Stock Capital" imgClass="h-16" />
            <LogoCard label="ANBIMA" src={logoANBIMA} alt="ANBIMA" imgClass="h-16" />
            <LogoCard label="CVM" src={logoCVM} alt="CVM" imgClass="h-16" />
          </div>
        </SectionCard>
      </main>

      <FloatingWhatsApp />
      <ScrollToTopButton />

      <footer className="border-t border-brand-navy/10 bg-brand-primary py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-white/90">
          © {new Date().getFullYear()} Stock Capital MFO — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
