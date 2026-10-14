# Copa Madu — Cloudflare Workers + D1

Código completo, imagens e painel /admin. O D1 é o banco gerenciado da Cloudflare
compatível com SQLite. Pessoas, times e placares ficam no D1 e são compartilhados
entre celulares e computadores. Esta exportação não inclui dados do banco do Sites.

## Banco já configurado desta instalação

O wrangler.jsonc já aponta para o banco D1 **copa-db**, com binding **DB**
e database_id **9734e6cd-627d-4e07-a4d2-ad88dffb9c90**.
Não é necessário criar outro banco. Antes do primeiro deploy, prepare as tabelas:

```sh
npm ci
npx wrangler login
npm run db:remote
```

Depois execute npm run deploy ou inicie um novo build na Cloudflare.
Criar o D1 no painel não cria automaticamente as tabelas da aplicação.

## Instalar em outro banco ou outra conta

Use Node.js 22.16 ou superior. Extraia esta pasta, abra o terminal nela e execute:

```sh
npm ci
npx wrangler login
npm run db:create
```

O último comando informa o database_id (UUID). Copie esse ID e execute:

```sh
npm run configure:cloudflare -- COLE_O_UUID_DO_BANCO
npm run db:remote
npm run deploy
```

Troque COLE_O_UUID_DO_BANCO pelo ID real, sem as palavras de exemplo.
O deploy informa a URL do site. Acesse essa URL com /admin para os cadastros e placares.
Se o banco já existe, pule db:create e use o UUID existente. Para outro nome:
`npm run configure:cloudflare -- UUID nome-do-banco nome-do-worker`.
O comando db:remote aplica as migrações pendentes; não apaga dados já cadastrados.
Se você tiver várias contas Cloudflare, configure account_id em wrangler.jsonc.

## Deploy automático por Git no painel da Cloudflare

Crie ou use um projeto em **Workers & Pages > Create > Worker > conectar repositório**.
Envie o conteúdo desta pasta ao repositório, incluindo package-lock.json e o
wrangler.jsonc já configurado com o UUID real. O nome do Worker no painel deve ser
igual ao name de wrangler.jsonc (padrão: copa-madu).

Configurações de build:

| Campo | Valor |
|---|---|
| Build command | deixar vazio |
| Deploy command | npm run deploy |
| Root directory | pasta contendo package.json; vazio se na raiz |
| Variável NODE_VERSION | 22.16.0 |

O comando npm run deploy executa o build com Vite e depois publica o Worker
compilado em dist/server. Ele funciona mesmo sem um build anterior. Se você
mantiver npm run build no campo Build command, também funciona, mas compila duas vezes.
O comando padrão npx wrangler deploy também é suportado: wrangler.jsonc
executa o build pelo Vite antes de publicar dist/server/index.js e dist/client.

Antes do primeiro deploy automático, aplique as tabelas com npm run db:remote
no terminal autenticado. As próximas migrações também devem ser aplicadas antes
de publicar mudanças que dependem delas. O deploy automático não precisa de
permissão para alterar o banco. Se ativar builds de outras branches, use
npm run preview como Preview command e um D1 separado para testes com dados.

Este projeto tem API e banco: publique como **Worker**, com os assets gerados
pelo build. Não envie apenas dist/client como site estático.

## Rodar localmente

```sh
npm ci
npm run db:local
npm run dev
```

Site: http://127.0.0.1:5173 — painel: http://127.0.0.1:5173/admin.
O banco local usa SQLite em .wrangler/state e é separado do banco remoto.
Para testar o build de produção: npm run build e npm start.

## Verificações

```sh
npm test
npm run typecheck
npm run deploy:check
```

deploy:check executa o build e valida o pacote, sem publicá-lo e sem exigir conta Cloudflare.

## Erro virtual:vinext-worker-entry

Esse módulo é resolvido pelo plugin Vinext durante o build do Vite. O Wrangler
não consegue compilar diretamente worker/index.ts. Não crie um alias para
esse módulo. A configuração raiz aponta para o Worker já compilado e inclui
um custom build que gera esse arquivo antes do deploy. O Vite usa a entrada
fonte por meio de sua própria configuração, sem executar outro custom build.

No painel da Cloudflare, em Settings > Build, deixe Build command vazio.
Deploy command pode ser npm run deploy ou o padrão npx wrangler deploy.
Depois inicie um novo build do commit mais recente. Não reexecute um build
preso em um commit anterior à correção.

## Correção do ERESOLVE

Versões fixadas: wrangler 4.151.0, @cloudflare/workers-types 5.20261014.1
e @cloudflare/vite-plugin 1.64.0. O package-lock.json foi gerado para essas versões.
Não use --force ou --legacy-peer-deps. Substitua também o package-lock.json
antigo ao atualizar o repositório e use npm ci.

## Arquivos principais

- app/board.tsx e app/globals.css: site público.
- app/admin/panel.tsx: pessoas, times, substitutos e placares.
- app/lib/tournament.ts: grupos, classificação, chaveamento e conflitos de jogadores.
- app/api/championship/route.ts: leitura e atualização dos dados.
- drizzle/: migrações SQL do D1.
- wrangler.jsonc: nome do Worker, assets e binding DB.

O painel continua sem login, acessível diretamente em /admin, como solicitado.

Documentação: https://developers.cloudflare.com/d1/get-started/
e https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
