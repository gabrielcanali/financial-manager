# Planejamento do financial-manager

## Visao geral da ideia
- Painel financeiro local em JSON para estudo/uso pessoal, focado em importacao/exportacao simples e sem backend externo.
- Organizacao por anos com abas de meses; cada mes traz dados salariais, calendario, movimentacoes, recorrentes, dashboard e infos do apartamento.

## Estado atual do repositorio
- API Express (server/src/server.js) com rotas /api/months e /api/years; validacoes reforcadas (year/month, datas no mes, valores limitados, parcelas 1..36).
- Service de meses com CRUD para dados, calendario, entradas/saidas, recorrentes e agora poupanca/emprestimos; migra legados gerando `id`, agrupa series via `serie_id`, gera parcelas/recorrencias futuras sob demanda e recalcula `total_liquido`.
- Summary service agrega mes/ano (receitas, despesas, saldo disponivel, acumulados de poupanca/emprestimos) com rotas em `months.routes.js` e `years.routes.js`; testes cobrindo meses e resumos.
- Base JSON inicial em server/data/financeiro.json com estrutura atualizada (poupanca/emprestimos). Client agora possui SPA em `client/index.html` (Vue via CDN) consumindo a API com filtros de ano/mes, cards, tabelas, exportacao de snapshot e acoes de admin.
- Modulo apartamento implementado com rotas `/api/apartment` para registrar parcelas Caixa/Construtora, calcular diferenca vs mes anterior, evolucao de saldo devedor e consolidar no resumo mensal/anual.
- Servidor Express tambem serve o cliente estatico em `/`, mantendo API em `/api`. Endpoints de admin adicionados (`/admin/export`, `/admin/import`, `/admin/backup`) para operacao sobre o JSON.

## Alinhamento com a ideia
- Organizacao ano/mes, tabelas de entradas/saidas e recorrentes e os resumos mensal/anual (incluindo poupanca/emprestimos e apartamento) ja estao na API.
- API cobre fluxo financeiro, apartamento e operacoes de export/import/backup; UI basica entregue com navegacao ano/mes e dashboards mensais/anuais.
- Ainda faltam refinamentos visuais/feedbacks da SPA e um ciclo de build/teste integrado (lint, etc.).
- Validacoes iniciais de datas/parcelas/limites estao presentes; rotinas de admin agora expostas e precisam de hardening/monitoracao futura.

## Roteiro sugerido de desenvolvimento
1) Fundacao e contrato de dados (concluido)
- Schema documentado em `docs/schema.md`, validacoes iniciais aplicadas nas rotas, CRUD basico implementado e testes de service.

2) Fluxo de meses e recorrencias (entregue)
- Calculo automatico de totais por mes (saldo, total liquido), parcelamento com geracao de parcelas futuras (1..36) e serie (`serie_id`) para edicao em cascata.
- Recorrencias com geracao ate `termina_em`, atualizacao em cascata e migracao de IDs legados.

3) Dashboard e resumos (entregue)
- Agregadores mensais/anuais com saldo disponivel, poupanca acumulada e emprestimos (endpoints `/months/:year/:month/summary` e `/years/:year/summary`).
- Rotas para registrar poupanca e emprestimos por mes, mantendo validacoes e IDs para edicao futura.
- Tests, README e schema atualizados. Export/import de JSON e backups ficam para a etapa de entrega/operacao.

4) Modulo apartamento (entregue)
- Endpoints `PUT/GET /apartment/:year/:month` para registrar parcelas Caixa e Construtora por mes, calculando diferenca versus mes anterior e variacao de saldo devedor.
- Serie de evolucao em `/apartment/evolution` para grafico consolidado e injecao de totais no resumo mensal/anual.

5) Cliente web (entregue - iterar UI)
- SPA em `client/index.html` usando Vue via CDN, consumindo `/api` com filtros de ano/mes, resumos mensais/anuais, tabelas de entradas/recorrentes/poupanca/emprestimos e cards do modulo apartamento com grafico SVG simples da evolucao.
- Exportacao local de snapshot (meses carregados + resumo anual + evolucao do apartamento) e import/export via API de admin (enviar JSON completo, gerar backup, baixar estado atual).

6) Entrega e operacao (entregue - primeira versao)
- Servidor agora serve o cliente estatico e adiciona rotas `/admin/export`, `/admin/import`, `/admin/backup`.
- README atualizado com comandos e rotas; server aceita JSON maior (limite 5mb) e exposicao do caminho do DB para backups.
- SPA consumindo novas rotas de admin (exportar, backup e importar arquivo lido).

## Proxima fase priorizada (Iteracao de qualidade - Fase 7)
- Harden dos endpoints de admin (validacoes extra, logs, opcao de backup automatico ao importar).
- Ajustar feedbacks de erro/sucesso na SPA (toasts/banners) e refinamentos visuais de navegacao.
- Adicionar scripts de lint/test padrao (por exemplo eslint) e exemplos/seeds opcionais para novos usuarios.
