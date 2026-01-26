# Pendências do Projeto

> Este documento centraliza **todas as dúvidas, ambiguidades e decisões pendentes** do projeto.
>
> **Regra absoluta:** nada listado aqui pode ser implementado enquanto não houver definição explícita.

---

## Como usar este documento

- Sempre que surgir uma dúvida não coberta por:
    - `docs/wiki/ideias.md`
    - `docs/wiki/regras-de-negocio.md`
    - `docs/wiki/modelos-json.md`

  ela **deve ser registrada aqui**.

- Uma pendência só pode ser removida quando:
    - houver decisão explícita do responsável (você)
    - a decisão for refletida na documentação oficial

---

## Formato Obrigatório de Pendência

Copie o template abaixo para cada nova pendência.

```
### [ID] Título curto da pendência

**Contexto**
Explique onde a dúvida surgiu (tarefa, arquivo, fluxo específico).

**Problema / Dúvida**
Descreva exatamente o que não está definido.

**Opções consideradas**
- Opção A:
- Opção B:
- Opção C (se houver):

**Recomendação do agente (não implementar)**
Descrever qual opção parece mais adequada e por quê.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida
```

---

## Pendências Abertas

### [P-008] Competência do cartão vs data da transação

**Contexto**
Desk check - Cartão de crédito (Q8). Dúvida sobre como representar competência da fatura
quando `date` está antes do fechamento, mas a transação pertence ao mês seguinte.

**Problema / Dúvida**
Manter `date` como data real e calcular competência em outro lugar, ou ajustar `date`
para cair dentro do mês da fatura?

**Opções consideradas**
- Opção A: Manter `date` real e calcular competência no dashboard/consulta.
- Opção B: Ajustar `date` para o mês da fatura.
- Opção C: Manter `date` real e adicionar campo explícito (ex.: `billingMonth`).

**Recomendação do agente (não implementar)**
Opção A. Mantém a data real e evita duplicar campos, com competência calculada na leitura.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

---

### [P-009] Compras avulsas no cartão (transação manual)

**Contexto**
Desk check - Cartão de crédito (Q9). Falta definir como marcar compras avulsas no cartão.

**Problema / Dúvida**
Não está definido como identificar transações manuais feitas no cartão para entrar na fatura.

**Opções consideradas**
- Opção A: Adicionar `payment.mode = creditCard` nas transações manuais.
- Opção B: Criar `source.type = creditCard`.
- Opção C: Inferir pelo `categoryId` ou outro campo (não recomendado).

**Recomendação do agente (não implementar)**
Opção A. Mantém `source.type` e adiciona um campo explícito de pagamento.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

---

### [P-010] Excluir mãe mantendo parcelas

**Contexto**
Desk check - Parcelamentos (Q10). Excluir a mãe (metadado) com `deleteParcels=false`.

**Problema / Dúvida**
As parcelas devem permanecer como parcelas (`installment.*`) ou virar transações normais?

**Opções consideradas**
- Opção A: Manter `installment.*` e `source.type = installment`.
- Opção B: Remover `installment` e alterar `source.type` para `manual`.
- Opção C: Excluir todas as parcelas.

**Recomendação do agente (não implementar)**
Opção A. Preserva o vínculo e evita perda de contexto.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

---

### [P-011] Conflito ao editar parcelas marcadas como `editedManually`

**Contexto**
Desk check - Parcelamentos (Q11). Definição do fluxo/erro quando há conflito.

**Problema / Dúvida**
Não está definido o status/fluxo quando o update do pai encontra parcelas editadas.

**Opções consideradas**
- Opção A: Retornar 409 e exigir `conflictStrategy`.
- Opção B: Retornar 400 como erro de validação.
- Opção C: Aplicar parcial e retornar 200 com aviso.

**Recomendação do agente (não implementar)**
Opção A. Conflito explícito evita sobrescrita silenciosa.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

---

### [P-012] `firstDate` em parcelamento com dia inexistente

**Contexto**
Desk check - Parcelamentos (Q12). `firstDate` pode gerar datas inválidas nos meses seguintes.

**Problema / Dúvida**
Não está definido como tratar meses sem o dia escolhido (ex.: 31 em fevereiro).

**Opções consideradas**
- Opção A: Ajustar para o último dia do mês.
- Opção B: Rejeitar o parcelamento.
- Opção C: Ajustar para o dia útil mais próximo.

**Recomendação do agente (não implementar)**
Opção A. Mantém previsibilidade e evita rejeição inesperada.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

---

### [P-013] `date` fora do mês do arquivo em transações de cartão

**Contexto**
Desk check - Transações (Q13). Regra atual exige `date` no mesmo mês do arquivo.

**Problema / Dúvida**
Não está definido se transações de cartão podem ter `date` fora do mês da fatura.

**Opções consideradas**
- Opção A: Manter regra rígida para todas as transações.
- Opção B: Permitir exceção para cartão.
- Opção C: Manter `date` real e adicionar campo de competência (ex.: `billingMonth`).

**Recomendação do agente (não implementar)**
Opção C. Preserva a data real e deixa a competência explícita.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

---

### [P-014] Escopo do dashboard mensal

**Contexto**
Desk check - Dashboard (Q14). Dúvida sobre o que entra no resumo mensal.

**Problema / Dúvida**
Não está definido se o dashboard deve gerar projeções automaticamente ou apenas ler arquivos.

**Opções consideradas**
- Opção A: Dashboard lê apenas o que já existe nos arquivos.
- Opção B: Dashboard dispara geração automática.
- Opção C: Dashboard projeta tudo em memória sem persistir.

**Recomendação do agente (não implementar)**
Opção A. Evita comportamento implícito e mantém previsibilidade.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

---

### [P-015] Definição de "dia útil" para salário

**Contexto**
Desk check - Salário (Q4). Foi citado ajuste para dia útil mais próximo.

**Problema / Dúvida**
Não está definido o que conta como dia útil (apenas fim de semana ou feriados).

**Opções consideradas**
- Opção A: Considerar apenas sábado/domingo.
- Opção B: Considerar feriados com calendário fixo.
- Opção C: Permitir configuração de feriados.

**Recomendação do agente (não implementar)**
Opção A para o MVP, por simplicidade.

**Decisão final**
_(preenchido pelo responsável)_

**Status**
- [ ] Em aberto
- [ ] Resolvida

## Histórico de Pendências Resolvidas

### [P-001] Confirmação automática do salário

**Contexto**
Definição do comportamento de geração e confirmação das transações de salário.

**Problema / Dúvida**
Não está definido se as transações de salário (adiantamento e pagamento final) devem:
- ser apenas projeções
- ser confirmadas automaticamente no início do mês
- ser confirmadas apenas na data de pagamento

**Opções consideradas**
- Opção A: Gerar apenas projeções, confirmação manual
- Opção B: Confirmar automaticamente no início do mês
- Opção C: Confirmar automaticamente na data de pagamento

**Recomendação do agente (não implementar)**
Manter como projeção até definição explícita, evitando impacto automático no saldo.

**Decisão final**
Opção C. Salário gera transações projetadas no início do mês e confirma automaticamente por data (adiantamento e pagamento final). Se o app abrir após a data, confirmar no primeiro acesso.

**Status**
- [ ] Em aberto
- [x] Resolvida

---

### [P-002] Conflito entre edição da mãe e edição de parcela

**Contexto**
Edição de parcelamentos quando existe alteração na transação mãe e também em parcelas específicas.

**Problema / Dúvida**
Não está definido como resolver conflitos quando uma parcela foi editada localmente e, depois, a transação mãe é editada.

**Opções consideradas**
- Opção A: Edição local sobrescreve a mãe para aquela parcela.
- Opção B: Edição da mãe sobrescreve todas as parcelas, inclusive as editadas.
- Opção C: Manter edição local e exigir confirmação explícita para sobrescrever.

**Recomendação do agente (não implementar)**
Preservar edição local (Opção C) para evitar perda de alterações sem confirmação explícita.

**Decisão final**
Opção C. Se houver parcela editada manualmente, edição da mãe não sobrescreve automaticamente; exigir confirmação e oferecer: aplicar só nas não editadas / aplicar em todas / cancelar. Padrão: aplicar só nas não editadas.

**Status**
- [ ] Em aberto
- [x] Resolvida

---

### [P-003] Exclusao da transacao mae mantendo parcelas

**Contexto**
Implementacao de exclusao de parcelamento na tarefa `API-006`, considerando o modelo atual em `docs/wiki/modelos-json.md` (mae armazenada como transacao no mes de criacao com `installment.index = 1`).

**Problema / Duvida**
Quando o usuario escolhe "manter parcelas", qual comportamento esperado se a mae tambem representa a 1a parcela confirmada?

**Opcoes consideradas**
- Opcao A: A mae deve ser uma entidade separada (metadados). Excluir a mae nao remove nenhuma parcela.
- Opcao B: A mae e a parcela `index = 1`. "Manter parcelas" remove apenas a mae, deixando apenas as parcelas futuras.
- Opcao C: "Manter parcelas" preserva todas as transacoes e remove o vinculo de parcelamento (ex.: remover `installment`), transformando-as em transacoes normais.

**Recomendacao do agente (nao implementar)**
Opcao A, com ajuste explicito do modelo JSON para separar a mae das parcelas. Isso preserva todas as parcelas e evita perda da parcela confirmada ao excluir apenas a mae.

**Decisao final**
Opcao A. A transacao mae passa a ser um metadado separado; excluir a mae nao remove nenhuma parcela.

**Status**
- [ ] Em aberto
- [x] Resolvida

---

### [P-004] Campos obrigatorios das transacoes de salario

**Contexto**
Tarefa API-008 (projecoes de salario). O modelo de transacoes exige `direction`, `categoryId` e `description`, mas `salary.json` nao define esses campos.

**Problema / Duvida**
Nao esta definido como preencher `direction`, `categoryId` e `description` nas transacoes geradas pelo salario.

**Opcoes consideradas**
- Opcao A: Estender `salary.json` com `categoryId` e `description`, e fixar `direction = income`.
- Opcao B: Exigir `direction`, `categoryId` e `description` como parametros na geracao de projecoes.
- Opcao C: Criar uma categoria fixa de salario e descricao padrao.

**Recomendacao do agente (nao implementar)**
Opcao A, para manter a configuracao centralizada no `salary.json` e evitar defaults implicitos.

**Decisao final**
Opcao A. O `salary.json` deve incluir `categoryId` e `description`, e as transacoes geradas usam `direction = income`.

**Status**
- [ ] Em aberto
- [x] Resolvida

---

### [P-005] Estrutura e deduplicacao do resumo mensal/anual

**Contexto**
Tarefa API-010 (dashboard). Preciso definir o formato do resumo mensal/anual e como incluir recorrencias projetadas quando ja existem transacoes confirmadas geradas no mesmo mes.

**Problema / Duvida**
Nao esta definido:
- quais campos o resumo deve retornar (totais, saldo, detalhamento por status/direction, lista de itens, etc.)
- como evitar dupla contagem das recorrencias projetadas quando ja existe transacao confirmada da recorrencia no mes.

**Opcoes consideradas**
- Opcao A: Retornar apenas totais (confirmed/projected por income/expense) e calcular recorrencias projetadas apenas quando nao houver transacao confirmada equivalente no mes (com regra de correspondencia definida).
- Opcao B: Retornar lista de itens (transacoes do mes + recorrencias projetadas) e deixar o consumidor somar; deduplicacao nao ocorre.
- Opcao C: Considerar apenas o que existe nos arquivos `transactions/YYYY-MM.json` (sem projeção adicional de recorrencias).

**Recomendacao do agente (nao implementar)**
Opcao A, com regra explicita de correspondencia para deduplicar recorrencias (ex.: source.type=recurring + date + amount + categoryId + description).

**Decisao final**
Opcao A. O resumo mensal/anual retorna apenas totais consolidados (por status e direction), com deduplicacao explicita entre recorrencias projetadas e transacoes confirmadas equivalentes no mesmo mes. A regra de correspondencia fica definida nas regras de negocio.

**Status**
- [ ] Em aberto
- [x] Resolvida

---

### [P-006] Confirmação do stack oficial (API e front-end)

**Contexto**
Tarefa API-013 solicita registrar o stack (API Express; SPA Vite + Vue 3 + Tailwind + Pinia) em `docs/wiki/ideias.md`, mas exige confirmação explícita do responsável antes de documentar.

**Problema / Dúvida**
Não há confirmação explícita do responsável sobre o stack a ser registrado como fonte de verdade.

**Opções consideradas**
- Opção A: Confirmar Express + Vite/Vue/Tailwind/Pinia e registrar.
- Opção B: Definir stack diferente e registrar.
- Opção C: Manter indefinido até confirmação.

**Recomendação do agente (não implementar)**
Opção C, para evitar documentar stack sem validação explícita.

**Decisão final**
Opção A. Confirmado: server em Express (Framework Node.JS) e client em Vue 3 + Vite + Tailwind + Pinia.

**Status**
- [ ] Em aberto
- [x] Resolvida

---

### [P-007] Padroes minimos de projeto (API e front-end)

**Contexto**
Tarefa API-014 solicita definir padroes minimos de organizacao para API e front-end e registrar em `docs/wiki/ideias.md`, mas exige lista aprovada pelo responsavel.

**Problema / Duvida**
Os padroes minimos (camadas, responsabilidades, naming, composicao, estado global, etc.) nao foram definidos pelo responsavel.

**Opcoes consideradas**
- Opcao A: Definir padroes agora e registrar sem validacao.
- Opcao B: Solicitar ao responsavel a lista de padroes minimos e registrar apos confirmacao.
- Opcao C: Manter indefinido ate confirmacao.

**Recomendacao do agente (nao implementar)**
Opcao B, para evitar decisoes implicitas fora da fonte de verdade.

**Decisao final**
Opção B. Definir apenas o mínimo indispensável.

**Status**
- [ ] Em aberto
- [x] Resolvida

---
