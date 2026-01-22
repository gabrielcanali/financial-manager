# Modelo JSON – Estrutura Mínima

> Objetivo: definir uma estrutura mínima e estável de persistência em JSON, compatível com o contrato de regras de negócio.
>
> **Nota:** nomes de campos estão em *camelCase* para facilitar uso em JS/TS. Se preferir *snake_case*, podemos padronizar depois.

---

## 1. Estrutura de Pastas (proposta)

```
/data
  /transactions
    2026-01.json
    2026-02.json
  categories.json
  recurring.json
  creditCard.json
  installments.json
  salary.json
  meta.json
```

### Regras
- `transactions/YYYY-MM.json` só existe se houver movimentação naquele mês.
- Arquivos "globais" (categories/recurring/creditCard/installments/salary) existem sempre após o onboarding.

---

## 2. Convenções Globais

### 2.1 Identificadores
- Toda entidade possui `id` único e imutável.
- Formato sugerido: string UUID v4 (ou outro gerador), ex: `"9f7c2d6b-..."`.

### 2.2 Datas
- Formato ISO sem horário: `YYYY-MM-DD`.

### 2.3 Valores
- `amount` sempre positivo.
- O "sinal lógico" vem de `direction` (`income` | `expense`).

### 2.4 Status de projeção
- Transações podem ser `confirmed` ou `projected`.

---

## 3. transactions/YYYY-MM.json

### 3.1 Estrutura
```json
{
  "month": "2026-01",
  "items": [
    {
      "id": "t_01",
      "date": "2026-01-05",
      "amount": 250.0,
      "direction": "expense",
      "categoryId": "cat_food",
      "description": "Mercado",
      "status": "confirmed",

      "source": {
        "type": "manual"
      }
    }
  ]
}
```

### 3.2 Campos da Transação (mínimo)
- `id`: string
- `date`: `YYYY-MM-DD`
- `amount`: number (> 0)
- `direction`: `income` | `expense`
- `categoryId`: string
- `description`: string
- `status`: `confirmed` | `projected`
- `source.type`: `manual` | `recurring` | `installment` | `salary`

### 3.3 Campos opcionais úteis
```json
{
  "notes": "texto livre",
  "tags": ["cartao", "fixo"],
  "updatedAt": "2026-01-10T12:00:00.000Z"
}
```

---

## 4. Parcelamento (transação mãe + parcelas)

### 4.1 Como representar
- A transação mãe é uma **entidade separada de metadados**, armazenada fora dos arquivos mensais de transações.
- Para o MVP, a mãe fica em um arquivo próprio de metadados (ex.: `installments.json`) e **não é uma parcela**.
- As parcelas continuam armazenadas em `transactions/YYYY-MM.json` e são relacionadas por `installment.groupId`.

### 4.2 Exemplo (mãe em metadados)
```json
{
  "id": "t_parent_01",
  "date": "2026-01-10",
  "amount": 1200,
  "direction": "expense",
  "categoryId": "cat_electronics",
  "description": "Teclado (12x)",
  "source": { "type": "installment" },
  "installment": {
    "groupId": "inst_abc",
    "mode": "creditCard",
    "total": 12,
    "index": null
  }
}
```

### 4.3 Exemplo (parcela confirmada)
```json
{
  "id": "t_inst_01",
  "date": "2026-01-10",
  "amount": 100,
  "direction": "expense",
  "categoryId": "cat_electronics",
  "description": "Teclado (1/12)",
  "status": "confirmed",
  "source": { "type": "installment" },
  "installment": {
    "groupId": "inst_abc",
    "mode": "creditCard",
    "total": 12,
    "index": 1
  }
}
```

### 4.4 Exemplo (parcela projetada)
```json
{
  "id": "t_inst_02",
  "date": "2026-02-10",
  "amount": 100,
  "direction": "expense",
  "categoryId": "cat_electronics",
  "description": "Teclado (2/12)",
  "status": "projected",
  "source": { "type": "installment" },
  "installment": {
    "groupId": "inst_abc",
    "mode": "creditCard",
    "total": 12,
    "index": 2
  }
}
```

### 4.5 Observações
- `installment.mode` pode ser `creditCard` ou `direct` (débito/PIX/dinheiro).
- A regra "no dia do fechamento é após" é aplicada quando `mode=creditCard`.

### 4.6 Transações de Salário

- Transações originadas do salário devem possuir:
  - `source.type = "salary"`
  - `status` podendo ser `projected` ou `confirmed`
- No início do mês, as transações de salário são criadas como `projected`.
- Quando a data atual atingir a data de pagamento da transação, seu `status` deve ser alterado para `confirmed`.

### 4.7 Parcelas com edição manual

- Parcelas podem possuir um marcador indicando edição local.
- Campo sugerido:
  - `editedManually: true`
- Parcelas com `editedManually = true` **não devem ser sobrescritas automaticamente** por edições da transação mãe.
- A sobrescrita só pode ocorrer após confirmação explícita do usuário.

---

## 5. recurring.json

### 5.1 Estrutura
```json
{
  "items": [
    {
      "id": "rec_01",
      "name": "Internet",
      "direction": "expense",
      "amount": 120,
      "categoryId": "cat_bills",
      "schedule": {
        "frequency": "monthly",
        "dayOfMonth": 10
      },
      "payment": {
        "mode": "direct"
      },
      "isActive": true
    }
  ]
}
```

### 5.2 Campos
- `id`, `name`
- `direction`, `amount`, `categoryId`
- `schedule.frequency`: `monthly` | `yearly`
- `schedule.dayOfMonth`: 1–31 (mensal)
- `schedule.month`: 1–12 (anual, opcional)
- `payment.mode`: `direct` | `creditCard`
- `isActive`: boolean

### 5.3 Regra de geração
- No início de cada mês:
  - para cada recorrência aplicável, criar transação `confirmed` em `transactions/YYYY-MM.json` com `source.type=recurring`.

---

## 6. creditCard.json

### 6.1 Estrutura
```json
{
  "closingDay": 20
}
```

### 6.2 Regra
- Sem vencimento.
- Sem limite.

---

## 7. salary.json

### 7.1 Estrutura
```json
{
  "baseSalary": 3000,
  "direction": "income",
  "categoryId": "cat_salary",
  "description": "Salário",
  "paymentDay": 30,
  "advance": {
    "enabled": true,
    "day": 15,
    "type": "percent",
    "value": 40
  }
}
```

### 7.2 Interpretação
- `baseSalary`: salário total do mês.
- `direction`: deve ser sempre `income` nas transações geradas.
- `categoryId`: categoria usada nas transações de salário.
- `description`: descrição aplicada às transações de salário.
- `paymentDay`: dia do pagamento final.
- `advance`:
  - se `enabled=true`, existe adiantamento
  - `type=percent` e `value=40` → adiantamento = 40% do salário
  - valor final = salário − adiantamento

### 7.3 Geração de transações
- No início do mês, o sistema deve projetar (ou gerar conforme estratégia do MVP) as transações de salário.
- Sugestão alinhada ao dashboard (confirmadas + projetadas):
  - gerar **projeções** para adiantamento e pagamento final
  - confirmar automaticamente quando o mês inicia? **Não** (pendência)

> **Pendência sugerida:** decidir se salário entra como recorrência projetada ou como transações confirmadas na virada do mês. O contrato atual define geração ao iniciar o mês para recorrências, mas salário foi definido como entidade própria.

---

## 8. categories.json

### 8.1 Estrutura
```json
{
  "items": [
    { "id": "cat_food", "name": "Alimentação" },
    { "id": "cat_bills", "name": "Contas" },
    { "id": "cat_saved", "name": "Dinheiro Guardado", "isSpecial": true }
  ]
}
```

### 8.2 Regras
- Categorias são editáveis.
- Não existe categorização automática.
- `Dinheiro Guardado` existe e pode ser usada em transações normais.

---

## 9. meta.json (opcional, recomendado)

### 9.1 Estrutura
```json
{
  "lastOpenedMonth": "2026-01"
}
```

### 9.2 Uso
- Persistir "último mês acessado".

---

## 10. Pendências Registradas (conforme diretriz)

- Nenhuma

---

## 11. Observação final
Se você quiser, eu adapto esse modelo para:
- separar "projeções" em arquivo dedicado (ex.: `projections/YYYY-MM.json`)
- ou manter tudo em um único arquivo mensal com `status`.

Pelo seu contrato atual, **status no mesmo arquivo** é o caminho mais simples e consistente.