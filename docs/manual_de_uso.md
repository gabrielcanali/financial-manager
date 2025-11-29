# Manual de uso - Financial Manager V2

## Visão geral
- Painel financeiro local com armazenamento em JSON, pensado para estudo/uso pessoal sem banco externo.
- Backend Express exposto em `/api`; frontend Vue 3 (Vite + Pinia + Tailwind) com rotas: Dashboard, Visualização mensal, Recorrentes, Emprestimos, Meu apartamento e Onboarding (quando nao ha base).
- Fluxos cobertos: carregamento por ano/mes, CRUD de variaveis (entradas/saidas) e recorrentes (pre e pos-fechamento), poupanca, emprestimos, snapshots/import/export da base e leitura da evolução do apartamento.

## Preparação do ambiente
- Instale dependencias: `cd server && npm install` e `cd ../client && npm install`.
- Desenvolvimento: `cd server && npm run dev` (API em http://localhost:3000/api) e `cd client && npm run dev` (Vite em http://localhost:5173 com proxy para /api).
- Produção: `cd client && npm run build` e depois `cd server && npm start` (serve API e SPA; usa `client/dist` se existir).
- Variaveis: `PORT` (porta do backend) e `DB_FILE` (caminho relativo do JSON; default `data/financeiro.json`).

## Fluxo de onboarding (quando nao ha JSON carregado)
1. A SPA verifica `/api/admin/status`. Sem base, redireciona para `/onboarding`.
2. **Criar nova base**: preencha o dia de fechamento da fatura (1..31) e, se quiser, habilite adiantamento (dia e percentual). Clique em **Criar base vazia** para gerar o JSON inicial com ano/mes atuais.
3. **Importar JSON existente**: marque opcionalmente “Backup automatico antes de substituir”, selecione o arquivo (`application/json`) e aguarde a validação. Se o resultado for `JSON validado`, clique em **Importar e substituir** (ou **Enviar para API** na tela principal).
4. Use **Checar novamente/Recarregar status** caso ajuste o arquivo manualmente ou reinicie a API.

## Navegação e cabecalho
- Seletor de **Ano** e **Mes** no topo; a troca dispara sincronização do resumo anual, resumo mensal e dados do mes.
- Badges de status exibem mensagem do store (`Pronto/Sincronizando/Com alerta`); erros de renderização aparecem em um painel com botao **Recarregar dados**.
- Sidebar: Dashboard, Mensal, Recorrentes, Emprestimos, Meu apartamento. Onboarding fica fora do layout principal.

## Dashboard
- **Quick actions**: registrar fatura rapida (descrição, data, valor, parcela opcional); valor eh sempre salvo como saida negativa.
- **Admin**: exportar base via API, gerar backup no servidor, exportar snapshot local do ano corrente e validar/importar JSON (upload).
- Cards de **Resumo mensal** (receitas, despesas, liquido, saldo disponivel, poupanca, emprestimos) e **Resumo anual** (totais/medias).
- **Quanto posso gastar**: calcula saldo diario ate o fechamento (`config.fechamento_fatura_dia`) considerando saldo disponivel atual.
- **Proximas faturas**: lista ate 4 despesas futuras do mes (variaveis + recorrentes).
- Graficos: **Fluxo de caixa diario** (linha acumulada) e **Meu apartamento** (serie combinada Caixa/Construtora do ano atual).

## Visualização mensal
- Cards com os mesmos indicadores mensais do dashboard e painel de recorrentes (saldo, compromisso vs receitas e progresso da fatura pre-fechamento).
- **Calendario de lancamentos**: combina variaveis + recorrentes por dia, com totais e truncamento apos 3 itens.
- Tabela de **Entradas e saídas** com filtros (texto/tags, categoria, tipo entrada/saida) e CRUD:
  - Formulario aceita `data`, `valor` (positivo ou negativo), `descrição`, `categoria` (sugestao automatica pelo texto), `tags` livres e `parcela n/m`.
  - Flags: **Gerar parcelas futuras** (requer parcela) e **Cascata (edição de serie)** ao salvar edição.
  - Validações: data ISO, valor numerico != 0 com modulo <= 1.000.000, parcela no formato `n/m` com `m <= 36`.
- **Poupanca**: registra movimentos com `tipo` `aporte` ou `resgate` (valor sempre positivo; o tipo define o sinal). Lista permite excluir.

## Recorrentes
- Painel de status: saldo pre/pos-fechamento, compromisso versus receitas, progresso da fatura e timeline (primeiros 8 itens) com categoria/tags.
- Filtros: texto, categoria, tags, tipo (entradas/saidas), periodo (pre/pos).
- Tabelas separadas para **pre-fechamento** e **pos-fechamento** com botoes de editar/excluir.
- Formulario:
  - Campos: periodo (pre/pos), tipo (livre, default `mensal`), data, valor, descrição, categoria, tags e `termina_em` (YYYY-MM) opcional.
  - Flags: **Gerar meses futuros** (exige `termina_em`) e **Cascata na serie** ao editar.
  - Validações seguem as de variaveis, sem `parcela`; valores precisam ser != 0 e dentro do mes.

## Emprestimos
- Formulario unico com `lado` (feito ou recebido), data, valor (> 0) e descrição. Valores feitos impactam como saida; recebidos como entrada.
- Listas separadas exibem itens com ação de exclusão; o saldo aparece no cabeçalho da tela.

## Operações de admin (SPA)
- Upload de JSON roda `/admin/validate` primeiro; feedback de avisos/erros fica no rodape do dashboard e em onboarding.
- **Importar e substituir** envia o payload validado para `/admin/import`, respeitando a flag de backup automatico.
- **Exportar base** baixa o JSON completo atual via `/admin/export`; **Backup rapido** chama `/admin/backup` no servidor.
- **Snapshot (ano)** gera um arquivo local contendo todos os meses do ano selecionado + resumos e evolução do apartamento.

## Meu apartamento
- Visualização em gráfico de linha da serie combinada Caixa + Construtora para o ano atual (dados de `/api/apartment/evolution`).
- Exibição somente leitura; edição/registro de parcelas do apartamento hoje precisa ser feita via API (`PUT /api/apartment/:year/:month`) ou alterando o JSON.

## Regras e limites importantes
- Datas devem estar no mes/ano selecionados; a API rejeita fora do intervalo.
- Tags são normalizadas a partir de texto separado por `, ; #`; limite de 8 tags com 24 caracteres cada. Categorias são strings curtas (ate ~40 chars); presets ajudam na escolha e colorem os badges.
- `generateFuture` em lancamentos exige `parcela` e cria as demais parcelas ate `m`; `cascade` aplica alterações na serie existente. Para recorrentes, `generateFuture` exige `recorrencia.termina_em` a partir do mes atual.
- Valores: limite de modulo 1.000.000 para lancamentos/recorrentes; poupanca e emprestimos exigem valor > 0.

## O que foge ou fica parcial em relação ao caderno de ideias
- O front nao expõe campos de `dados` do mes (adiantamento/pagamento do salario) nem o `calendario` com dias de pagamento/fechamento; esses blocos so podem ser atualizados via API ou JSON.
- A tela de apartamento e apenas leitura; nao ha formulario para registrar/editar parcelas Caixa/Construtora.
- Itens listados como “ideias futuras” (metas por categoria, avisos de gasto, simulações, importação bancaria, etc.) ainda nao estao presentes.
