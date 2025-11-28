# Planejamento do financial-manager

## Visao geral da ideia
- Painel financeiro local em JSON para estudo/uso pessoal, focado em importacao/exportacao simples e sem backend externo.
- Organizacao por anos com abas de meses; cada mes traz dados salariais, calendario, movimentacoes, recorrentes, dashboard e infos do apartamento.

## Estado atual do repositorio
- API Express (server/src/server.js) com rotas /api/months e validacoes reforcadas (year/month, datas no mes, valores limitados, parcelas 1..36).
- Service de meses com CRUD para dados, calendario, entradas/saidas e recorrentes; migra dados legados gerando `id`, agrupa series via `serie_id`, gera parcelas/recorrencias futuras sob demanda e recalcula `total_liquido`.
- Controlador/rotas expostas em `server/src/routes/months.routes.js` para GET/PUT/POST/DELETE de meses, entradas e recorrentes, com flags de `generateFuture` e `cascade` para parcelamento/recorrencia.
- Base JSON inicial em server/data/financeiro.json com exemplo para 2025-01. Client ainda vazio; README atualizado com rotas e flags das novas automacoes.

## Alinhamento com a ideia
- Organizacao ano/mes e tabelas de entradas/saidas e recorrentes ja aparecem na estrutura do JSON e nas rotas de mes.
- Ainda faltam dashboard (resumo mensal/anual, poupanca, emprestimos), calendario colorido, parcelamento/recorrencia automatica, calculo de totais e telas do apartamento.
- Nao ha validacoes ou regras de negocio implementadas (divisao 40/60 do salario, total liquido, parcelas, diferenca de parcelas da Caixa/Construtora) nem camada de UI.

## Roteiro sugerido de desenvolvimento
1) Fundacao e contrato de dados (concluido)
- Schema documentado em `docs/schema.md`, validacoes iniciais aplicadas nas rotas, CRUD basico implementado e testes de service.

2) Fluxo de meses e recorrencias (entregue)
- Calculo automatico de totais por mes (saldo, total liquido), parcelamento com geracao de parcelas futuras (1..36) e serie (`serie_id`) para edicao em cascata.
- Recorrencias com geracao ate `termina_em`, atualizacao em cascata e migracao de IDs legados.

3) Dashboard e resumos
- Agregadores mensais/anuais (saldo acumulado, gasto vs renda, metas de poupanca) e endpoints dedicados.
- Registro de emprestimos feitos/recebidos e integracao desses valores no saldo e no dashboard.
- Endpoints para exportar/importar o JSON e backups locais.

4) Modulo apartamento
- Endpoints para registrar parcelas Caixa e Construtora por mes, calculando diferenca versus mes anterior.
- Calcular evolucao do saldo devedor e retornar dados para grafico de evolucao de parcelas.

5) Cliente web
- Construir SPA simples (Vue) consumindo a API, com estados por ano/mes.
- Telas: calendario do mes com destaques de pagamento/fechamento, tabelas de entradas/saidas e recorrentes, dashboard mensal/anual, modulo apartamento com tabela e grafico.
- Controles para importar/exportar JSON e alternar anos/meses.

6) Entrega e operacao
- Scripts npm de dev/build/test, README explicando rotas, formato do JSON e como iniciar backend/frontend.
- Automatizar verificacao de consistencia (lint, testes) e adicionar seeds ou exemplos para novos usuarios.

## Proxima fase priorizada (Fase 3 - Dashboard e resumos)
- Implementar agregadores mensais/anuais no service (saldo acumulado, gasto vs renda, metas de poupanca, percentuais) retornando um payload de dashboard.
- Criar endpoints dedicados para esses resumos (ex.: `/months/:year/summary` e `/years/:year/summary`) consumindo entradas, parcelas e recorrencias ja persistidas.
- Incluir registro inicial de poupanca/emprestimos no JSON e garantir que participem dos totais do dashboard.
- Adicionar testes cobrindo os agregadores (incluindo cenarios com parcelas futuras e recorrentes geradas) e documentar os formatos no README/schema.
