// src/pages/FormularioApi.jsx
import React, { useMemo, useState } from "react";
import logo from "../assets/logo.png";

/** ---------- helpers ---------- */
const cx = (...c) => c.filter(Boolean).join(" ");

/** ---------- Toast simples (Tailwind) ---------- */
function Toast({ open, message, variant = "error", onClose }) {
  if (!open) return null;

  let colors = "";
  if (variant === "success") colors = "bg-emerald-600 border-emerald-400";
  else if (variant === "warning") colors = "bg-amber-500 border-amber-300";
  else colors = "bg-red-600 border-red-400"; // default error

  return (
    <div className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
      <div
        role="alert"
        className={`w-full max-w-md ${colors} text-white border rounded-xl shadow-lg px-4 py-3 flex items-start gap-3`}
      >
        <span className="mt-0.5 text-sm">{message}</span>
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

/** ---------- ids (iguais ao pipefy) ---------- */
const F = {
  nome: "nome_do_cliente",
  tel: "telefone_para_contato_whatsapp",
  email: "e_mail",
  estadoCivil: "estado_civil",
  faixaEtaria: "qual_a_sua_faixa_et_ria",
  fonteRenda: "qual_a_sua_fonte_de_renda",
  compRenda: "descreva_brevemente_a_composi_o_da_sua_renda_mensal",
  disponibilidade: "patrim_nio_l_quido",
  chave01:
    "pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
  finalidade: "qual_a_principal_finalidade_de_investir",
  dependentesQtd: "quantos_dependentes_financeiros_voc_possui",
  chave02:
    "copy_of_pergunta_chave_01_assuma_que_uma_epidemia_chegou_numa_cidade_e_tem_potencial_de_infectar_600_pessoas_voc_precisa_escolher_o_programa_de_sa_de_p_blica_que_vai_salvar_essa_cidade",
  dependentesPerfil: "especifique_o_perfil_de_dependentes",
  moeda: "qual_moeda_voc_tem_prefer_ncia_em_estar_posicionado",
  inv24m: "quais_investimentos_voc_realizou_nos_ltimos_24_meses_1",
  interesseEco:
    "qual_o_seu_grau_de_interesse_em_economia_e_mercado_financeiro",
  tiposInvest:
    "quais_os_tipos_de_investimentos_que_voc_mais_se_identifica",
  necessidadeRend: "qual_a_necessidade_futura_dos_seus_rendimentos",
  horizonte: "qual_o_seu_horizonte_de_investimento",
  volatilidade: "possui_conhecimento_sobre_o_conceito_volatilidade",
  reacao10:
    "como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_perda_de_10",
  reacao30:
    "copy_of_como_voc_reagiria_caso_o_seu_investimento_tivesse_uma_oscila_o_de_10",
  marcacaoMercado:
    "sobre_os_conceitos_de_marca_o_a_mercado_em_t_tulos_de_renda_fixa",
};

/** ---------- UI building blocks ---------- */
function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:p-8">
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <div className="grid gap-1">
      <label className="text-sm font-medium">
        {required && <span className="text-red-400 mr-1">*</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-white/60">{hint}</p>}
    </div>
  );
}

/** Checkbox group with “select all” */
function CheckGroup({ label, required, options, values, onChange, idPrefix }) {
  const allChecked = values.length === options.length && options.length > 0;
  const toggleAll = () => onChange(allChecked ? [] : [...options]);
  const toggleOne = (opt) => {
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
    else onChange([...values, opt]);
  };
  return (
    <Field label={label} required={required}>
      <div className="grid gap-2">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} />
          <span>Marcar todos</span>
        </label>
        {options.map((opt, i) => (
          <label key={opt} className="inline-flex items-center gap-2">
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
    </Field>
  );
}

/** Radio group */
function RadioGroup({ label, required, options, value, onChange }) {
  return (
    <Field label={label} required={required}>
      <div className="grid gap-2">
        {options.map((opt) => (
          <label key={opt} className="inline-flex items-center gap-2">
            <input
              type="radio"
              name={label}
              checked={value === opt}
              onChange={() => onChange(opt)}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </Field>
  );
}

/** Select */
function Select({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = "Escolha uma opção",
}) {
  return (
    <Field label={label} required={required}>
      <select
        className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
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

/** ---------- opções (copiadas do formulário público) ---------- */
const OPT = {
  estado_civil: [
    "Solteiro (a)",
    "Casado (a)",
    "Divorciado (a)",
    "Morando Junto",
  ],
  faixa_etaria: [
    "Até 25 anos",
    "Entre 26 e 35 anos",
    "Entre 36 e 45 anos",
    "Entre 46 e 55 anos",
    "Acima de 56 anos",
  ],
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
  investimentos_24m: [
    "Poupança",
    "Renda Fixa",
    "Renda Variável",
    "Investimento Imobiliário",
    "Nenhum",
  ],
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
  necessidade_rend: [
    "Complemento de renda",
    "Elevar padrão de vida",
    "Sem previsão de uso",
  ],
  horizonte: ["Até 1 ano", "Entre 2 e 5 anos", "Mais de 5 anos"],
  volatilidade: [
    "Não conheço",
    "Aceito variação no curto prazo",
    "Aceito variação ou perda no curto prazo",
  ],
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
  marcacao_mercado: [
    "Nenhum conhecimento",
    "Já ouvi mas desconheço impacto",
    "Conheço bem",
  ],
};

export default function FormularioApi() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    variant: "error",
  });

  const showToast = (message, variant = "error", timeout = 3200) => {
    setToast({ open: true, message, variant });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(
      () => setToast((t) => ({ ...t, open: false })),
      timeout
    );
  };

  const [form, setForm] = useState({
    [F.nome]: "",
    [F.tel]: "",
    [F.email]: "",
    [F.estadoCivil]: "",
    [F.faixaEtaria]: "",
    [F.fonteRenda]: "",
    [F.compRenda]: "",
    [F.disponibilidade]: "",
    [F.chave01]: "",
    [F.finalidade]: [],
    [F.dependentesQtd]: "",
    [F.chave02]: "",
    [F.dependentesPerfil]: [],
    [F.moeda]: [],
    [F.inv24m]: [],
    [F.interesseEco]: "",
    [F.tiposInvest]: [],
    [F.necessidadeRend]: "",
    [F.horizonte]: "",
    [F.volatilidade]: "",
    [F.reacao10]: "",
    [F.reacao30]: "",
    [F.marcacaoMercado]: "",
    lgpd: false,
  });

  const handle = (key, val) => setForm((s) => ({ ...s, [key]: val }));

  /** ---------- validação ---------- */
  const REQ_SINGLES = [
    F.nome,
    F.tel,
    F.email,
    F.estadoCivil,
    F.faixaEtaria,
    F.fonteRenda,
    F.compRenda, // textarea obrigatória
    F.disponibilidade,
    F.chave01,
    F.dependentesQtd,
    F.chave02,
    F.interesseEco,
    F.necessidadeRend,
    F.horizonte,
    F.volatilidade,
    F.reacao10,
    F.reacao30,
    F.marcacaoMercado,
  ];

  const REQ_MULTIS = [
    F.finalidade,
    F.dependentesPerfil,
    F.moeda,
    F.inv24m,
    F.tiposInvest,
  ];

  const isSinglesOk = (f) =>
    REQ_SINGLES.every((k) => String(f[k] || "").trim().length > 0);
  const isMultisOk = (f) =>
    REQ_MULTIS.every((k) => Array.isArray(f[k]) && f[k].length > 0);
  const isFormOk = (f) => isSinglesOk(f) && isMultisOk(f) && f.lgpd;

  const requiredOk = useMemo(() => isFormOk(form), [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!isSinglesOk(form)) {
      showToast(
        "Preencha todos os campos de seleção única/entrada obrigatórios.",
        "error"
      );
      return;
    }
    if (!isMultisOk(form)) {
      showToast(
        "Selecione ao menos uma opção nos campos de múltipla escolha obrigatórios.",
        "error"
      );
      return;
    }
    if (!form.lgpd) {
      showToast("É necessário aceitar a LGPD para continuar.", "warning");
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
        showToast(
          json.message || json.error || "Erro ao enviar para o Pipefy.",
          "error"
        );
      } else {
        showToast("Formulário enviado com sucesso!", "success");
        window.scrollTo({ top: 0 });
      }
    } catch (err) {
      console.error(err);
      showToast("Erro de conexão. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center p-6 font-sans">
      <img src={logo} alt="Stock Capital" className="h-20 w-auto mb-6" />

      {/* Toast */}
      <Toast
        open={toast.open}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />

      <main className="w-full max-w-3xl">
        <form onSubmit={onSubmit} className="grid gap-6">
          <Section>
            <h1 className="text-3xl font-bold text-center">
              Análise de Perfil de Investidor
            </h1>
            <h2 className="text-sm text-justify mb-6">
              Este questionário tem como objetivo identificar o perfil de risco,
              os objetivos financeiros e o horizonte de investimento de cada
              cliente da Stock Capital Family Office. As informações coletadas
              são fundamentais para a construção de estratégias personalizadas
              de gestão patrimonial, alinhadas aos interesses, necessidades e
              tolerância ao risco de cada investidor.
            </h2>

            <Field label="Nome do Cliente" required>
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-4 py-2 outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Seu Nome Completo"
                value={form[F.nome]}
                onChange={(e) => handle(F.nome, e.target.value)}
                required
              />
            </Field>

            <Field label="Telefone para Contato (Whatsapp)" required>
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                placeholder="(99) 99999-9999"
                value={form[F.tel]}
                onChange={(e) => handle(F.tel, e.target.value)}
                required
              />
            </Field>

            <Field label="E-mail" required>
              <input
                type="email"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                placeholder="seuemail@dominio.com"
                value={form[F.email]}
                onChange={(e) => handle(F.email, e.target.value)}
                required
              />
            </Field>

            <Select
              label="Estado Civil"
              required
              options={OPT.estado_civil}
              value={form[F.estadoCivil]}
              onChange={(v) => handle(F.estadoCivil, v)}
            />

            <Select
              label="Qual a sua faixa etária?"
              required
              options={OPT.faixa_etaria}
              value={form[F.faixaEtaria]}
              onChange={(v) => handle(F.faixaEtaria, v)}
            />

            <Select
              label="Qual a sua Fonte de Renda?"
              required
              options={OPT.fonte_renda}
              value={form[F.fonteRenda]}
              onChange={(v) => handle(F.fonteRenda, v)}
            />

            <Field
              label="Descreva Brevemente a Composição da sua Renda Mensal"
              required
            >
              <textarea
                rows={4}
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                value={form[F.compRenda]}
                onChange={(e) => handle(F.compRenda, e.target.value)}
                required
              />
            </Field>

            <Field
              label="Qual a sua disponibilidade financeira para investir?"
              required
              hint="Valor aproximado do quanto você pretende investir em doze meses."
            >
              <input
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                value={form[F.disponibilidade]}
                onChange={(e) => handle(F.disponibilidade, e.target.value)}
                required
              />
            </Field>
          </Section>

          <Section title="Perfil e Objetivos">
            <RadioGroup
              label="PERGUNTA CHAVE 01 - Assuma que uma epidemia chegou numa cidade e tem potencial de infectar 600 pessoas. Você precisa escolher o programa de saúde pública que vai salvar essa cidade:"
              required
              options={OPT.chave_01}
              value={form[F.chave01]}
              onChange={(v) => handle(F.chave01, v)}
            />

            <CheckGroup
              label="Qual a principal finalidade de investir?"
              required
              options={OPT.finalidade_investir}
              values={form[F.finalidade]}
              onChange={(vals) => handle(F.finalidade, vals)}
              idPrefix="finalidade"
            />

            <Select
              label="Quantos dependentes financeiros você possui?"
              required
              options={OPT.dependentes_qtd}
              value={form[F.dependentesQtd]}
              onChange={(v) => handle(F.dependentesQtd, v)}
            />

            <RadioGroup
              label="PERGUNTA CHAVE 02 - Assuma que uma epidemia chegou numa cidade e tem potencial de infectar 600 pessoas. Você precisa escolher o programa de saúde pública que vai salvar essa cidade:"
              required
              options={OPT.chave_02}
              value={form[F.chave02]}
              onChange={(v) => handle(F.chave02, v)}
            />

            <CheckGroup
              label="Especifique o Perfil de Dependentes"
              required
              options={OPT.dependentes_perfil}
              values={form[F.dependentesPerfil]}
              onChange={(vals) => handle(F.dependentesPerfil, vals)}
              idPrefix="dep-perfil"
            />

            <CheckGroup
              label="Qual moeda você tem preferência em estar posicionado?"
              required
              options={OPT.moeda_preferencia}
              values={form[F.moeda]}
              onChange={(vals) => handle(F.moeda, vals)}
              idPrefix="moeda"
            />

            <CheckGroup
              label="Quais investimentos você realizou nos últimos 24 meses?"
              required
              options={OPT.investimentos_24m}
              values={form[F.inv24m]}
              onChange={(vals) => handle(F.inv24m, vals)}
              idPrefix="inv24"
            />

            <Select
              label="Qual o seu grau de interesse em Economia e Mercado Financeiro?"
              required
              options={OPT.interesse_eco}
              value={form[F.interesseEco]}
              onChange={(v) => handle(F.interesseEco, v)}
            />

            <CheckGroup
              label="Quais os tipos de investimentos que você mais se identifica?"
              required
              options={OPT.tipos_invest}
              values={form[F.tiposInvest]}
              onChange={(vals) => handle(F.tiposInvest, vals)}
              idPrefix="tipos"
            />

            <Select
              label="Qual é a necessidade futura dos seus rendimentos?"
              required
              options={OPT.necessidade_rend}
              value={form[F.necessidadeRend]}
              onChange={(v) => handle(F.necessidadeRend, v)}
            />

            <Select
              label="Qual é o seu horizonte de investimento?"
              required
              options={OPT.horizonte}
              value={form[F.horizonte]}
              onChange={(v) => handle(F.horizonte, v)}
            />

            <Select
              label="Possui conhecimento sobre o conceito volatilidade?"
              required
              options={OPT.volatilidade}
              value={form[F.volatilidade]}
              onChange={(v) => handle(F.volatilidade, v)}
            />

            <Select
              label="Como você reagiria caso o seu investimento tivesse uma oscilação de 10%?"
              required
              options={OPT.reacao_10}
              value={form[F.reacao10]}
              onChange={(v) => handle(F.reacao10, v)}
            />

            <Select
              label="Como você reagiria caso o seu investimento tivesse uma oscilação de 30%?"
              required
              options={OPT.reacao_30}
              value={form[F.reacao30]}
              onChange={(v) => handle(F.reacao30, v)}
            />

            <Select
              label="Sobre os conceitos de marcação a mercado em títulos de renda fixa:"
              required
              options={OPT.marcacao_mercado}
              value={form[F.marcacaoMercado]}
              onChange={(v) => handle(F.marcacaoMercado, v)}
            />
          </Section>

          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.lgpd}
              onChange={(e) => handle("lgpd", e.target.checked)}
            />
            Concordo com os termos de uso e a política de privacidade (LGPD)
          </label>

          {/* Botões */}
          <div className="mt-2 flex items-center justify-center gap-3">
            {!requiredOk || loading ? (
              <button
                type="button"
                aria-disabled="true"
                className={cx(
                  "rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow",
                  "opacity-60 cursor-not-allowed"
                )}
                onClick={() => {
                  if (loading) return;
                  if (!isSinglesOk(form)) {
                    showToast(
                      "Preencha todos os campos de seleção única/entrada obrigatórios.",
                      "error"
                    );
                  } else if (!isMultisOk(form)) {
                    showToast(
                      "Selecione ao menos uma opção nos campos de múltipla escolha obrigatórios.",
                      "error"
                    );
                  } else if (!form.lgpd) {
                    showToast(
                      "É necessário aceitar a LGPD para continuar.",
                      "error"
                    );
                  }
                }}
              >
                {loading ? "Enviando..." : "Enviar"}
              </button>
            ) : (
              <button
                type="submit"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow hover:bg-white/90"
              >
                Enviar
              </button>
            )}

            <a
              href="/"
              className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Voltar
            </a>
          </div>
        </form>
      </main>
    </div>
  );
}
