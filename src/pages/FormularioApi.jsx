// src/pages/FormularioApi.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";

/* --------------------------------- helpers -------------------------------- */
const cx = (...c) => c.filter(Boolean).join(" ");

function Toast({ open, message, variant = "error", onClose }) {
  if (!open) return null;
  const colors =
    variant === "success"
      ? "bg-emerald-600 border-emerald-400"
      : variant === "warning"
      ? "bg-amber-500 border-amber-300"
      : "bg-red-600 border-red-400";
  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
      <div
        role="alert"
        className={cx(
          "w-full max-w-md text-white border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3",
          colors
        )}
      >
        <span className="mt-0.5 text-sm whitespace-pre-line">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- IDs iguais ao Pipefy ---------------------------- */
const F = {
  nome: "nome_do_cliente",
  tel: "telefone_para_contato_whatsapp",
  email: "e_mail",
  estadoCivil: "estado_civil",
  faixaEtaria: "qual_a_sua_faixa_et_ria",

  fonteRenda: "qual_a_sua_fonte_de_renda",
  compRenda: "descreva_brevemente_a_composi_o_da_sua_renda_mensal",
  disponibilidade: "patrim_nio_l_quido",
  finalidade: "qual_a_principal_finalidade_de_investir",
  dependentesQtd: "quantos_dependentes_financeiros_voc_possui",
  dependentesPerfil: "especifique_o_perfil_de_dependentes",

  moeda: "qual_moeda_voc_tem_prefer_ncia_em_estar_posicionado",
  inv24m: "quais_investimentos_voc_realizou_nos_ltimos_24_meses_1",
  interesseEco: "qual_o_seu_grau_de_interesse_em_economia_e_mercado_financeiro",
  tiposInvest: "quais_os_tipos_de_investimentos_que_voc_mais_se_identifica",

  chave01:
    "pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
  chave02:
    "copy_of_pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
  necessidadeRend: "qual_a_necessidade_futura_dos_seus_rendimentos",
  horizonte: "qual_o_seu_horizonte_de_investimento",
  volatilidade: "possui_conhecimento_sobre_o_conceito_volatilidade",
  reacao10: "como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_perda_de_10",
  reacao30: "copy_of_como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_oscila_o_de_10",
  marcacaoMercado: "sobre_os_conceitos_de_marca_o_a_mercado_em_t_tulos_de_renda_fixa",
};

/* ------------------------------ opções estáticas ----------------------------- */
const OPT = {
  estado_civil: ["Solteiro (a)", "Casado (a)", "Divorciado (a)", "Morando Junto"],
  faixa_etaria: ["Até 25 anos", "Entre 26 e 35 anos", "Entre 36 e 45 anos", "Entre 46 e 55 anos", "Acima de 56 anos"],

  fonte_renda: [
    "Salário (emprego CLT)",
    "Trabalho autônomo ou prestação de serviços",
    "Aposentadoria ou pensão",
    "Aluguéis de imóveis",
    "Investimentos (juros, dividendos)",
    "Benefícios sociais",
  ],

  finalidade_investir: [
    "Preservar patrimônio",
    "Valorização patrimonial",
    "Aumento de renda",
    "Realizar conquistas financeiras no médio prazo",
  ],

  dependentes_qtd: ["1 ou 2", "3 ou mais", "Nenhum"],
  dependentes_perfil: [
    "Crianças até 12 anos",
    "Adolescentes entre 13 a 18 anos",
    "Adultos acima de 19 anos",
    "Cônjuge",
    "Idosos",
  ],

  moeda_preferencia: [
    "100% em Real",
    "100% em Dólar",
    "50% em Real e 50% em Dólar",
    "Variável entre Real e Dólar",
  ],

  investimentos_24m: ["Poupança", "Renda Fixa", "Renda Variável", "Investimento Imobiliário", "Nenhum"],

  interesse_eco: ["Nenhum interesse", "Algum interesse", "Muito interesse"],

  tipos_invest: [
    "Poupança",
    "Renda Fixa",
    "Renda Variável",
    "Investimento Imobiliário",
    "Fundos de Investimento",
    "Derivativos",
    "Investimentos Internacionais",
    "Criptoativos",
    "Investimentos Alternativos",
    "Investimento Empresarial (Private Equity, Venture Capital, Investimento Anjo)",
  ],

  necessidade_rend: ["Complemento de renda", "Elevar padrão de vida", "Sem previsão de uso"],
  horizonte: ["Até 1 ano", "Entre 2 e 5 anos", "Mais de 5 anos"],
  volatilidade: ["Não conheço", "Aceito variação no curto prazo", "Aceito variação ou perda no curto prazo"],
  reacao_10: ["Muito preocupado", "Avaliaria reversão", "Não me preocuparia"],
  reacao_30: ["Muito preocupado", "Avaliaria reversão", "Não me preocuparia"],

  chave_01: [
    "Método capaz de salvar 200 vidas, 200 morrerem e 200 dependem de sorte.",
    "Método que traz 1/3 de chance de todas as 600 pessoas serem salvas e 2/3 de todas as 600 pessoas morrerem.",
    "do capaz de me salvar, salvar quem eu amo e o resto que se vire.",
  ],
  chave_02: [
    "Método onde 400 pessoas morrerão.",
    "Método que traz 1/3 de chance de todas as 600 pessoas serem mortas e 2/3 de todas as 600 pessoas viverem.",
    "Método que fortalece todos a viverem, mesmo não tendo controle quantos morrem, podendo ser todos inclusive.",
  ],

  marcacao_mercado: ["Nenhum conhecimento", "Já ouvi mas desconheço impacto", "Conheço bem"],
};

/* ---------------------- Rótulos bonitos para a Revisão ---------------------- */
const LABELS = {
  [F.nome]: "Nome do Cliente",
  [F.tel]: "Telefone para Contato (Whatsapp)",
  [F.email]: "E-mail",
  [F.estadoCivil]: "Estado Civil",
  [F.faixaEtaria]: "Qual a sua faixa etária?",
  [F.fonteRenda]: "Qual a sua Fonte de Renda?",
  [F.compRenda]: "Descreva Brevemente a Composição da sua Renda Mensal",
  [F.disponibilidade]: "Qual a sua disponibilidade financeira para investir?",
  [F.finalidade]: "Qual a principal finalidade de investir?",
  [F.dependentesQtd]: "Quantos dependentes financeiros você possui?",
  [F.dependentesPerfil]: "Especifique o Perfil de Dependentes",
  [F.moeda]: "Qual moeda você tem preferência em estar posicionado?",
  [F.inv24m]: "Quais investimentos você realizou nos últimos 24 meses?",
  [F.interesseEco]: "Qual o seu grau de interesse em Economia e Mercado Financeiro?",
  [F.tiposInvest]: "Quais os tipos de investimentos que você mais se identifica?",
  [F.necessidadeRend]: "Qual é a necessidade futura dos seus rendimentos?",
  [F.horizonte]: "Qual é o seu horizonte de investimento?",
  [F.volatilidade]: "Possui conhecimento sobre o conceito volatilidade?",
  [F.reacao10]: "Como você reagiria caso o seu investimento tivesse uma oscilação de 10%?",
  [F.reacao30]: "Como você reagiria caso o seu investimento tivesse uma oscilação de 30%?",
  [F.marcacaoMercado]: "Sobre os conceitos de marcação a mercado em títulos de renda fixa:",
  [F.chave01]:
    "PERGUNTA CHAVE 01 - Assuma que uma epidemia chegou numa cidade e tem potencial de infectar 600 pessoas. Você precisa escolher o programa de saúde pública que vai salvar essa cidade:",
  [F.chave02]:
    "PERGUNTA CHAVE 02 - Assuma que uma epidemia chegou numa cidade e tem potencial de infectar 600 pessoas. Você precisa escolher o programa de saúde pública que vai salvar essa cidade:",
};
const labelOf = (k) => LABELS[k] || k;
const pretty = (v) =>
  Array.isArray(v) ? (v.length ? v.join(", ") : "—") : (v?.toString().trim() || "—");

/* --------------------- campos obrigatórios por cada etapa --------------------- */
const REQUIRED_BY_STEP = [
  [F.nome, F.tel, F.email, F.estadoCivil, F.faixaEtaria], // 0 – Dados
  [F.fonteRenda, F.disponibilidade, F.dependentesQtd],    // 1 – Renda
  [F.interesseEco],                                       // 2 – Preferências
  [F.chave01, F.chave02, F.necessidadeRend, F.horizonte, F.volatilidade, F.reacao10, F.reacao30, F.marcacaoMercado], // 3 – Risco
  [],                                                     // 4 – Revisão
];

const isEmpty = (val) => (Array.isArray(val) ? val.length === 0 : String(val ?? "").trim() === "");
const getMissingInStep = (step, form) => (REQUIRED_BY_STEP[step] || []).filter((key) => isEmpty(form[key]));

/* --------------------------------- UI blocks -------------------------------- */
// Agora todos os blocos seguem o tema claro (mesmo padrão das páginas internas)
function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-brand-navy/15 bg-white p-6 lg:p-8 space-y-6 shadow-subtle">
      {title && <h2 className="text-xl font-semibold text-brand-navy">{title}</h2>}
      {description && <p className="text-sm text-slate-600">{description}</p>}
      {children}
    </section>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium block text-slate-700">
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Select({ label, required, options, value, onChange, placeholder = "Escolha uma opção" }) {
  return (
    <Field label={label} required={required}>
      <select
        className="w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        required={!!required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </Field>
  );
}

function RadioGroup({ label, required, options, value, onChange }) {
  return (
    <Field label={label} required={required}>
      <div className="grid gap-3">
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-2 text-slate-700">
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </Field>
  );
}

function CheckGroup({ label, required, options, values, onChange, idPrefix }) {
  const allChecked = values.length === options.length && options.length > 0;
  const toggleAll = () => onChange(allChecked ? [] : [...options]);
  const toggleOne = (opt) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <Field label={label} required={required}>
      <div className="space-y-3">
        <label className="inline-flex items-center gap-2 text-slate-700">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} />
          <span>Marcar todos</span>
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((opt, i) => (
            <label key={opt} className="inline-flex items-center gap-2 text-slate-700">
              <input
                id={`${idPrefix}-${i}`}
                type="checkbox"
                checked={values.includes(opt)}
                onChange={() => toggleOne(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    </Field>
  );
}

/* ------------------------------- Etapas (views) ------------------------------ */
function StepDados({ form, set }) {
  return (
    <Section
      title="Dados pessoais"
      description="Use seus dados exatamente como gostaria que aparecessem no seu cadastro."
    >
      <Field label="Nome do Cliente" required>
        <input
          className="w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
          placeholder="Seu nome completo"
          value={form[F.nome]}
          onChange={(e) => set(F.nome, e.target.value)}
          required
        />
      </Field>
      <Field label="Telefone para Contato (Whatsapp)" required>
        <input
          className="w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
          placeholder="(99) 99999-9999"
          value={form[F.tel]}
          onChange={(e) => set(F.tel, e.target.value)}
          required
        />
      </Field>
      <Field label="E-mail" required>
        <input
          type="email"
          className="w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
          placeholder="seuemail@dominio.com"
          value={form[F.email]}
          onChange={(e) => set(F.email, e.target.value)}
          required
        />
      </Field>
      <Select
        label="Estado Civil"
        required
        options={OPT.estado_civil}
        value={form[F.estadoCivil]}
        onChange={(v) => set(F.estadoCivil, v)}
      />
      <Select
        label="Qual a sua faixa etária?"
        required
        options={OPT.faixa_etaria}
        value={form[F.faixaEtaria]}
        onChange={(v) => set(F.faixaEtaria, v)}
      />
    </Section>
  );
}

function StepRenda({ form, set }) {
  return (
    <Section title="Renda e objetivos">
      <Select
        label="Qual a sua Fonte de Renda?"
        required
        options={OPT.fonte_renda}
        value={form[F.fonteRenda]}
        onChange={(v) => set(F.fonteRenda, v)}
      />
      <Field label="Descreva Brevemente a Composição da sua Renda Mensal">
        <textarea
          rows={4}
          className="w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
          value={form[F.compRenda]}
          onChange={(e) => set(F.compRenda, e.target.value)}
        />
      </Field>
      <Field
        label="Qual a sua disponibilidade financeira para investir?"
        required
        hint="Valor aproximado que pretende investir em 12 meses."
      >
        <input
          className="w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
          value={form[F.disponibilidade]}
          onChange={(e) => set(F.disponibilidade, e.target.value)}
        />
      </Field>

      <CheckGroup
        label="Qual a principal finalidade de investir?"
        options={OPT.finalidade_investir}
        values={form[F.finalidade]}
        onChange={(vals) => set(F.finalidade, vals)}
        idPrefix="finalidade"
      />
      <Select
        label="Quantos dependentes financeiros você possui?"
        required
        options={OPT.dependentes_qtd}
        value={form[F.dependentesQtd]}
        onChange={(v) => set(F.dependentesQtd, v)}
      />
      <CheckGroup
        label="Especifique o Perfil de Dependentes"
        options={OPT.dependentes_perfil}
        values={form[F.dependentesPerfil]}
        onChange={(vals) => set(F.dependentesPerfil, vals)}
        idPrefix="dep-perfil"
      />
    </Section>
  );
}

function StepPreferencias({ form, set }) {
  return (
    <Section title="Preferências e experiência">
      <CheckGroup
        label="Qual moeda você tem preferência em estar posicionado?"
        options={OPT.moeda_preferencia}
        values={form[F.moeda]}
        onChange={(vals) => set(F.moeda, vals)}
        idPrefix="moeda"
      />
      <CheckGroup
        label="Quais investimentos você realizou nos últimos 24 meses?"
        options={OPT.investimentos_24m}
        values={form[F.inv24m]}
        onChange={(vals) => set(F.inv24m, vals)}
        idPrefix="inv24"
      />
      <Select
        label="Qual o seu grau de interesse em Economia e Mercado Financeiro?"
        required
        options={OPT.interesse_eco}
        value={form[F.interesseEco]}
        onChange={(v) => set(F.interesseEco, v)}
      />
      <CheckGroup
        label="Quais os tipos de investimentos que você mais se identifica?"
        options={OPT.tipos_invest}
        values={form[F.tiposInvest]}
        onChange={(vals) => set(F.tiposInvest, vals)}
        idPrefix="tipos"
      />
    </Section>
  );
}

function StepPerfilRisco({ form, set }) {
  return (
    <Section title="Perfil de risco">
      <RadioGroup
        label="PERGUNTA CHAVE 01 - Assuma que uma epidemia chegou numa cidade e tem potencial de infectar 600 pessoas. Você precisa escolher o programa de saúde pública que vai salvar essa cidade:"
        required
        options={OPT.chave_01}
        value={form[F.chave01]}
        onChange={(v) => set(F.chave01, v)}
      />
      <RadioGroup
        label="PERGUNTA CHAVE 02 - Assuma que uma epidemia chegou numa cidade e tem potencial de infectar 600 pessoas. Você precisa escolher o programa de saúde pública que vai salvar essa cidade:"
        required
        options={OPT.chave_02}
        value={form[F.chave02]}
        onChange={(v) => set(F.chave02, v)}
      />
      <Select
        label="Qual é a necessidade futura dos seus rendimentos?"
        required
        options={OPT.necessidade_rend}
        value={form[F.necessidadeRend]}
        onChange={(v) => set(F.necessidadeRend, v)}
      />
      <Select
        label="Qual é o seu horizonte de investimento?"
        required
        options={OPT.horizonte}
        value={form[F.horizonte]}
        onChange={(v) => set(F.horizonte, v)}
      />
      <Select
        label="Possui conhecimento sobre o conceito volatilidade?"
        required
        options={OPT.volatilidade}
        value={form[F.volatilidade]}
        onChange={(v) => set(F.volatilidade, v)}
      />
      <Select
        label="Como você reagiria caso o seu investimento tivesse uma oscilação de 10%?"
        required
        options={OPT.reacao_10}
        value={form[F.reacao10]}
        onChange={(v) => set(F.reacao10, v)}
      />
      <Select
        label="Como você reagiria caso o seu investimento tivesse uma oscilação de 30%?"
        required
        options={OPT.reacao_30}
        value={form[F.reacao30]}
        onChange={(v) => set(F.reacao30, v)}
      />
      <Select
        label="Sobre os conceitos de marcação a mercado em títulos de renda fixa:"
        required
        options={OPT.marcacao_mercado}
        value={form[F.marcacaoMercado]}
        onChange={(v) => set(F.marcacaoMercado, v)}
      />
    </Section>
  );
}

function StepReview({ form, set }) {
  const grupos = [
    { titulo: "Dados do Cliente", campos: [F.nome, F.tel, F.email, F.estadoCivil, F.faixaEtaria] },
    { titulo: "Renda e Disponibilidade", campos: [F.fonteRenda, F.compRenda, F.disponibilidade] },
    { titulo: "Preferências e Objetivos", campos: [F.finalidade, F.dependentesQtd, F.dependentesPerfil, F.moeda, F.inv24m, F.tiposInvest] },
    { titulo: "Perfil de Risco", campos: [F.chave01, F.chave02, F.interesseEco, F.necessidadeRend, F.horizonte, F.volatilidade, F.reacao10, F.reacao30, F.marcacaoMercado] },
  ];

  return (
    <Section title="Revisão" description="Confira suas respostas. Você pode voltar e ajustar qualquer etapa.">
      <div className="space-y-6">
        {grupos.map(({ titulo, campos }) => (
          <div key={titulo} className="rounded-xl border border-brand-navy/15 p-4">
            <h3 className="font-medium mb-3 text-brand-navy">{titulo}</h3>
            <dl className="grid gap-3 sm:grid-cols-2">
              {campos.map((k) => (
                <div key={k} className="grid gap-1">
                  <dt className="text-xs text-slate-500">{labelOf(k)}</dt>
                  <dd className="text-sm text-slate-700">{pretty(form[k])}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 pt-6">
        <input
          type="checkbox"
          checked={form.lgpd}
          onChange={(e) => set("lgpd", e.target.checked)}
        />
        Concordo com os termos de uso e a política de privacidade (LGPD)
      </label>
    </Section>
  );
}

/* --------------------------------- Container -------------------------------- */
export default function FormularioApi() {
  const navigate = useNavigate();

  const [toast, setToast] = useState({ open: false, message: "", variant: "error" });
  const showToast = (message, variant = "error", timeout = 3200) => {
    setToast({ open: true, message, variant });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast((t) => ({ ...t, open: false })), timeout);
  };

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    [F.nome]: "",
    [F.tel]: "",
    [F.email]: "",
    [F.estadoCivil]: "",
    [F.faixaEtaria]: "",

    [F.fonteRenda]: "",
    [F.compRenda]: "",
    [F.disponibilidade]: "",
    [F.finalidade]: [],
    [F.dependentesQtd]: "",
    [F.dependentesPerfil]: [],

    [F.moeda]: [],
    [F.inv24m]: [],
    [F.interesseEco]: "",
    [F.tiposInvest]: [],

    [F.chave01]: "",
    [F.chave02]: "",
    [F.necessidadeRend]: "",
    [F.horizonte]: "",
    [F.volatilidade]: "",
    [F.reacao10]: "",
    [F.reacao30]: "",
    [F.marcacaoMercado]: "",

    lgpd: false,
  });

  const set = (key, val) => setForm((s) => ({ ...s, [key]: val }));

  const validators = [
    () => getMissingInStep(0, form).length === 0,
    () => getMissingInStep(1, form).length === 0,
    () => getMissingInStep(2, form).length === 0,
    () => getMissingInStep(3, form).length === 0,
    () => form.lgpd === true,
  ];

  const steps = [
    { title: "Dados", Component: StepDados },
    { title: "Renda", Component: StepRenda },
    { title: "Preferências", Component: StepPreferencias },
    { title: "Perfil de risco", Component: StepPerfilRisco },
    { title: "Revisão", Component: StepReview },
  ];
  const Current = steps[step].Component;
  const canContinue = useMemo(() => validators[step](), [form, step]);

  async function submit() {
    for (let i = 0; i < REQUIRED_BY_STEP.length - 1; i++) {
      const missing = getMissingInStep(i, form);
      if (missing.length) {
        setStep(i);
        const msg = missing.slice(0, 3).map((k) => `• ${labelOf(k)}`).join("\n");
        showToast(`Antes de enviar, responda:\n${msg}`, "warning", 4800);
        window.scrollTo({ top: 0 });
        return;
      }
    }
    if (!form.lgpd) {
      setStep(4);
      showToast("Você precisa aceitar a LGPD para continuar.", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form };
      delete payload.lgpd;

      const res = await fetch("/api/form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) {
        console.error(json);
        showToast(json.message || json.error || "Erro ao enviar para o Pipefy.", "error");
        return;
      }
      showToast("Formulário enviado com sucesso!", "success");
      window.scrollTo({ top: 0 });
    } catch (e) {
      console.error(e);
      showToast("Erro de conexão. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  }

  // progresso (percentual) para a barra no rodapé
  const progressPct = ((step + 1) / steps.length) * 100;

  // Mantém consistência de scroll com as demais páginas
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  return (
    <PageLayout
      title="Formulário de API"
      subtitle="Descubra seu perfil de investidor preenchendo nosso questionário de suitability."
    >
      {/* toast */}
      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      {/* etapa atual */}
      <div className="mx-auto max-w-3xl w-full pb-28 md:pb-32">
        <Current form={form} set={set} />
      </div>

      {/* barra de progresso + navegação fixa na base da viewport, como nas outras páginas claras */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-navy/10 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 pt-3">
          {/* barra de progresso */}
          <div className="w-full h-2 rounded bg-brand-100 overflow-hidden">
            <div
              className="h-2 bg-brand-navy transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* controles */}
          <div className="py-3 flex items-center gap-3">
            <button
              onClick={() => {
                if (step === 0) navigate("/");
                else setStep((s) => Math.max(0, s - 1));
              }}
              disabled={loading}
              className="rounded-xl border border-brand-navy/20 bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-100 disabled:opacity-40"
            >
              Voltar
            </button>

            <span className="text-xs text-slate-600">
              Etapa {step + 1} de {steps.length} — {steps[step].title}
            </span>

            {step < steps.length - 1 ? (
              <button
                onClick={() => {
                  const missing = getMissingInStep(step, form);
                  if (missing.length) {
                    const msg =
                      missing.length === 1
                        ? `Preencha: "${labelOf(missing[0])}"`
                        : `Faltam respostas:\n${missing
                            .slice(0, 3)
                            .map((k) => `• ${labelOf(k)}`)
                            .join("\n")}`;
                    showToast(msg, "warning", 4800);
                    return;
                  }
                  setStep((s) => s + 1);
                }}
                className={cx(
                  "ml-auto rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                  canContinue
                    ? "bg-brand-navy text-white hover:brightness-110"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
                disabled={!canContinue || loading}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={submit}
                className={cx(
                  "ml-auto rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                  validators[step]()
                    ? "bg-brand-navy text-white hover:brightness-110"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                )}
                disabled={!validators[step]() || loading}
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
