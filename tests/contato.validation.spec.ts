// tests/contato.validation.spec.ts
import { test, expect } from '@playwright/test';

test('mostra aviso quando faltam campos obrigatórios', async ({ page }) => {
  // Mock 400 com a mensagem esperada
  await page.route('**/.netlify/functions/send-contact-to-pipefy', route =>
    route.fulfill({
      status: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: 'Campos obrigatórios ausentes.',
        missing: ['nome', 'email'],
      }),
    })
  );

  await page.goto('/#contato');

  // Desativa validação nativa (senão o navegador barra o submit)
  await page.evaluate(() => {
    const form = document.querySelector('form[aria-labelledby="contato-title"]');
    form?.setAttribute('novalidate', '');
  });

  // Preenche só a mensagem e aceita LGPD
  await page.fill('#contato-mensagem', 'Teste de validação');
  await page.getByRole('checkbox', { name: /Autorizo o tratamento/i }).check();

  // Clique + aguardar request
  await Promise.all([
    page.waitForRequest('**/.netlify/functions/send-contact-to-pipefy'),
    page.getByRole('button', { name: 'Enviar' }).click(),
  ]);

  // Confere o toast construído do payload mockado
  await expect(page.getByRole('alert')).toContainText('Preencha: nome, email');
});
