import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom"; 
import heroImg from "./assets/hero.png";
import logo from "./assets/logo.png"; 

const NAV = [
  { id: "home", label: "Home" },
  { id: "quem-somos", label: "Quem Somos" },
  { id: "nossa-equipe", label: "Nossa Equipe" },
  { id: "multi-family-office", label: "Multi Family Office" },
  { id: "governanca", label: "Governança" },
  {
    id: "publicacoes",
    label: "Publicações",
    children: [
      { id: "publicacoes-cartas", label: "Cartas" },
      { id: "publicacoes-relatorios", label: "Relatórios" },
      { id: "publicacoes-insights", label: "Insights" },
      { id: "publicacoes-compliance", label: "Compliance" },
    ],
  },
  { id: "formulario-api", label: "Formulário de API" },
  { id: "midias", label: "Mídias" },
  { id: "contato", label: "Contato" },
];

const HERO_BG = heroImg;

function cx(...c) {
  return c.filter(Boolean).join(" ");
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("home");
  const lastY = useRef(0);
  const [hideHeader, setHideHeader] = useState(false);
  const [pubsOpen, setPubsOpen] = useState(false);

  // Scroll spy + smooth scroll
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHideHeader(y > lastY.current && y > 64); // esconde ao descer
      lastY.current = y;

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

    document.documentElement.style.scrollBehavior = "smooth";
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  const goTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header (auto-hide) */}
      <header
        className={cx(
          "sticky top-0 z-50 border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/70 transition-transform",
          hideHeader ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="flex w-full items-center justify-between px-6 py-4">
          <button
            onClick={() => goTo("home")}
            className="flex items-center gap-3"
            aria-label="Ir para início"
          >
            <img src={logo} alt="Logo Stock Capital MFO" className="h-24 w-auto" />
          </button>

          {/* Botão hambúrguer (sempre visível) */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cx(
              "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10",
              menuOpen ? "bg-white/10" : "bg-white/5 hover:bg-white/10"
            )}
            aria-label="Abrir menu"
          >
            <div className="pointer-events-none">
              <span className={cx("block h-[2px] w-6 transition-all", menuOpen ? "translate-y-[6px] rotate-45 bg-white" : "-translate-y-1.5 bg-white/90")} />
              <span className={cx("my-1 block h-[2px] w-6 bg-white/90 transition-opacity", menuOpen && "opacity-0")} />
              <span className={cx("block h-[2px] w-6 transition-all", menuOpen ? "-translate-y-[6px] -rotate-45 bg-white" : "translate-y-1.5 bg-white/90")} />
            </div>
          </button>
        </div>

        {/* Drawer do menu */}
        {menuOpen && (
          <nav className="border-t border-white/10 bg-neutral-950/95">
            <ul className="grid w-full gap-1 px-6 py-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {NAV.map((item) => (
                <li key={item.id} className="relative">
                  {!item.children ? (
                    <button
                      onClick={() => goTo(item.id)}
                      className={cx(
                        "w-full rounded-lg px-4 py-2 text-left text-sm",
                        active === item.id ? "bg-white/15 font-medium" : "hover:bg-white/10"
                      )}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <div className="rounded-lg p-1">
                      <button
                        onClick={() => setPubsOpen((v) => !v)}
                        className={cx(
                          "w-full rounded-lg px-4 py-2 text-left text-sm",
                          active.startsWith("publicacoes") ? "bg-white/15 font-medium" : "hover:bg-white/10"
                        )}
                      >
                        {item.label}
                      </button>
                      {pubsOpen && (
                        <ul className="mt-1 rounded-lg border border-white/10 bg-white/5 p-1">
                          {item.children.map((c) => (
                            <li key={c.id}>
                              <button
                                onClick={() => goTo(c.id)}
                                className={cx(
                                  "w-full rounded-md px-4 py-2 text-left text-sm",
                                  active === c.id ? "bg-white/15 font-medium" : "hover:bg-white/10"
                                )}
                              >
                                {c.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
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
          style={{ backgroundImage: `url(${HERO_BG})`, backgroundSize: "cover", backgroundPosition: "center bottom" }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex h-full w-full items-end justify-center px-4 pb-12 text-center">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold md:text-5xl">
                Gerenciamos patrimônios com excelência para construir o mundo ao nosso redor.
              </h1>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => goTo("contato")}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow hover:bg-white/90"
                >
                  Fale conosco
                </button>
                <button
                  onClick={() => goTo("multi-family-office")}
                  className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
                >
                  Conheça os serviços
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MainContainer>
        {/* Card translúcido afastado do hero */}
        <div className="mt-10 md:mt-14 lg:mt-20 rounded-3xl border border-white/10 bg-white/15 p-6 md:p-20 shadow-xl">
          <h2 className="text-2xl font-semibold text-center">Na Stock Capital Multi Family Office</h2>
          <p className="mt-3 max-w-4xl mx-auto text-white/80 text-center [text-wrap:balance]">
            Acreditamos que patrimônio bem gerido vai além da rentabilidade: ele influencia gerações, fortalece famílias e transforma o ambiente ao nosso redor. Com independência, técnica e visão multigeracional, estruturamos soluções patrimoniais que integram proteção, crescimento e propósito.
          </p>
        </div>

        {/* Nova seção: Para Quem Atuamos */}
        <Section
          id="para-quem-atuamos"
          title="Para Quem Atuamos"
          subtitle="Nosso trabalho é desenhado para famílias e indivíduos que compartilham nossa visão de construção de legado."
        >
          <ul className="mt-2 list-disc space-y-2 pl-5 text-white/80">
            <li>
              Pessoas que estão começando a construir seu futuro financeiro e
              buscam orientação qualificada ao longo desse caminho;
            </li>
            <li>
              Estruturas familiares que buscam planejamento jurídico, fiscal e
              sucessório sólido;
            </li>
            <li>Famílias com patrimônio consolidado;</li>
            <li>
              Investidores que desejam acesso a ativos sofisticados e diversificação
              internacional;
            </li>
            <li>Estruturas societárias complexas.</li>
          </ul>
        </Section>

        <Section
          id="quem-somos"
          title="Quem Somos"
          subtitle="Gestão patrimonial com inteligência, responsabilidade e visão de impacto."
        >
          <p className="text-justify">
            Atuamos com total independência na construção de estratégias financeiras,
            sucessórias e fiduciárias para famílias e investidores que desejam
            preservar e expandir seu patrimônio com governança e sofisticação.
          </p>
          <Bullets
            items={[
              "Independência absoluta, sem vínculo com bancos ou produtos",
              "Transparência e alinhamento, com modelo de remuneração claro",
              "Atuação multidisciplinar em finanças, direito, sucessão e investimentos de impacto",
            ]}
          />
        </Section>

        <Section id="nossa-equipe" title="Nossa Equipe" subtitle="Profissionais com experiência em gestão, finanças, jurídico e impacto.">
          <Cards
            cols="2"
            items={[
              { title: "Executivo(a) 1", desc: "Head de Investimentos" },
              { title: "Executivo(a) 2", desc: "Head Jurídico / Sucessório" },
            ]}
          />
        </Section>

        <Section id="multi-family-office" title="Multi Family Office" subtitle="Planejamos o presente com foco no seu futuro.">
          <Bullets
            columns={2}
            items={[
              "Consultoria financeira especializada",
              "Administração de Patrimônio",
              "Administração de Portfólio",
              "Mapeamento e consolidação de ativos",
              "Planejamento jurídico, fiscal e sucessório",
              "Constituição de holdings, trusts e estruturas fiduciárias",
              "Governança familiar com foco em continuidade",
              "Relatórios periódicos e suporte operacional",
            ]}
          />
        </Section>
        <Section id="governanca" title="Governança e Confiança" subtitle="Processos institucionais, decisões fundamentadas e ética inegociável.">
          <Bullets
            items={[
              "Estrutura fiduciária com comitês internos e processos auditáveis",
              "Política de prevenção a conflitos de interesse",
              "Compliance contínuo e acompanhamento regulatório",
              "Relatórios gerenciais e reuniões de alinhamento com os clientes",
            ]}
          />
        </Section>

        <Section id="sustentabilidade" title="Sustentabilidade e Impacto" subtitle="Todo investimento molda o mundo — por isso, o seu patrimônio também pode transformar realidades.">

          <Bullets
            items={[
              "Investimentos temáticos em mudanças climáticas, educação, saúde e tecnologia limpa",
              "Curadoria rigorosa de fundos com mandatos ESG e impacto direto",
              "Estruturação de capital catalítico",
              "Avaliação e reporte de impacto ambiental e social",
            ]}
          />
        </Section>

        {/* Publicações */}
        <Section id="publicacoes" title="Publicações" subtitle="Análises e materiais proprietários.">
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Cartas" desc="Cartas periódicas com visão de mercado e posicionamento." anchorId="publicacoes-cartas" />
            <Card title="Relatórios" desc="Materiais aprofundados, macro, setores e classes de ativos." anchorId="publicacoes-relatorios" />
            <Card title="Insights" desc="Notas rápidas e estudos sobre temas relevantes." anchorId="publicacoes-insights" />
            <Card title="Compliance" desc="Documentos e políticas de conformidade e ética." anchorId="publicacoes-compliance" />
          </div>
        </Section>

        <Section
  id="formulario-api"
  title="Formulário de API"
  subtitle="Descubra seu perfil de investidor preenchendo nosso questionário de suitability."
>
  <div className="flex justify-center">
    <Link
      to="/formulario-api"
      className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow hover:bg-white/90">
      Preencher formulário
      </Link>
  </div>
</Section>


        <Section id="midias" title="Mídias" subtitle="Coletânea de entrevistas, artigos e menções na imprensa.">
          <Cards
            items={[
              { title: "Entrevista XYZ", desc: "Mercado de capitais e sucessão." },
              { title: "Artigo ABC", desc: "Investimentos com impacto." },
              { title: "Podcast 123", desc: "Governança familiar." },
            ]}
          />
        </Section>

        <Section id="contato" title="Contato" subtitle="Fale com nossa equipe.">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-lg font-medium">Endereço</h3>
              <p className="mt-2 text-white/70">
                Rua Exemplo, 123 — Cidade/UF
                <br />
                CEP 00000-000
              </p>
              <h3 className="mt-6 text-lg font-medium">E-mail</h3>
              <p className="mt-2 text-white/70">contato@stockcapital.com.br</p>
              <h3 className="mt-6 text-lg font-medium">Telefone</h3>
              <p className="mt-2 text-white/70">(41) 0000-0000</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Mensagem enviada (demo)");
              }}
              className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="grid gap-1">
                <label className="text-sm text-white/80">Nome</label>
                <input className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm text-white/80">E-mail</label>
                <input type="email" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
              </div>
              <div className="grid gap-1">
                <label className="text-sm text-white/80">Mensagem</label>
                <textarea rows={4} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20" />
              </div>
              <button className="mt-2 w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-white/90">Enviar</button>
            </form>
          </div>
        </Section>
      </MainContainer>

      <footer className="border-t border-white/10 bg-neutral-950 py-10">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-white/60">© {new Date().getFullYear()} Stock Capital MFO — Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}

function MainContainer({ children }) {
  return <main className="mx-auto max-w-7xl px-4">{children}</main>;
}

function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10 py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold">{title}</h2>
        {subtitle && (
          <p className="mt-1 max-w-3xl mx-auto text-white/70 text-center [text-wrap:balance]">
            {subtitle}
          </p>
        )}
      </div>
      {/* força justificado no conteúdo da seção */}
      <div className="grid gap-2 text-justify">{children}</div>
    </section>
  );
}


function Bullets({ items = [], columns = 1 }) {
  return (
    <ul className={cx("grid list-disc gap-2 pl-5 text-white/80", columns === 2 ? "md:grid-cols-2" : "grid-cols-1")}>
      {items.map((t) => (
        <li key={t} className="marker:text-white/50">
          {t}
        </li>
      ))}
    </ul>
  );
}

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

function Card({ title, desc, anchorId }) {
  return (
    <article
      id={anchorId}
      className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow hover:bg-white/10
                 flex flex-col items-center text-center"
    >
      <h3 className="text-lg font-medium">{title}</h3>
      {desc && <p className="mt-2 text-white/70">{desc}</p>}

      <button
        onClick={() => alert("Abrir detalhe / navegação (demo)")}
        className="mt-6 mx-auto inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
      >
        Ver mais
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 5L20 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </article>
  );
}
