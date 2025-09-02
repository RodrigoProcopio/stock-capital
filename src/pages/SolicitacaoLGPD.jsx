import React, { useState } from "react";
import PageLayout from "../components/PageLayout";

export default function SolicitacaoLGPD() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState("acesso");
  const [mensagem, setMensagem] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setOk(false);
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lgpd_request",
          nome,
          email,
          tipo,
          mensagem,
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Falha ao enviar solicitação LGPD");
      }
      setOk(true);
      setNome("");
      setEmail("");
      setMensagem("");
      setTipo("acesso");
    } catch (e) {
      setErr(e?.message || "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout
      title="Solicitação LGPD"
      subtitle="Exerça seus direitos como titular de dados (art. 18, LGPD)."
    >
      <div className="space-y-6 text-sm text-slate-700 max-w-2xl">
        <p>
          Preencha o formulário abaixo para solicitar acesso, correção, exclusão, portabilidade ou revogação de consentimento.
          Responderemos em até <strong>15 dias</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-navy">Nome</label>
            <input
              className="mt-1 w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy">E-mail</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@dominio.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy">Tipo de solicitação</label>
            <select
              className="mt-1 w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="acesso">Acesso</option>
              <option value="correcao">Correção</option>
              <option value="exclusao">Exclusão</option>
              <option value="portabilidade">Portabilidade</option>
              <option value="revogacao">Revogação de consentimento</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-navy">
              Detalhes (opcional)
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-brand-navy/20 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-brand-navy/30"
              rows={5}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Inclua informações que nos ajudem a localizar seus dados."
            />
          </div>

          <button
            className="rounded-xl bg-brand-navy text-white px-5 py-2 text-sm font-semibold shadow-sm hover:brightness-110 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>

        {ok && (
          <p className="text-emerald-700">
            Solicitação enviada. Você receberá instruções por e-mail.
          </p>
        )}
        {err && <p className="text-red-700">Erro: {err}</p>}

        <p className="text-xs text-slate-500">
          Ao enviar, você reconhece nossa{" "}
          <a href="/privacidade" className="underline hover:opacity-80">
            Política de Privacidade
          </a>
          .
        </p>
      </div>
    </PageLayout>
  );
}
