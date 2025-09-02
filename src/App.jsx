import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import heroImg from "./assets/hero.webp";
import logo from "./assets/logo.png";
import augustoImg from "./assets/augusto.webp";
import igorImg from "./assets/igor.webp";
import ScrollToTopButton from "./components/ScrollToTopButton";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import DesempenhoChart from "./components/DesempenhoChart";


/**
 * ------------------------------
 * Navegação principal
 * ------------------------------
 * Lista de seções presentes na página. Os ids devem existir no DOM
 * para que o scroll spy funcione corretamente.
 */
const NAV = [
  { id: "home", label: "Home" },
  { id: "quem-somos", label: "Quem Somos" },
  { id: "nossa-equipe", label: "Nossa Equipe" },
  { id: "nossa-filosofia", label: "Nossa Filosofia" },
  { id: "multi-family-office", label: "Multi Family Office" },
  { id: "governanca", label: "Governança" },
  { id: "publicacoes", label: "Publicações" },
  { id: "formulario-api", label: "Formulário de API" },
  { id: "contato", label: "Contato" },
];

// Imagem de fundo do HERO (separado para facilitar troca futura)
const HERO_BG = heroImg;

/**
 * Utilitário simples para compor classes condicionalmente
 */
function cx(...c) {
  return c.filter(Boolean).join(" ");
}

/**
 * Componente principal da página.
 * - Header "auto-hide" ao rolar para baixo
 * - Menu hambúrguer sempre visível
 * - Scroll spy para destacar a seção ativa
 * - Navegação com smooth scroll para âncoras
 */
export default function App() {
  // Estado: controle do drawer do menu
  const [menuOpen, setMenuOpen] = useState(false);
  // Estado: seção ativa com base no scroll
  const [active, setActive] = useState("home");
  // Ref: última posição Y, para detectar direção do scroll
  const lastY = useRef(0);
  // Estado: esconde/mostra o header conforme direção do scroll
  const [hideHeader, setHideHeader] = useState(false);

  /**
   * Scroll spy + auto-hide header
   * - Define comportamento "smooth" para scroll do documento
   * - Atualiza a seção ativa de acordo com a posição no viewport
   * - Esconde o header quando o usuário rola para baixo
   */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHideHeader(y > lastY.current && y > 64);
      lastY.current = y;

      // Inclui NAV e possíveis filhos (caso a estrutura seja expandida no futuro)
      const sections = NAV.flatMap((n) => (n.children ? [n, ...n.children] : [n]));
      let nearest = "home";
      let min = Infinity;

      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const top = Math.abs(el.getBoundingClientRect().top);
        if (top < min) {
          min = top;
          nearest = s.id;
        }
      }
      setActive(nearest);
    };

    // Ativa smooth scroll globalmente enquanto o componente estiver montado
    const root = document.documentElement;
    const prevBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "smooth";

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      root.style.scrollBehavior = prevBehavior || "auto";
    };
  }, []);

  /**
   * Navega para a seção informada e atualiza o hash da URL.
   */
  const goTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-ink">
      {/* Header (auto-hide) */}
      <header
        className={cx(
          "sticky top-0 z-50 border-b border-brand-navy/10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-transform",
          hideHeader ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="flex w-full items-center justify-between px-6 py-3">
          {/* Logo como botão para voltar ao início */}
          <button
            onClick={() => goTo("home")}
            className="flex items-center gap-3"
            aria-label="Ir para início"
          >
            <img src={logo} alt="Logo Stock Capital MFO" className="h-20 w-auto" />
          </button>

          {/* Botão hambúrguer (sempre visível) */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cx(
              "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-navy/15",
              menuOpen ? "bg-white" : "bg-white"
            )}
            aria-label="Abrir menu"
            aria-expanded={menuOpen}
            aria-controls="main-menu"
          >
            <div className="pointer-events-none">
              <span
                className={cx(
                  "block h-[2px] w-6 transition-all",
                  menuOpen ? "translate-y-[6px] rotate-45 bg-brand-navy" : "-translate-y-1.5 bg-ink"
                )}
              />
              <span className={cx("my-1 block h-[2px] w-6 bg-ink transition-opacity", menuOpen && "opacity-0")} />
              <span
                className={cx(
                  "block h-[2px] w-6 transition-all",
                  menuOpen ? "-translate-y-[6px] -rotate-45 bg-brand-navy" : "translate-y-1.5 bg-ink"
                )}
              />
            </div>
          </button>
        </div>

        {/* Drawer do menu */}
        {menuOpen && (
          <nav id="main-menu" className="border-t border-brand-navy/10 bg-brand-100/70">
            <ul className="grid w-full gap-1 px-6 py-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {NAV.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => goTo(item.id)}
                    className={cx(
                      "w-full rounded-lg px-4 py-2 text-left text-sm font-semibold hover:bg-white hover:text-brand-navy",
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>

{/* HERO */}
<section id="home" className="relative">
  <div
    className="relative h-screen min-h-[640px] w-full overflow-hidden"
    style={{
      backgroundImage: `url(${HERO_BG})`,
      backgroundSize: "cover",
      backgroundPosition: "center bottom",
      backgroundRepeat: 'no-repeat'
    }}
  >
    {/* Overlay com transparência */}
    <div className="absolute inset-0 bg-brand-primary/60" />

    {/* Conteúdo centralizado */}
    <div className="relative z-10 flex h-full w-full items-center justify-center px-4 text-center text-white">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold md:text-5xl text-white drop-shadow-lg">
          Gerenciamos patrimônios com excelência para construir o mundo ao nosso redor.
        </h1>

       {/* Botão Fale Conosco */}
<div className="mt-8 flex justify-center hover:-translate-y-0.5">
  <a
    href="https://wa.me/554100000000?text=Olá! Gostaria de saber mais sobre os serviços da Stock Capital."
    target="_blank"
    rel="noopener noreferrer"
    className="mt-6 rounded-xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white 
               shadow-sm transition hover:bg-brand-primary"
  >
    Fale Conosco
  </a>
</div>
      </div>
    </div>
  </div>
</section>
      <MainContainer>

        {/* Nosso Propósito */}
        <Section id="nosso-proposito" title="Nosso Propósito" subtitle="">
          <p className="text-justify">
            Na <strong>Stock Capital Multi Family Office</strong>, gerimos patrimônios com excelência,
            conectando crescimento, proteção e propósito. Acreditamos que um patrimônio bem administrado vai além dos
            resultados financeiros: ele constrói legados, fortalece vínculos familiares e transforma o ambiente em que
            vivemos. Com independência, técnica e visão de longo prazo, estruturamos soluções patrimoniais que integram
            rentabilidade, segurança e impacto positivo para as próximas gerações.
          </p>
        </Section>

        {/* Quem Beneficiamos */}
        <Section id="para-quem-atuamos" title="Quem Beneficiamos" subtitle="">
          <p className="text-justify">
            Nossas soluções atendem famílias e indivíduos que compartilham a visão de construir e preservar legados
            duradouros:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-justify text-slate-ink">
            <li>Pessoas iniciando sua trajetória financeira e que buscam orientação especializada;</li>
            <li>Estruturas familiares que necessitam de planejamento jurídico, fiscal e sucessório sólido;</li>
            <li>Famílias com patrimônio consolidado;</li>
            <li>Investidores que desejam diversificação internacional e acesso a ativos sofisticados;</li>
            <li>Estruturas societárias complexas que demandam gestão estratégica.</li>
          </ul>
        </Section>

        {/* Quem Somos */}
        <Section id="quem-somos" title="Quem Somos" subtitle="">
          <p className="text-justify">
            Atuamos com total independência na construção de estratégias financeiras, sucessórias e fiduciárias para
            famílias e investidores que desejam preservar e expandir seu patrimônio com governança e sofisticação. Nossa
            abordagem combina:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-justify text-slate-ink">
            <li>Independência absoluta, sem vínculo com bancos ou produtos;</li>
            <li>Transparência e alinhamento, com modelo de remuneração claro;</li>
            <li>
              Atuação multidisciplinar, com profissionais experientes em finanças, direito, sucessão e investimentos de
              impacto.
            </li>
          </ul>
        </Section>

        {/* Nossa Filosofia */}
        <Section id="nossa-filosofia" title="Nossa Filosofia" subtitle="">
          <p className="text-justify">
            Nossa filosofia de investimentos combina resiliência, inovação e impacto. Construímos carteiras com visão de
            longo prazo, que conciliam retorno financeiro e responsabilidade socioambiental.
          </p>

          <p className="mt-4 text-justify">Nosso modelo de investimento abrange:</p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-justify text-slate-ink">
            <li>Alocação estratégica e tática de ativos;</li>
            <li>Integração de critérios ESG e impacto mensurável;</li>
            <li>
              Acesso a fundos globais e ativos alternativos (Private Equity, Real Estate, Venture Capital, Crédito
              Estruturado);
            </li>
            <li>Gestão de risco e acompanhamento contínuo de performance.</li>
          </ul>
        </Section>

{/* Nossa Equipe */}
<Section id="nossa-equipe" title="Nossa Equipe">
  <div className="flex flex-wrap justify-center gap-12">
    {/* Card 1 */}
    <div className="flex flex-col items-center text-center">
      <div className="relative h-74 w-64 rounded-2xl overflow-hidden">
        <img
          src={augustoImg}
          alt="Augusto Lubian"
          className="h-full w-full object-cover"
        />
        {/* overlay branco por cima da foto */}
        <div className="absolute inset-0 bg-white/25" />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-brand-navy">
          Augusto Lubian <span className="font-normal">| CDAA, PQO</span>
        </h3>
        <p className="text-sm text-slate-600">CEO</p>
      </div>
    </div>

    {/* Card 2 */}
    <div className="flex flex-col items-center text-center">
      <div className="relative h-74 w-64 rounded-2xl overflow-hidden">
        <img
          src={igorImg}
          alt="Igor Dudeque Luiz da Costa"
          className="h-full w-full object-cover"
        />
        {/* overlay branco por cima da foto */}
        <div className="absolute inset-0 bg-white/25" />
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-brand-navy">
          Igor Dudeque <span className="font-normal">| CEA®, Behavioural Finance</span>
        </h3>
        <p className="text-sm text-slate-600">Director of Investments Strategies</p>
      </div>
    </div>
  </div>
</Section>

        {/* seção de desempenho */}
        <section id="desempenho" className="pt-20 pb-64">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="h-[420px]">
      <DesempenhoChart />
    </div>
  </div>
</section>

        {/* Multi Family Office (cards com overlay local) */}
        <Section id="multi-family-office" title="Multi Family Office">
          <ServiceCards
            cols="3"
            items={[
              {
                title: "Consultoria financeira especializada",
                desc: "Assessoria estratégica e independente para estruturar, proteger e expandir o patrimônio familiar, com soluções personalizadas alinhadas aos objetivos de cada cliente.",
              },
              {
                title: "Administração de Patrimônio",
                desc: "Gestão integrada de bens, ativos e investimentos, garantindo eficiência, preservação e crescimento sustentável do patrimônio no longo prazo.",
              },
              {
                title: "Administração de Portfólio",
                desc: "Elaboração e acompanhamento de carteiras de investimento diversificadas, com foco em performance, liquidez e alinhamento ao perfil de risco da família.",
              },
              {
                title: "Mapeamento e consolidação de ativos",
                desc: "Organização e centralização das informações patrimoniais, permitindo uma visão clara e estratégica do conjunto de ativos.",
              },
              {
                title: "Planejamento jurídico, fiscal e sucessório",
                desc: "Estruturação de estratégias legais e tributárias que asseguram eficiência fiscal, proteção patrimonial e continuidade do legado familiar.",
              },
              {
                title: "Constituição de holdings, trusts e estruturas fiduciárias",
                desc: "Implementação de veículos societários e fiduciários para organização patrimonial, proteção de ativos e planejamento sucessório internacional.",
              },
              {
                title: "Governança familiar com foco em continuidade",
                desc: "Desenvolvimento de práticas e estruturas de governança que fortalecem a união familiar e garantem a perenidade do patrimônio ao longo das gerações.",
              },
              { title: "BPO Financeiro", 
                desc: "Terceirização completa da gestão financeira pessoal e empresarial, com controle, eficiência e confidencialidade em cada processo."
              },
              {
                title: "Relatórios periódicos e suporte operacional",
                desc: "Produção de relatórios claros e objetivos, aliados a suporte contínuo, para tomada de decisão ágil e fundamentada.",
              },
            ]}
          />
        </Section>

        {/* Governança e Confiança */}
        <Section id="governanca" title="Governança e Confiança" subtitle="">
          <p className="text-justify">
            A governança é o eixo central da nossa atuação. Gerimos com rigor, sigilo e metodologia. Processos
            institucionais, decisões fundamentadas e ética inegociável sustentam cada ação, refletindo o compromisso com
            a confiança depositada por nossos clientes. Nossa governança se destaca por:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-justify text-slate-ink">
            <li>Estrutura fiduciária com comitês internos e processos auditáveis;</li>
            <li>Política de prevenção a conflitos de interesse;</li>
            <li>Compliance contínuo e acompanhamento regulatório;</li>
            <li>Relatórios gerenciais e reuniões periódicas de alinhamento com os clientes.</li>
          </ul>
        </Section>

        {/* Sustentabilidade e Impacto */}
        <Section id="sustentabilidade" title="Sustentabilidade e Impacto" subtitle="">
          <p className="text-justify">
            Todo investimento molda o mundo – por isso, seu patrimônio pode transformar realidades. Acreditamos na união
            entre prosperidade e propósito, incorporando impacto ao planejamento de capital sem comprometer o desempenho.
            As diretrizes que norteiam nossas decisões são:
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-6 text-justify text-slate-ink">
            <li>Investimentos temáticos em mudanças climáticas, educação, saúde e tecnologia limpa;</li>
            <li>Curadoria rigorosa de fundos com mandatos ESG e impacto direto;</li>
            <li>Estruturação de capital catalítico;</li>
            <li>Avaliação e reporte de impacto ambiental e social.</li>
          </ul>
        </Section>

        {/* Publicações */}
        <Section id="publicacoes" title="Publicações" subtitle="Análises e materiais proprietários.">
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/publicacoes/cartas" className="block rounded-2xl border border-brand-navy/15 bg-white p-6 shadow hover:shadow-md text-center hover:-translate-y-1 hover:shadow-lg hover:border-brand-navy/30
             transition-all duration-200" >
              <h3 className="text-lg font-semibold text-brand-navy">Cartas</h3>
              <p className="mt-2 text-slate-600">Cartas periódicas com visão de mercado e posicionamento.</p>
              <span className="mt-4 inline-block text-sm font-medium text-brand-navy hover:underline">Ver mais →</span>
            </Link>

            <Link to="/publicacoes/relatorios" className="block rounded-2xl border border-brand-navy/15 bg-white p-6 shadow hover:shadow-md text-center hover:-translate-y-1 hover:shadow-lg hover:border-brand-navy/30
             transition-all duration-200">
              <h3 className="text-lg font-semibold text-brand-navy">Relatórios</h3>
              <p className="mt-2 text-slate-600">Materiais aprofundados, macro, setores e classes de ativos.</p>
              <span className="mt-4 inline-block text-sm font-medium text-brand-navy hover:underline">Ver mais →</span>
            </Link>

            <Link to="/publicacoes/insights" className="block rounded-2xl border border-brand-navy/15 bg-white p-6 shadow hover:shadow-md text-center hover:-translate-y-1 hover:shadow-lg hover:border-brand-navy/30
             transition-all duration-200">
              <h3 className="text-lg font-semibold text-brand-navy">Insights</h3>
              <p className="mt-2 text-slate-600">Notas rápidas e estudos sobre temas relevantes.</p>
              <span className="mt-4 inline-block text-sm font-medium text-brand-navy hover:underline">Ver mais →</span>
            </Link>

            <Link to="/publicacoes/compliance" className="block rounded-2xl border border-brand-navy/15 bg-white p-6 shadow hover:shadow-md text-center hover:-translate-y-1 hover:shadow-lg hover:border-brand-navy/30
             transition-all duration-200">
              <h3 className="text-lg font-semibold text-brand-navy">Compliance</h3>
              <p className="mt-2 text-slate-600">Documentos e políticas de conformidade e ética.</p>
              <span className="mt-4 inline-block text-sm font-medium text-brand-navy hover:underline">Ver mais →</span>
            </Link>
          </div>
        </Section>

        {/* Formulário de API */}
        <Section
          id="formulario-api"
          title="Formulário de API"
          subtitle="Descubra seu perfil de investidor preenchendo nosso questionário de suitability."
        >
          <div className="flex justify-center">
            <Link
              to="/formulario-api"
              className="rounded-xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white hover:bg-brand-navy/90 hover:shadow-md transition-all duration-200"
            >
              Preencher formulário
            </Link>
          </div>
        </Section>
        </MainContainer>

        {/* Contato */}
      <section
  id="contato"
  className="scroll-mt-24 bg-brand-primary border-t border-brand-navy/10 py-24"
>
  {/* wrapper para centralizar o conteúdo, igual ao resto do site */}
  <div className="mx-auto max-w-7xl px-4">
    <div className="mb-12 text-center text-white">
      <h2 className="text-3xl font-semibold text-white">Contato</h2>
      <p className="mt-1">Fale com nossa equipe.</p>
    </div>

    <div className="grid gap-10 md:grid-cols-2 items-start text-white">
      {/* coluna: informações */}
      <div className="space-y-8">
        {/* Endereço */}
        <div className="flex items-start gap-4">
          <svg className="h-6 w-6 text-white mt-1" viewBox="0 0 24 24" fill="none">
            <path d="M12 21s7-5.33 7-11a7 7 0 10-14 0c0 5.67 7 11 7 11z" stroke="currentColor" strokeWidth="1.8"/>
            <circle cx="12" cy="10" r="2.8" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <div>
            <h3 className="font-semibold text-white">Endereço</h3>
            <p className="text-white/80">
              Rua Exemplo, 123 — Cidade/UF<br/>CEP 00000-000
            </p>
          </div>
        </div>

        {/* E-mail */}
        <div className="flex items-start gap-4">
          <svg className="h-6 w-6 text-white mt-1" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <div>
            <h3 className="font-semibold text-white">E-mail</h3>
            <p className="text-white/80">contato@stockcapital.com.br</p>
          </div>
        </div>

        {/* Telefone */}
        <div className="flex items-start gap-4">
          <svg className="h-6 w-6 text-white mt-1" viewBox="0 0 24 24" fill="none">
            <path d="M22 16.92v2a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.92 4.2 2 2 0 014.86 2h2a2 2 0 012 1.72c.1.76.27 1.5.5 2.21a2 2 0 01-.45 2.11L8 9a16 16 0 006 6l.95-.91a2 2 0 012.11-.45c.71.23 1.45.4 2.21.5A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <div>
            <h3 className="font-semibold text-white">Telefone</h3>
            <p className="text-white/80">(41) 0000-0000</p>
          </div>
        </div>
      </div>

{/* coluna: formulário */}
<form
  onSubmit={async (e) => {
    e.preventDefault();
  
    const formEl = e.currentTarget;
    const nome = formEl.querySelector('input[name="nome"]').value;
    const telefone = formEl.querySelector('input[name="telefone"]').value;
    const email = formEl.querySelector('input[name="email"]').value;
    const mensagem = formEl.querySelector('textarea[name="mensagem"]').value;
    const hp = formEl.querySelector('input[name="hp"]').value || "";
    const lgpdChecked = formEl.querySelector('input[name="lgpd"]').checked;
  
    if (!lgpdChecked) {
      setToast({
        open: true,
        variant: "warning",
        message: "Para enviar, é necessário aceitar a LGPD e o compartilhamento dos dados pessoais.",
      });
      return;
    }
  
    try {
      const res = await fetch("/.netlify/functions/send-contact-to-pipefy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, email, mensagem, hp }),
      });
  
      let json = {};
      try { json = await res.json(); }
      catch {
        const txt = await res.text().catch(() => "");
        json = { raw: txt };
      }
  
      if (res.ok && json.ok) {
        setToast({ open: true, variant: "success", message: "Mensagem enviada com sucesso!" });
        formEl.reset();
        return;
      }
  
      if (res.status === 400 && json?.error === "Campos obrigatórios ausentes.") {
        setToast({ open: true, variant: "warning", message: `Preencha: ${json.missing?.join(", ")}` });
        return;
      }
  
      if (res.status === 400 && json?.error === "Alguns valores não correspondem às opções do Pipefy.") {
        setToast({ open: true, variant: "warning", message: "Alguns valores não correspondem às opções do Pipefy." });
        console.warn(json.detail);
        return;
      }
  
      if (res.status === 502 && json?.error === "Falha ao criar card no Pipefy") {
        setToast({ open: true, variant: "error", message: json.message || "Falha ao criar card no Pipefy." });
        console.error(json.detail);
        return;
      }
  
      if (res.status === 500 && json?.error === "Erro interno") {
        setToast({ open: true, variant: "error", message: "Erro interno. Tente novamente." });
        console.error(json.detail);
        return;
      }
  
      setToast({ open: true, variant: "error", message: "Não foi possível enviar. Tente novamente." });
      console.error(res.status, json);
    } catch (err) {
      setToast({ open: true, variant: "error", message: "Erro de rede. Verifique sua conexão." });
      console.error(err);
    }
  }}
  
  className="rounded-2xl border border-brand-100/15 bg-white p-6 shadow-subtle"
>
  <h3 className="text-base font-semibold text-brand-navy">Envie uma mensagem</h3>

  {/* honeypot escondido (anti-spam) */}
  <input type="text" name="hp" className="hidden" tabIndex="-1" autoComplete="off" />

  <div className="mt-4 grid gap-4">
    <input
      type="text"
      name="nome"
      required
      className="rounded-lg border border-brand-navy/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30 text-brand-navy"
      placeholder="Nome"
    />
    <input
      type="tel"
      name="telefone"
      required
      className="rounded-lg border border-brand-navy/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30 text-brand-navy"
      placeholder="Telefone"
    />
    <input
      type="email"
      name="email"
      required
      className="rounded-lg border border-brand-navy/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30 text-brand-navy"
      placeholder="E-mail"
    />
    <textarea
      name="mensagem"
      rows={5}
      required
      className="rounded-lg border border-brand-navy/20 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30 text-brand-navy"
      placeholder="Mensagem"
    />

    {/* Aceite LGPD */}
    <label className="flex items-start gap-3 rounded-lg border border-brand-navy/15 bg-white/80 px-3 py-3">
      <input
        type="checkbox"
        name="lgpd"
        required
        className="mt-1 h-4 w-4 rounded border-brand-navy/40 text-brand-navy focus:ring-brand-navy/40"
      />
      <span className="text-sm text-brand-navy/90">
        Autorizo o tratamento e o compartilhamento dos meus dados pessoais para fins de contato e atendimento,
        conforme a LGPD. <a href="/politica-de-privacidade" className="underline hover:opacity-80">Saiba mais</a>.
      </span>
    </label>

    <button
      type="submit"
      className="mt-2 w-full rounded-xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white 
         shadow-sm transition-all duration-300
         hover:bg-brand-primary hover:-translate-y-0.5 hover:shadow-md"
    >
      Enviar
    </button>
  </div>
</form>

    </div>
  </div>
</section>

      {/* Rodapé */}
      <footer className="border-t border-brand-navy/10 bg-brand-primary py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-white/90">
          © {new Date().getFullYear()} Stock Capital MFO — Todos os direitos reservados.
        </div>
      </footer>

      {/* Botão de voltar ao topo */}
      <FloatingWhatsApp />
      <ScrollToTopButton />
    </div>
  );
}

/**
 * Container principal de conteúdo (limita largura e aplica padding horizontal)
 */
function MainContainer({ children }) {
  return <main className="mx-auto max-w-7xl px-4">{children}</main>;
}

/**
 * Section padrão
 * - Cria um bloco com título, subtítulo opcional e conteúdo
 * - Usa scroll-mt para compensar o header fixo ao navegar por âncora
 */
function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-brand-navy/10 bg-gray-50 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold text-brand-navy">{title}</h2>
        {subtitle && <p className="mt-1 max-w-3xl mx-auto text-center [text-wrap:balance]">{subtitle}</p>}
      </div>
      <div className="grid gap-2 text-justify">{children}</div>
    </section>
  );
}

/**
 * Lista de serviços em cards com overlay local para exibir descrição detalhada.
 */
function ServiceCards({ items = [], cols = "3" }) {
  const [openIndex, setOpenIndex] = React.useState(null);

  const grid =
    cols === "2" ? "md:grid-cols-2" : cols === "4" ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3";

  // Fecha o overlay ao pressionar ESC quando estiver aberto
  React.useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => e.key === "Escape" && setOpenIndex(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  return (
    <div className="relative ">
      {/* Grid de cards */}
      <div className={cx("grid gap-4 ", grid)}>
        {items.map((it, i) => (
          <ServiceCard key={i} title={it.title} onOpen={() => setOpenIndex(i)} />
        ))}
      </div>

      {/* Overlay LOCAL (cobre apenas esta seção) */}
      {openIndex !== null && (
        <div className="absolute inset-0 z-20 ">
          {/* backdrop */}
          <button
            onClick={() => setOpenIndex(null)}
            className="absolute inset-0 w-full h-full bg-black/25 backdrop-blur-[1px] "
            aria-label="Fechar"
          />
          {/* painel central */}
          <div className="absolute left-1/2 top-12 -translate-x-1/2 z-30 w-full max-w-xl px-4">
            <div
              className="rounded-2xl bg-white p-6 shadow-xl border border-brand-navy/10 "
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h3 className="text-lg font-semibold text-brand-navy">{items[openIndex].title}</h3>
              <p className="mt-3 text-slate-700">{items[openIndex].desc}</p>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setOpenIndex(null)}
                  className="rounded-lg border border-brand-navy/20 px-4 py-2 text-sm hover:bg-black/5"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Card "clicável" para abrir detalhes do serviço no overlay local.
 */
function ServiceCard({ title, onOpen }) {
  return (
    <article className="rounded-xl border border-brand-navy/15 bg-white shadow-sm
    hover:-translate-y-1 hover:shadow-md hover:border-brand-navy/30
    transition-all duration-200 h-20 flex">
      <button onClick={onOpen} className="w-full px-5 text-left flex items-center" aria-haspopup="dialog">
        <h3 className="text-base font-semibold text-slate-ink">{title}</h3>
      </button>
    </article>
  );
}

/**
 * Grade genérica de cards (não utilizada em todas as seções).
 */
function Cards({ items = [], cols = "3" }) {
  const grid = cols === "2" ? "md:grid-cols-2" : cols === "4" ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={cx("grid gap-4", grid)}>
      {items.map((c, i) => (
        <Card key={i} title={c.title} desc={c.desc} />
      ))}
    </div>
  );
}

/**
 * Card genérico para uso com a grade de cards.
 */
function Card({ title, desc, anchorId }) {
  return (
    <article
      id={anchorId}
      className="h-full rounded-2xl border border-brand-navy/15 bg-white p-6 shadow-subtle hover:shadow flex flex-col items-center text-center"
    >
      <h3 className="text-lg font-medium text-brand-navy">{title}</h3>
      {desc && <p className="mt-2">{desc}</p>}

      <button
        onClick={() => alert("Abrir detalhe / navegação (demo)")}
        className="mt-6 mx-auto inline-flex items-center gap-2 rounded-lg border border-brand-navy/20 px-3 py-2 text-sm hover:bg-white hover:shadow"
      >
        Ver mais
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 5L20 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </article>
  );
}
