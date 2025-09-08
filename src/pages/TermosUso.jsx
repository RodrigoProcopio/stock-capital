
export default function TermosUso() {
  return (
    <PageLayout
      title="Termos de Uso"
      subtitle="Regras de utilização do site e do formulário."
    >
      <div className="space-y-8 text-sm text-slate-700">
        <p>
          <span className="font-semibold text-brand-navy">Última atualização:</span> 02/09/2025
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">1. Aceitação</h2>
          <p>
            Ao acessar ou utilizar este site, você concorda com estes Termos de Uso e com a nossa{" "}
            <Link to="/privacidade" className="underline hover:opacity-80">Política de Privacidade</Link>. Caso não concorde, não utilize os serviços.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">2. Serviços oferecidos</h2>
          <p>
            O site fornece informações institucionais e um formulário de suitability para avaliação de perfil
            financeiro. O conteúdo tem caráter informativo e não constitui recomendação de investimento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">3. Responsabilidades do usuário</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fornecer informações verdadeiras e atualizadas ao preencher o formulário.</li>
            <li>Utilizar os serviços de forma ética e conforme a legislação vigente.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">4. Propriedade intelectual</h2>
          <p>
            Todos os direitos de propriedade intelectual sobre o conteúdo, marcas e layout pertencem à Stock
            Capital ou a seus licenciantes. É vedada a reprodução sem autorização prévia.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">5. Limitação de responsabilidade</h2>
          <p>
            Não garantimos que o site estará disponível de forma ininterrupta ou livre de erros. Não nos
            responsabilizamos por danos decorrentes de uso indevido das informações disponibilizadas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">6. Alterações</h2>
          <p>
            Reservamo-nos o direito de modificar estes Termos a qualquer momento. A versão atualizada será
            publicada nesta página.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-brand-navy">7. Contato</h2>
          <p>
            Em caso de dúvidas, entre em contato pelo e-mail{" "}
            <a href="mailto:contato@stockcapital.com.br" className="underline hover:opacity-80">
              contato@stockcapital.com.br
            </a>.
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
