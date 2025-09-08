
export default function PoliticaRetencaoLGPD() {
  return (
    <PageLayout
      title="Política de Retenção de Dados"
      subtitle="Prazos, critérios e procedimentos para retenção, exclusão e anonimização."
    >
      <div className="space-y-8 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-brand-navy">Última atualização:</span> 02/09/2025
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">1. Escopo e fundamentos</h2>
          <p>
            Esta política define por quanto tempo mantemos os dados pessoais coletados por meio do site/formulários,
            em conformidade com a LGPD (Lei 13.709/2018) e princípios de minimização e necessidade.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">2. Categorias e prazos</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Contato comercial (lead do formulário público):</strong> até <strong>18 meses</strong> após o último contato ativo.
              Findo o prazo, <em>excluir</em> ou <em>anonimizar</em> (ver item 4).
            </li>
            <li>
              <strong>Registros de consentimento (ts/IP/UA/política):</strong> até <strong>5 anos</strong> após a coleta,
              para <em>defesa de direitos</em> e comprovação de base legal.
            </li>
            <li>
              <strong>Logs técnicos essenciais (segurança/antifraude):</strong> até <strong>6 meses</strong> a <strong>1 ano</strong>,
              conforme necessidade operacional e segurança.
            </li>
            <li>
              <strong>Dados exigidos por obrigação legal/regulatória:</strong> pelo prazo legal/regulatório aplicável.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">3. Onde os dados ficam</h2>
          <p>
            Dados de formulário e consentimento são registrados no Pipefy, no mesmo card do lead (campos
            <code className="mx-1 rounded bg-slate-100 px-1">consent_ts</code>,
            <code className="mx-1 rounded bg-slate-100 px-1">consent_ip</code>,
            <code className="mx-1 rounded bg-slate-100 px-1">consent_ua</code> etc.). Podem existir cópias transitórias
            em provedores de e-mail/infra (ex.: Netlify Functions). Não vendemos dados a terceiros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">4. Exclusão vs. anonimização</h2>
          <p>
            <strong>Exclusão</strong> remove o dado pessoal do repositório. <strong>Anonimização</strong> preserva o registro
            removendo identificadores (ex.: nome, e-mail, telefone), mantendo indicadores estatísticos (ex.: data do consentimento).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">5. Procedimentos no Pipefy</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Manter fases/etiquetas “<em>Ativo</em>”, “<em>Revisar Retenção</em>” e “<em>Expurgo/Anonimizar</em>”.
            </li>
            <li>
              A cada mês, revisar cards com <strong>última interação &gt; 18 meses</strong> e mover para “Expurgo/Anonimizar”.
            </li>
            <li>
              Para <strong>consentimento &gt; 5 anos</strong>, manter apenas evidências mínimas ou anonimizar.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">6. Direitos do titular e exceções</h2>
          <p>
            Solicitações (acesso, correção, exclusão, portabilidade, revogação) devem ser feitas em{" "}
            <a href="/lgpd" className="underline hover:opacity-80">/lgpd</a>. Podemos reter dados necessários ao cumprimento
            de obrigações legais/regulatórias ou defesa de direitos, mesmo após pedido de exclusão.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">7. Segurança e registro</h2>
          <p>
            Usamos HTTPS, controle de acesso e carimbo de consentimento no servidor (timestamp, IP, user-agent).
            Registros de expurgo/anonimização devem ser documentados para auditoria.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">8. Revisão desta política</h2>
          <p>
            Revisão anual ou sempre que houver mudanças relevantes em processos/lei. A versão vigente é a publicada nesta página.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
