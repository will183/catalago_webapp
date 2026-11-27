# Catálogo MVP para hamburguerias, pizzarias e açaís

Catálogo com carrinho que envia o pedido direto para o WhatsApp da loja.
Front-end em HTML, CSS e JavaScript, com dados no Supabase.

## Estrutura

- `index.html`: catálogo e carrinho do cliente
- `painel.html`: painel do lojista (login, produtos e pedidos)
- `css/estilo.css`: estilos
- `js/supabase.js`: conexão com o Supabase
- `js/catalogo.js`: listagem de produtos e carrinho
- `js/pedido.js`: montagem da mensagem e abertura do WhatsApp
- `js/painel.js`: login e área do lojista

## Como configurar

1. Em `js/supabase.js`, troque a URL e a chave anon pelas do seu projeto (Settings > API).
2. Em `js/catalogo.js`, troque `LOJA_ID` pelo id da loja na tabela `lojas`.
3. Abra `index.html` no navegador para testar o catálogo.

## Roteiro

- [x] Etapa 1: tabelas no Supabase
- [ ] Etapa 2: autenticação e regras de acesso (RLS)
- [ ] Etapa 3: painel do lojista
- [ ] Etapa 4: catálogo e carrinho
- [ ] Etapa 5: envio do pedido e gravação no Supabase
- [ ] Etapa 6: teste com um cliente real
