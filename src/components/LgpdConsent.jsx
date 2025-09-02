import React from "react";
import { Link } from "react-router-dom";

/**
 * Componente reutilizável de consentimento LGPD
 * - NÃO vem pré-marcado (consentimento livre e informado)
 * - "required" força a marcação para envio do formulário
 * - Texto traz finalidade, retenção e links obrigatórios
 */
export default function LgpdConsent({
  checked,
  onChange,
  policyUrl = "/privacidade",
  termsUrl = "/termos",
}) {
  return (
    <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          aria-required
          required
        />
        <span className="text-sm text-slate-800 leading-relaxed">
          Declaro que <strong>li e concordo</strong> com o tratamento dos meus dados
          pessoais para a <strong>finalidade</strong> de contato e avaliação do meu
          perfil financeiro, conforme a{" "}
          <Link to={policyUrl} className="underline">
            Política de Privacidade
          </Link>{" "}
          e os{" "}
          <Link to={termsUrl} className="underline">
            Termos de Uso
          </Link>
          . Os dados serão <strong>armazenados pelo período necessário</strong> para
          essa finalidade e, após esse prazo, poderão ser{" "}
          <strong>anonimizados ou excluídos</strong>, salvo obrigações legais. Posso{" "}
          <strong>revogar o consentimento</strong> e exercer meus direitos (acesso,
          correção, exclusão, portabilidade, oposição) pelo fluxo{" "}
          <Link to="/lgpd" className="underline">
            Solicitação LGPD
          </Link>
          .
        </span>
      </label>
    </div>
  );
}
