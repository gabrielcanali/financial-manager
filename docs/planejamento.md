# Planejamento do financial-manager

## Visao geral da ideia
- Painel financeiro local em JSON para estudo/uso pessoal, focado em importacao/exportacao simples e sem backend externo.
- Organizacao por anos com abas de meses; cada mes traz dados salariais, calendario, movimentacoes, recorrentes, dashboard e infos do apartamento.

## Estado atual do repositorio
- API Express (server/src/server.js) com rotas /api/months e /api/years; validacoes reforcadas (year/month, datas no mes, valores limitados, parcelas 1..36).
- Service de meses com CRUD para dados, calendario, entradas/saidas, recorrentes e agora poupanca/emprestimos; migra legados gerando `id`, agrupa series via `serie_id`, gera parcelas/recorrencias futuras sob demanda e recalcula `total_liquido`.
- Summary service agrega mes/ano (receitas, despesas, saldo disponivel, acumulados de poupanca/emprestimos) com rotas em `months.routes.js` e `years.routes.js`; testes cobrindo meses e resumos.
- Base JSON inicial em server/data/financeiro.json com estrutura atualizada (poupanca/emprestimos). Front refeito com stack Vite + Vue 3 + Tailwind + Pinia em `client/`, com dashboards mais ricos, proxy de dev para `/api`, CRUD completo (lancamentos, recorrentes, poupanca e emprestimos) e operacoes de admin centralizadas no store.
- SPA agora usa vue-router com sidebar, guardas de rota (bloqueio sem base), layout por rota (dashboard, apartamento, emprestimos, visao mensal e recorrentes) e breadcrumbs/atalhos entre telas.
- Dashboard V2 entrega barra de quick actions (fatura e admin), cards de quanto posso gastar/proximas faturas/resumos e grafico de fluxo diario ligado ao store.
- Modulo apartamento implementado com rotas `/api/apartment` para registrar parcelas Caixa/Construtora, calcular diferenca vs mes anterior, evolucao de saldo devedor e consolidar no resumo mensal/anual.
- Servidor Express serve o cliente estatico em `/`, priorizando `client/dist` (build do Vite) e caindo para `client/` quando nao houver build; API segue em `/api`. Endpoints de admin adicionados (`/admin/export`, `/admin/import`, `/admin/backup`) para operacao sobre o JSON, agora com logs e opcao de backup automatico no import.
- Onboarding conectado: `/admin/status`, `/admin/validate` e `/admin/bootstrap` detectam ausencia de base, validam o JSON antes de importar e permitem criar um arquivo inicial com configuracoes (fechamento e adiantamento).

## Alinhamento com a ideia
- Organizacao ano/mes, tabelas de entradas/saidas e recorrentes e os resumos mensal/anual (incluindo poupanca/emprestimos e apartamento) ja estao na API.
- API cobre fluxo financeiro, apartamento e operacoes de export/import/backup; UI basica entregue com navegacao ano/mes e dashboards mensais/anuais.
- Ainda faltam refinamentos visuais/feedbacks da SPA e um ciclo de build/teste integrado (lint, etc.).
- Validacoes iniciais de datas/parcelas/limites estao presentes; rotinas de admin agora expostas e precisam de hardening/monitoracao futura.
- Onboarding do front cobre o caso sem JSON, validando o arquivo local antes do import e permitindo bootstrap de base com configuracao inicial.


## Sintese da ideia V2 (Front e onboarding)
- Tela de boas vindas exibida quando nao houver JSON carregado, oferecendo importar um arquivo existente ou criar uma nova base com configuracao inicial.
- Configuracoes iniciais: data de fechamento da fatura, indicacao de adiantamento de salario, dia do adiantamento e percentual adiantado, gravadas junto ao JSON criado/carregado.
- Barra lateral com rotas: Dashboard (Quick Action para cadastrar fatura, cards de resumo mensal, saldo disponivel/quanto posso gastar, proximas faturas, resumo anual e grafico de fluxo de caixa diario), Meu Apartamento, Emprestimos, Visualizacao mensal (resumos, graficos e calendario) e Contas recorrentes.
- Objetivos funcionais: uso intuitivo, categorizacao de contas, acompanhamento da progressao das faturas e do saldo de recorrentes e componentizacao das paginas.

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
- Primeira SPA (Vue via CDN) com filtros de ano/mes, resumos mensais/anuais, tabelas de entradas/recorrentes/poupanca/emprestimos e cards do modulo apartamento com grafico SVG simples da evolucao.
- Exportacao local de snapshot (meses carregados + resumo anual + evolucao do apartamento) e import/export via API de admin (enviar JSON completo, gerar backup, baixar estado atual).

6) Front modernizado (entregue)
- Migracao para Vite + Vue 3 + Tailwind + Pinia, separando build, aplicando proxy local para `/api` e organizando layout em paineis com cartoes e formulario de operacao.
- Pinia centraliza carregamento de ano/mes, resumos, import/export/backup e CRUDs de lancamentos, recorrentes, poupanca e emprestimos.

7) Entrega e operacao (entregue - primeira versao)
- Servidor agora serve o cliente estatico e adiciona rotas `/admin/export`, `/admin/import`, `/admin/backup`.
- README atualizado com comandos e rotas; server aceita JSON maior (limite 5mb) e exposicao do caminho do DB para backups.
- SPA consumindo novas rotas de admin (exportar, backup e importar arquivo lido).

## Priorizacao atual
- Fase 9 (Front V2) segue priorizada: onboarding/config + navegacao/sidebar guardada entregues; Dashboard V2 concluido (quick actions, cards, quanto posso gastar, proximas faturas, fluxo diario).
- Proxima entrega priorizada: Fase 9 - Etapa 5 (Visualizacao mensal e recorrentes com graficos/calendario compartilhados).
- Fase 8 permanece com pendencias menores (scripts de lint/test e seeds opcionais) para um ciclo rapido posterior.

## Roteiro da ideia V2 (Front V2 - Fase 9 priorizada)
1) Onboarding e checagem de base (entregue)
- Detectar ausencia de JSON e exibir tela de boas vindas com importacao ou criacao; validar JSON importado (schema + erros claros) antes de carregar via `/admin/validate`.
- Criar base nova com defaults (ano/mes atual, salario zerado, recorrentes vazios) e iniciar carregamento/estado no store com `/admin/bootstrap`.

2) Configuracoes iniciais e persistencia (entregue)
- Coletar data de fechamento da fatura e parametros de adiantamento (flag, dia, percentual) com validacao de ranges.
- Persistir configuracoes no JSON e no store, expondo via API/admin; ajustar import/export/backup para incluir e restaurar o bloco de configuracao.

3) Navegacao e barra lateral (entregue)
- SPA migrada para vue-router com sidebar e breadcrumbs; rotas dedicadas (Dashboard, Meu Apartamento, Emprestimos, Visualizacao mensal, Recorrentes) e guardas bloqueando acesso sem base carregada.
- Layout comum com atalhos entre rotas e cards de status; onboarding virou rota isolada que direciona automaticamente apos criar/importar base.

4) Dashboard V2 (entregue)
- Quick Action bar para cadastrar fatura e atalho de import/export.
- Cards: resumo mensal, saldo disponivel/quanto posso gastar, proximas faturas e resumo anual; grafico de fluxo de caixa diario ligado aos dados atuais.

5) Visualizacao mensal e recorrentes (alto)
- Tela com resumos, graficos e calendario de lancamentos/recorrentes; exibir progresso de faturas e saldo de recorrentes.
- Componentes compartilhados (listas, cards, graficos) reutilizados no Dashboard e demais modulos.

6) UX, categorias e componentizacao (medio)
- Introduzir categorias/tags e filtros basicos; alinhar feedbacks (toasts/erros) e mensagens de validacao para uso intuitivo.
- Consolidar componentes para Apartmento/Emprestimos e novos graficos.

## Fila seguinte (Iteracao de qualidade - Fase 8)
- Pendencias de qualidade rapida: scripts de lint/test padrao (eslint + smoke tests do store) e exemplos/seeds opcionais para novos usuarios iniciais.

## Iteracao de qualidade (Fase 8) entregue
- Build do Vite integrado ao server: quando existir `client/dist`, o Express serve o bundle otimizado automaticamente (fallback para `client/` em dev).
- Endpoints de admin com logs e opcao de backup automatico no import (`/admin/import?backup=true|false`), mais validacoes com alerta para JSON sem meses.
- SPA com toasts/banners de feedback e validacoes locais para formularios de lancamento/recorrentes/poupanca/emprestimos, alem do toggle de backup no fluxo de importacao.

