# Stock Capital MFO — Website

Site institucional em **React + Vite**, hospedado na **Netlify**, com **Decap CMS** (Netlify CMS) para conteúdo e **Netlify Functions** para integração (ex.: Pipefy). Inclui CSP rígida, lazy-load do gráfico de desempenho e testes E2E com Playwright.

## Stack

* **Frontend:** React 18, Vite, Tailwind
* **Gráficos:** Recharts (lazy-loaded)
* **Conteúdo:** Decap CMS (via `/admin`)
* **Backend (serverless):** Netlify Functions
* **Hospedagem/CI:** Netlify + GitHub Actions
* **Testes E2E:** Playwright

---

## Começando

```bash
# instalar
npm ci

# rodar em dev
npm run dev

# build de produção
npm run build

# prévia de produção
npm run preview
```

> Node 18+ recomendado (o projeto fixa em `"engines": { "node": ">=18" }`).

---

## Variáveis de Ambiente

> As variáveis Vite **precisam** começar com `VITE_` para irem ao bundle do frontend.

| Variável                | Onde é usada                                                     | Obrigatória    | Exemplo                                                  |
| ----------------------- | ---------------------------------------------------------------- | -------------- | -------------------------------------------------------- |
| `VITE_WA_PHONE`         | Botões/ícone de WhatsApp                                         | ✅              | `5541999999999`                                          |
| `VITE_WA_MESSAGE`       | Texto inicial do WhatsApp                                        | ✅              | `Olá! Vim pelo site…`                                    |
| `CORS_ALLOWLIST`        | Allowlist dinâmica para **functions** admin (origins permitidas) | ✅ (para admin) | `https://stockcapitalmfo.com.br,https://app.netlify.com` |
| `ADMIN_SETUP_TOKEN`     | Token para proteger a function de setup do CMS/consent           | ✅ (para admin) | `seu_token_forte`                                        |
| `PIPEFY_TOKEN`          | Token de API (envio de formulários)                              | ✅ (para forms) | `xxxxx`                                                  |
| `PIPEFY_PIPE_ID`        | Pipe alvo no Pipefy                                              | ✅ (para forms) | `123456`                                                 |
| `RATE_LIMIT_MAX`        | Limite de requisições (funções)                                  | opcional       | `30`                                                     |
| `RATE_LIMIT_WINDOW_SEC` | Janela (s) do rate limit                                         | opcional       | `60`                                                     |
| `MAX_BODY_BYTES`        | Tamanho máx. de payload (bytes)                                  | opcional       | `20000`                                                  |
| `DEBUG_PIPEFY`          | Log detalhado nas functions                                      | opcional       | `1`                                                      |

### Onde configurar

* **Local:** crie um `.env.local` (não comite) com suas chaves `VITE_*` para testes.
* **Produção (Netlify):** *Site settings → Build & deploy → Environment → Environment variables*.

  > O deploy **recompila** o bundle com os valores atuais. Se mudar env, rode um deploy.

---

## Conteúdo / CMS (Decap)

O admin vive em `/admin`. Por causa da nossa **CSP** restrita, o bundle do CMS é baixado no build:

* Script `prebuild` baixa `public/admin/decap-cms-3.8.3.js`.
* O painel usa `public/admin/index.html`, `init.js`, `preview.js`, etc.

### Primeira configuração (admin)

1. Defina `ADMIN_SETUP_TOKEN` e `CORS_ALLOWLIST` na Netlify.
2. Chame a function de setup (opcional) para criar campos de consentimento no Pipefy:

   * `POST /.netlify/functions/admin-create-consent-fields`
   * Headers: `x-admin-token: <ADMIN_SETUP_TOKEN>`
   * Body: `{ "pipeId": 123456 }` (ou deixe que use `PIPEFY_PIPE_ID` do ambiente)

---

## Segurança / CSP

As CSPs estão no `netlify.toml` via `[[headers]]`.
Destaques:

* **Site** (`/*`): `default-src 'self'`, bloqueio amplo, inline liberado apenas para `style` (Tailwind).
* **Admin** (`/admin`): permite `'unsafe-eval'` e `wasm-unsafe-eval` **somente** ali para o Decap CMS funcionar.
* **Conexões** devidamente restritas (Netlify Identity, API do Netlify/ Git Gateway etc.).
* **Dica:** se integrar GitHub direto no CMS, libere `connect-src` para `https://api.github.com https://github.com` (comentado no `netlify.toml`).

---

## Funções (APIs)

Pasta: `netlify/functions`.

* `send-to-pipefy.cjs` / `send-contact-to-pipefy.cjs`
  Recebem payloads dos formulários (Site → Functions → Pipefy).
* `consent.js`
  Utilitários de consentimento/LGPD.
* `admin-create-consent-fields.js`
  **Admin-only**: cria campos de consentimento no Start Form (idempotente).
  ✅ Já protegido por `x-admin-token` + `CORS_ALLOWLIST`.
  🔧 Removido CORS `*` estático para evitar confusão (só allowlist dinâmico).

**Endpoints úteis**

* `POST /.netlify/functions/send-contact-to-pipefy`
* `POST /.netlify/functions/send-to-pipefy`
* `POST /.netlify/functions/admin-create-consent-fields` (admin)

---

## Performance

* **Lazy-load** do gráfico `DesempenhoChart` (React.lazy + `<Suspense/>`).
* **Imagens:**

  * Logo (acima da dobra): `loading="eager" decoding="async" fetchpriority="high"`.
  * Outras (abaixo da dobra): `loading="lazy" decoding="async"`.
* **Fonts:** use `<link>` (ou self-host) — evite `@import`.
* **HERO/critico:** background já otimizado.

---

## Testes / CI

### Lint

```bash
npm run lint
```

### E2E (Playwright)

```bash
# headless
npm run test:e2e

# com UI
npm run test:e2e:ui
```

Os testes cobrem:

* **Happy path** do contato (mock da function com resposta 200 e `{ ok: true }`).
* **Validação 400** exibindo toast com campos obrigatórios.

### GitHub Actions

Workflow exemplo (`.github/workflows/ci.yml`) já incluído:

* `lint-build`: instala deps, roda `npm run lint` e `npm run build`.
* `e2e`: instala Playwright e roda `npm run test:e2e`.
* Exporta `VITE_WA_*` via **Secrets** se necessário.

---

## Deploy

* **Netlify** (produção): ao push na `main`, a Netlify faz o build e publica.
* **Headers/Redirects:** gerenciados no `netlify.toml`.
* **Robots/Sitemap:** `public/robots.txt` e `public/sitemap.xml` (estáticos por ora).

---

## Troubleshooting

* **WhatsApp não atualiza após mudar env:**
  Verifique se `VITE_WA_*` está setado no **site** (não só no team), e rode um *deploy* (build sem cache ajuda).
* **Decap CMS falha com CSP:**
  Confirme que o arquivo `public/admin/decap-cms-3.8.3.js` foi baixado (target correto no `prebuild`) e que os headers de `/admin` permitem `'unsafe-eval'`/`wasm-unsafe-eval`.
* **E2E não acha o toast:**
  O teste espera `role="alert"`. O `Toast` precisa do atributo `role="alert"` (já está no componente).
* **Errors de lint em functions Node:**
  O ESLint já está configurado pra ambiente `node:true` nas functions e `browser:true` no frontend.

---

## Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "prebuild": "mkdir -p public/admin && curl -sSL https://unpkg.com/decap-cms@3.8.3/dist/decap-cms.js -o public/admin/decap-cms-3.8.3.js",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "netlify:dev": "netlify dev"
  }
}
```

---

## Licença

Proprietário — Stock Capital MFO. Uso interno/autorizado.

