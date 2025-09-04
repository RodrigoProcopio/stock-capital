// tests/contato.happy.spec.ts
import { test, expect } from '@playwright/test';

test('envio de contato (happy path) mostra toast de sucesso', async ({ page }) => {
  // Mock da function
  await page.route('**/.netlify/functions/send-contact-to-pipefy', route =>
    route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    })
  );

  await page.goto('/#contato');

  // (1) Evita bloqueio da validação nativa do HTML
  await page.evaluate(() => {
    const form = document.querySelector('form[aria-labelledby="contato-title"]');
    form?.setAttribute('novalidate', '');
  });

  // (2) Preenche campos
  await page.locator('#contato-nome').scrollIntoViewIfNeeded();
  await page.fill('#contato-nome', 'Fulano da Silva');

  await page.locator('#contato-telefone').scrollIntoViewIfNeeded();
  await page.fill('#contato-telefone', '+5511999999999');

  await page.locator('#contato-email').scrollIntoViewIfNeeded();
  await page.fill('#contato-email', 'fulano@example.com');

  await page.locator('#contato-mensagem').scrollIntoViewIfNeeded();
  await page.fill('#contato-mensagem', 'Gostaria de falar com a equipe.');

  const lgpd = page.getByRole('checkbox', { name: /Autorizo o tratamento/i });
  await lgpd.scrollIntoViewIfNeeded();
  await lgpd.check();

  const enviar = page.getByRole('button', { name: 'Enviar' });
  await enviar.scrollIntoViewIfNeeded();

  // (3) Clique + esperar pela RESPONSE da função
  await Promise.all([
    page.waitForResponse(resp =>
      resp.url().includes('/.netlify/functions/send-contact-to-pipefy') &&
      resp.request().method() === 'POST'
    ),
    enviar.click(), // { force: true } se precisar
  ]);

  // (4) Validar o toast
  await expect(page.getByRole('alert')).toContainText('Mensagem enviada com sucesso!', {
    timeout: 10000,
  });
});
