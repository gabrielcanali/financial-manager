# Planejamento do financial-manager

## Visao geral da ideia
- Painel financeiro local em JSON para estudo/uso pessoal, focado em importacao/exportacao simples e sem backend externo.
- Organizacao por anos com abas de meses; cada mes traz dados salariais, calendario, movimentacoes, recorrentes, dashboard e infos do apartamento.

## Estado atual do repositorio
- API Express (server/src/server.js) com rotas /api/months e /api/years; validacoes reforcadas (year/month, datas no mes, valores limitados, parcelas 1..36).
- Service de meses com CRUD para dados, calendario, entradas/saidas, recorrentes e agora poupanca/emprestimos; migra legados gerando `id`, agrupa series via `serie_id`, gera parcelas/recorrencias futuras sob demanda e recalcula `total_liquido`.
- Summary service agrega mes/ano (receitas, despesas, saldo disponivel, acumulados de poupanca/emprestimos) com rotas em `months.routes.js` e `years.routes.js`; testes cobrindo meses e resumos.
- Base JSON inicial em server/data/financeiro.json com estrutura atualizada (poupanca/emprestimos). Client segue vazio; README/schema trazem contrato e endpoints.
- Modulo apartamento implementado com rotas `/api/apartment` para registrar parcelas Caixa/Construtora, calcular diferenca vs mes anterior, evolucao de saldo devedor e consolidar no resumo mensal/anual.

## Alinhamento com a ideia
- Organizacao ano/mes, tabelas de entradas/saidas e recorrentes e os resumos mensal/anual (incluindo poupanca/emprestimos e apartamento) ja estao na API.
- Ainda faltam export/import do JSON e backups, calendario colorido/UX e camada de UI.
- Validacoes iniciais de datas/parcelas/limites estao presentes; automacoes de backup e regras visuais da UI permanecem pendentes.

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

5) Cliente web
- Construir SPA simples (Vue) consumindo a API, com estados por ano/mes e cards do modulo apartamento.
- Telas: calendario do mes com destaques de pagamento/fechamento, tabelas de entradas/saidas e recorrentes, dashboard mensal/anual, modulo apartamento com tabela e grafico.
- Controles para importar/exportar JSON e alternar anos/meses.

6) Entrega e operacao
- Scripts npm de dev/build/test, README explicando rotas, formato do JSON e como iniciar backend/frontend.
- Automatizar verificacao de consistencia (lint, testes), endpoints de export/import/backups e adicionar seeds ou exemplos para novos usuarios.

## Proxima fase priorizada (Fase 5 - Cliente web)
- Subir SPA inicial em Vue consumindo as rotas prontas (`/months`, `/summary`, `/apartment`), com navegacao por ano/mes.
- Renderizar tabelas de lancamentos, poupanca/emprestimos e cards/grafico do modulo apartamento usando `/apartment/evolution`.
- Incluir acoes de import/export do JSON local, feedbacks de validacao das rotas e estilo minimo compartilhado para dashboards.
