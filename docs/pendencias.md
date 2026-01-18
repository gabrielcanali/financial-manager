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

- Nenhuma

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