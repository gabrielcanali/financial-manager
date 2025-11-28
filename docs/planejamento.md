# Planejamento do financial-manager

## Visao geral da ideia
- Painel financeiro local em JSON para estudo/uso pessoal, focado em importacao/exportacao simples e sem backend externo.
- Organizacao por anos com abas de meses; cada mes traz dados salariais, calendario, movimentacoes, recorrentes, dashboard e infos do apartamento.

## Estado atual do repositorio
- API Express (server/src/server.js) com rotas /api/months e /api/years; validacoes reforcadas (year/month, datas no mes, valores limitados, parcelas 1..36).
- Service de meses com CRUD para dados, calendario, entradas/saidas, recorrentes e agora poupanca/emprestimos; migra legados gerando `id`, agrupa series via `serie_id`, gera parcelas/recorrencias futuras sob demanda e recalcula `total_liquido`.
- Summary service agrega mes/ano (receitas, despesas, saldo disponivel, acumulados de poupanca/emprestimos) com rotas em `months.routes.js` e `years.routes.js`; testes cobrindo meses e resumos.
- Base JSON inicial em server/data/financeiro.json com estrutura atualizada (poupanca/emprestimos). Client segue vazio; README/schema trazem contrato e endpoints.

## Alinhamento com a ideia
- Organizacao ano/mes, tabelas de entradas/saidas e recorrentes e os resumos mensal/anual (incluindo poupanca/emprestimos) ja estao na API.
- Ainda faltam export/import do JSON e backups, calendario colorido/UX, modulo apartamento e camada de UI.
- Validacoes iniciais de datas/parcelas/limites estao presentes; regras especificas de apartamento e automacoes de backup permanecem pendentes.

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

4) Modulo apartamento
- Endpoints para registrar parcelas Caixa e Construtora por mes, calculando diferenca versus mes anterior.
- Calcular evolucao do saldo devedor e retornar dados para grafico de evolucao de parcelas.

5) Cliente web
- Construir SPA simples (Vue) consumindo a API, com estados por ano/mes.
- Telas: calendario do mes com destaques de pagamento/fechamento, tabelas de entradas/saidas e recorrentes, dashboard mensal/anual, modulo apartamento com tabela e grafico.
- Controles para importar/exportar JSON e alternar anos/meses.

6) Entrega e operacao
- Scripts npm de dev/build/test, README explicando rotas, formato do JSON e como iniciar backend/frontend.
- Automatizar verificacao de consistencia (lint, testes), endpoints de export/import/backups e adicionar seeds ou exemplos para novos usuarios.

## Proxima fase priorizada (Fase 4 - Modulo apartamento)
- Definir estrutura de dados para financiamento da Caixa e entrada da Construtora (parcelas por mes, diferenca vs mes anterior, saldo devedor).
- Implementar endpoints para registrar/atualizar essas parcelas e expor resumo para grafico de evolucao.
- Integrar o modulo apartamento ao dashboard/resumos anuais, mantendo validacoes de datas/valores e cobrindo com testes e documentacao.
