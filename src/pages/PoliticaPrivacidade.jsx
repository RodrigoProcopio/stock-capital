import PageLayout from "../components/PageLayout.jsx";

export default function PoliticaPrivacidade() {
  return (
    <PageLayout
      title="Política de Privacidade"
      subtitle="Como coletamos, usamos e protegemos seus dados pessoais."
    >
      <div className="space-y-8 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-brand-navy">Última atualização:</span> 02/09/2025
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">1. Controlador e Contato</h2>
          <p>
            Stock Capital Multi Family Office (“Controlador”).<br />
            Encarregado (DPO):{" "}
            <a href="mailto:dpo@stockcapital.com.br" className="underline hover:opacity-80">
              dpo@stockcapital.com.br
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">2. Dados que tratamos</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Identificação e contato: nome, e-mail, telefone.</li>
            <li>Dados fornecidos no formulário (ex.: renda, preferências).</li>
            <li>Dados técnicos: endereço IP, user agent, registros de consentimento.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">3. Finalidades e bases legais</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Atendimento a solicitações e contato comercial — <em>consentimento</em> (art. 7º, I) e/ou
              <em> execução de contrato</em> (art. 7º, V).
            </li>
            <li>
              Avaliação de perfil e adequação de serviços — <em>consentimento</em> (art. 7º, I).
            </li>
            <li>
              Cumprimento de obrigações legais e regulatórias — <em>obrigação legal</em>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">4. Compartilhamentos</h2>
          <p>
            Prestadores de serviços (infra, e-mail, automações como Pipefy) estritamente para as finalidades acima,
            mediante acordos de tratamento e confidencialidade.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">5. Retenção de dados</h2>
          <p>
            Aplicamos a nossa{" "}
            <a href="/docs/politica-retencao-lgpd" className="underline hover:opacity-80">
              Política de Retenção
            </a>
            . Em resumo: contatos de formulário por até 18 meses após o último contato ativo; logs de consentimento por
            até 5 anos (defesa de direitos). Após os prazos, dados são anonimizados ou excluídos, salvo obrigação legal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">6. Direitos do titular</h2>
          <p>
            Você pode solicitar acesso, correção, exclusão, portabilidade, revogação do consentimento e informações
            adicionais por meio do canal{" "}
            <a href="/lgpd" className="underline hover:opacity-80">
              Solicitação LGPD
            </a>
            . Prazo de resposta: até 15 dias.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">7. Segurança</h2>
          <p>
            Utilizamos criptografia em trânsito (HTTPS), controles de acesso e registro de consentimento com
            timestamp, IP e user-agent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">8. Transferências internacionais</h2>
          <p>
            Se ocorrerem, serão amparadas por garantias adequadas (contratuais e técnicas).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">9. Atualizações desta política</h2>
          <p>
            Podemos atualizar este documento; a versão vigente será sempre publicada nesta página.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
