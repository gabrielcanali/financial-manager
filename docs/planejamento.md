# Planejamento do financial-manager

## Visao geral da ideia
- Painel financeiro local em JSON para estudo/uso pessoal, focado em importacao/exportacao simples e sem backend externo.
- Organizacao por anos com abas de meses; cada mes traz dados salariais, calendario, movimentacoes, recorrentes, dashboard e infos do apartamento.

## Estado atual do repositorio
- API Express (server/src/server.js) com rotas /api/months e validacao basica (year/month, datas ISO, valores, parcela).
- Service de meses com CRUD para dados, calendario, entradas/saidas e recorrentes; gera `id` (UUID) e recalcula `total_liquido` automaticamente.
- Controlador/rotas expostas em `server/src/routes/months.routes.js` para GET/PUT/POST/DELETE de meses, entradas e recorrentes.
- Base JSON inicial em server/data/financeiro.json com exemplo para 2025-01. Client ainda vazio e README atualizado com rotas.

## Alinhamento com a ideia
- Organizacao ano/mes e tabelas de entradas/saidas e recorrentes ja aparecem na estrutura do JSON e nas rotas de mes.
- Ainda faltam dashboard (resumo mensal/anual, poupanca, emprestimos), calendario colorido, parcelamento/recorrencia automatica, calculo de totais e telas do apartamento.
- Nao ha validacoes ou regras de negocio implementadas (divisao 40/60 do salario, total liquido, parcelas, diferenca de parcelas da Caixa/Construtora) nem camada de UI.

## Roteiro sugerido de desenvolvimento
1) Fundacao e contrato de dados (concluido)
- Schema documentado em `docs/schema.md`, validacoes iniciais aplicadas nas rotas, CRUD basico implementado e testes de service.

2) Fluxo de meses e recorrencias
- Calculo automatico de totais por mes (saldo, total liquido) ja implementado; falta parcelamento e recorrencia distribuida em meses futuros.
- Suporte a parcelamento/recorrencia: gerar parcelas futuras, marcar ultima parcela, evitar duplicatas, e possivel edicao em cascata.

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

## Proxima fase priorizada (Fase 2 - Parcelas, recorrencia e consistencia)
- Migrar dados legados em `server/data/financeiro.json` gerando `id` para lancamentos/recorrentes para permitir update/delete.
- Implementar geracao de parcelas e recorrencias futuras (ex.: criar N parcelas automaticas em meses subsequentes), com controle de ultima parcela e evitacao de duplicatas.
- Adicionar endpoints/flags para aplicar edicoes em cascata (ex.: atualizar valor de todas parcelas restantes).
- Fortalecer validacoes: limites para valores/data, evitar datas fora do mes, garantir que parcela `n/m` corresponda ao total de parcelas geradas.
- Cobrir os novos fluxos com testes de unidade/integracao (parcelamento, recorrencia futura e recalc de totais).
