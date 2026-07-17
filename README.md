# Catálogo Hobbit — Mesão do Amor

Site estático com carrinho e finalização pelo WhatsApp.

## Arquivos

- `public/index.html`: estrutura da página.
- `public/styles.css`: somente CSS.
- `public/config.js`: somente configurações JavaScript.
- `public/app.js`: lógica do catálogo e do carrinho.
- `public/assets/`: imagens.
- `wrangler.jsonc`: configuração do Cloudflare Workers Static Assets.

Não existe `package.json` e não há etapa de instalação ou compilação.

## Configuração do WhatsApp

Edite apenas `public/config.js`:

```js
window.MESAO_CONFIG = Object.freeze({
  whatsappNumber: "5511945527935",
  instagram: "@mesao_do_amor",
  catalogName: "Catálogo Hobbit — Mesão do Amor"
});
```

Use o número com DDI + DDD + telefone, somente números.

## Cloudflare usando Workers Builds

- Build command: deixe vazio.
- Deploy command: `npx wrangler deploy`.
- Root directory: deixe vazio.

## Cloudflare Pages usando Git

- Framework preset: None.
- Build command: deixe vazio.
- Build output directory: `public`.

## Links dos produtos para o PDF

Após publicar, substitua `SEU-DOMINIO`:

- `https://SEU-DOMINIO/?produto=collector`
- `https://SEU-DOMINIO/?produto=booster`
- `https://SEU-DOMINIO/?produto=bundle`
- `https://SEU-DOMINIO/?produto=kit-pre`
