# Desk Check - Fase X (revalidação)

## Cenario de teste
- Base original restaurada de `server/data/financeiro.deskcheck-backup.json` após teste de bootstrap; `server/data/financeiro.json` permanece com anos 2025/11-12 e parcelas futuras 2026-01/02, config fechamento=20 e adiantamento 10/40.
- Servidor local ativo em http://localhost:3000/api (status e summaries 2025/12 retornam 200).
- Operações de teste criaram e removeram lançamentos/recorrentes/poupança/emprestimos para validar CRUD; estado final igual ao seed (líquido 2025-12 = 7805).

## Dashboard
- Status: ajuste
- Achados:
  1. Summaries carregam OK: `/api/months/2025/12/summary` e `/api/years/2025/summary` 200 com totais coerentes (meses 11-12 disponíveis).
  2. Escopo reduzido no front: `client/src/pages/DashboardPage.vue` exibe apenas cards de resumo; continuam ausentes quick actions e blocos de operações de admin previstos no manual. Severidade: ajuste UX/escopo.
- Decisoes do usuario: nenhuma.
- Proximos passos:
  - Incluir ações rápidas e admin (backup/export/validate/import) no dashboard ou alinhar manual para o escopo atual.

## Mensal
- Status: ajuste
- Achados:
  1. Validação de calendário ainda permite datas fora do mês: `PUT /api/months/2025/12/calendar` com `2025-01-05/20` retornou 200 e gravou os valores. Manual exige datas do mês/ano da rota. Severidade: ajuste técnico/UX.
  2. CRUD de variáveis OK: POST 201, PUT 200 e DELETE 204 para entrada `QA Variavel`; gerar futuras sem parcela segue retornando 400 com mensagem clara.
  3. Poupança e empréstimos OK: PUT com listas ajustadas retornou 200; validações de valores/mês são aplicadas. Meses 2026-01/02 continuam com `fechamento_fatura` null quando criados por generateFuture (melhoria pendente).
- Decisoes do usuario: nenhuma.
- Proximos passos:
  - Restringir datas de calendário ao mês/ano alvo.
  - Preencher defaults/config ao gerar meses futuros ou sinalizar snapshot parcial.

## Recorrentes
- Status: ok
- Achados:
  1. POST com generateFuture + `recorrencia.termina_em` agora 201: criação em `pre` 2025-12 propagou para 2026-01/02; sem erros.
  2. PUT com `cascade=true` atualizou série em todos os meses (200); DELETE em cada mês retornou 204 (sem 500).
  3. POST/PUT/DELETE sem generateFuture no período `pos` responderam 201/200/204 normalmente. CRUD completo disponível.
- Decisoes do usuario: nenhuma.
- Proximos passos:
  - Avaliar necessidade de exclusão em cascata para séries (hoje é manual por mês) se for requisito de UX.

## Emprestimos
- Status: ok
- Achados:
  1. PUT aceitou lista completa com item adicional (200) e resumo recalculado; restauração do payload original também 200.
  2. Validações de valores e datas permanecem ativas (mensagens claras ao violar regras).
- Decisoes do usuario: nenhuma.
- Proximos passos:
  - Nenhum ajuste técnico bloqueante.

## Apartamento
- Status: ok
- Achados:
  1. GET `/api/apartment/2025/12` e `/api/apartment/evolution?year=2025` 200 com séries coerentes.
  2. PUT parcial (apenas `financiamento_caixa`) e PUT completo com ambos os blocos responderam 200; 500 anteriores não reproduzidos.
- Decisoes do usuario: nenhuma.
- Proximos passos:
  - Nenhum ajuste técnico; seguir com UI de leitura ou priorizar formulário se entrar no escopo.

## Admin/Onboarding
- Status: ajuste
- Achados:
  1. `POST /api/admin/validate` responde 400 com erros detalhados para payload inválido (dia 40/percentual 150) e 200 para payload válido mínimo. A validação da base atual retorna 400 por causa do campo `recorrencia` presente nos `entradas_saidas`, embora seja o formato salvo pela API (inconsistência de validação vs. estado real). Severidade: ajuste técnico.
  2. `POST /api/admin/bootstrap` com base existente retorna 400 controlado; com base vazia (arquivo `{}`) criou nova base 2027-03 com config customizada (200). Base original restaurada de `server/data/financeiro.deskcheck-backup.json`.
- Decisoes do usuario: nenhuma.
- Proximos passos:
  - Ajustar `validate` para aceitar/normalizar `recorrencia: null` em `entradas_saidas` geradas pela própria API.
  - Confirmar UX do onboarding quando a base contém meses vazios gerados automaticamente.
