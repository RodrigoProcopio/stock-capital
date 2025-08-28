import React, { useState } from "react";
import logo from "../assets/logo.png";

export default function FormularioApi() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center p-6 font-sans">
      <img src={logo} alt="Stock Capital" className="h-24 w-auto mb-6" />
      <main className="w-full max-w-2xl">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (loading) return;
            setLoading(true);

            const form = e.currentTarget;

            // Honeypot (se preenchido, descarta)
            if (form.hp.value) {
              setLoading(false);
              return;
            }

            const fd = new FormData(form);
            const objetivos = fd.getAll("objetivos"); // array dos checkboxes

            const payload = {
              nome: fd.get("nome"),
              email: fd.get("email"),
              telefone: fd.get("telefone"),
              horizonte: fd.get("horizonte"),
              experiencia: fd.get("experiencia"),
              risco: fd.get("risco"),
              objetivos,
              // opcional: consentimento e timestamp
              lgpd: fd.get("lgpd") === "on",
            };

            try {
              const res = await fetch("/api/form", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              const json = await res.json();
              if (res.ok && json.ok) {
                alert("Formulário enviado com sucesso!");
                form.reset();
              } else {
                console.error(json);
                alert("Erro ao enviar para o Pipefy.");
              }
            } catch (err) {
              console.error(err);
              alert("Erro de conexão. Tente novamente.");
            } finally {
              setLoading(false);
            }
          }}
          className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl"
        >
          <h1 className="text-3xl font-bold text-center">Formulário de API</h1>

          {/* Honeypot anti-spam (oculto) */}
          <input
            type="text"
            name="hp"
            tabIndex="-1"
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {/* Dados pessoais */}
          <div>
            <label className="block text-sm text-white/80" htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              name="nome"
              placeholder="Seu nome"
              required
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80" htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="voce@email.com"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div>
            <label className="block text-sm text-white/80" htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              name="telefone"
              type="tel"
              placeholder="(41) 99999-9999"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Perfil */}
          <div>
            <label className="block text-sm text-white/80" htmlFor="horizonte">Horizonte de investimento</label>
            <select
              id="horizonte"
              name="horizonte"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="Curto (até 1 ano)">Curto (até 1 ano)</option>
              <option value="Médio (1 a 5 anos)">Médio (1 a 5 anos)</option>
              <option value="Longo (5+ anos)">Longo (5+ anos)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/80" htmlFor="experiencia">Nível de experiência</label>
            <select
              id="experiencia"
              name="experiencia"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="Nenhuma">Nenhuma</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/80" htmlFor="risco">Perfil de risco</label>
            <select
              id="risco"
              name="risco"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2"
            >
              <option value="Conservador">Conservador</option>
              <option value="Moderado">Moderado</option>
              <option value="Agressivo">Agressivo</option>
            </select>
          </div>

          {/* Objetivos */}
          <fieldset>
            <legend className="block text-sm text-white/80 mb-2">Objetivos principais</legend>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="objetivos" value="Preservação de capital" />
                <span>Preservação de capital</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="objetivos" value="Renda recorrente" />
                <span>Renda recorrente</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="objetivos" value="Crescimento a longo prazo" />
                <span>Crescimento a longo prazo</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="objetivos" value="Planejamento sucessório" />
                <span>Planejamento sucessório</span>
              </label>
            </div>
          </fieldset>

          {/* Termos */}
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" name="lgpd" required /> Concordo com os termos de uso e a política de privacidade (LGPD)
          </label>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-900 shadow hover:bg-white/90 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar"}
            </button>
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
