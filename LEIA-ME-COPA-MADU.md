# Copa Madu — código-fonte

Este pacote contém o código da versão publicada, as imagens, os estilos,
o painel administrativo e a estrutura do banco de dados.

## Arquivos principais

- app/board.tsx: página visual do campeonato.
- app/page.tsx: entrada da página principal.
- app/globals.css: aparência do site.
- app/admin/page.tsx: painel de cadastro e placares.
- app/admin/admin.css: aparência do painel administrativo.
- app/lib/tournament.ts: regras, classificação e chaveamento.
- app/api/championship/route.ts: leitura e salvamento dos dados.
- db/ e drizzle/: estrutura e migração do banco Cloudflare D1.
- public/madu.png: foto da Madu.

## Rodar no computador

Requer Node.js 22.13 ou superior e npm. Abra um terminal dentro da pasta extraída.

1. Instale as dependências:
   npm ci

2. Gere o projeto e a configuração do banco local:
   npm run build

3. Prepare o banco local (execute uma vez em uma instalação nova):
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_dark_king_bedlam.sql

4. Inicie a prévia:
   npm run dev

5. Abra http://127.0.0.1:5173/ para o site e
   http://127.0.0.1:5173/admin para cadastrar times e placares.

O banco local é separado do banco do site publicado. Este ZIP contém o código;
os times e placares do site ficam no banco hospedado e não acompanham o ZIP.
O painel administrativo não exige login nesta versão.

## Publicação

O projeto usa React, TypeScript e Vinext/Vite, com servidor Cloudflare Workers e D1.
A configuração .openai/hosting.json identifica o site existente no Sites.
Para hospedar em outro serviço, a parte de servidor e o banco D1 precisam ser configurados.

Commit de origem: 5406affe040ae945cf68711528d0aadb02184dbb
