# Regras de Negócio – Gerenciador Financeiro Pessoal

> Este documento descreve as **regras de negócio de forma objetiva e implementável**. Ele é o "contrato" de comportamento do sistema.
>
> **Diretriz geral:** se surgir qualquer dúvida não especificada aqui, **não implementar**. Registrar como pendência para definição explícita.

---

## 1. Convenções e Definições

### 1.1 Tipos de registro
- **Transação confirmada:** lançamento efetivo (impacta totais do mês em que pertence).
- **Transação projetada:** lançamento futuro previsto (aparece em resumos, mas não é "editado como histórico").
- **Recorrência:** regra que gera projeções e, quando o mês inicia, gera transação confirmada.
- **Transação mãe (parcelamento):** origem do parcelamento; gera 1 parcela confirmada e as demais projetadas.

### 1.2 Escopo do MVP
O sistema deve cobrir:
- Onboarding
- Dashboard simplificado (resumo mensal e anual)
- Visualização mensal básica
- Cadastro/edição de faturas
- Cadastro/edição de recorrências

Fora do escopo do MVP (não implementar):
- Importações/integrações (CSV/PDF/banco)
- Auditoria/histórico
- Modo anônimo
- Timeline
- Alertas/metas/avisos inteligentes
- Reconhecimento/categorização automática
- Simulações
- Chat/IA integrada
- Módulo "Meu Apartamento"

---

## 2. Persistência em JSON

### 2.1 Organização
- Os dados são persistidos localmente em **JSON**.
- Arquivos por **domínio e mês** (quando aplicável).
  - Exemplo: `transactions/2026-01.json`
- Um arquivo mensal **só é criado se houver movimentação** naquele mês.

### 2.2 Identidade
- Toda entidade persistida deve possuir **ID único e imutável**.

---

## 3. Transações

### 3.1 Campos mínimos (base)
Uma transação deve conter, no mínimo:
- `id` (imutável)
- `date` (data)
- `amount` (valor)
- `direction` (`income` | `expense`)
- `categoryId`
- `description`

### 3.2 Regra de saldo mensal
- **Saldo disponível do mês** = soma(`income`) − soma(`expense`) considerando **apenas as transações do mês atual**.

### 3.3 Validações
- Datas inválidas são bloqueadas.
- Valores negativos são bloqueados **quando não fizerem sentido** (a regra específica por tipo deve ser definida na modelagem; por padrão, o sistema deve exigir `amount > 0` e usar `direction` para determinar o sinal lógico).

### 3.4 Edição e exclusão
- Editar transações passadas: o sistema **recalcula imediatamente** todos os totais do mês impactado.
- Excluir transações: a exclusão **impacta imediatamente** os totais.
- Não existe "soft delete" no escopo atual.

---

## 4. Parcelamento

### 4.1 Modelo conceitual
- Um parcelamento nasce de uma **transação mãe**.
- Ao criar um parcelamento:
  - **somente a 1ª parcela** é criada como **transação confirmada** no mês correspondente.
  - as demais parcelas são criadas como **transações projetadas**.

### 4.2 Projeções
- Parcelas projetadas devem:
  - aparecer nos resumos mensais dos meses futuros
  - ser distinguíveis de confirmadas na UI

### 4.3 Edição
O sistema deve suportar ambos:
- editar a transação mãe refletindo em todas as parcelas futuras
- editar uma parcela específica sem alterar as demais

> Detalhes de prioridade/conflito (ex.: "edição local sobrescreve mãe") devem ser tratados como pendência, caso não sejam especificados em documento próprio.

### 4.4 Conflito entre edição da transação mãe e parcelas

- Uma parcela pode ser editada individualmente após sua criação.
- Quando uma parcela for editada manualmente, ela passa a ser considerada **edição local**.

#### Regra de manter parcelas
- A transação mãe é **metadado** e não representa nenhuma parcela.
- Se o usuário escolher **manter parcelas**, apenas o registro da mãe é removido; **todas as parcelas permanecem**.

#### Regra de conflito
- Se existir ao menos uma parcela com edição local e o usuário editar a transação mãe, o sistema **não deve sobrescrever automaticamente** essas parcelas.
- O sistema deve exigir confirmação explícita do usuário, oferecendo as opções:
  1. Aplicar as alterações da transação mãe **somente nas parcelas não editadas manualmente**
  2. Aplicar as alterações da transação mãe **em todas as parcelas**, sobrescrevendo as edições locais
  3. Cancelar a operação

- O comportamento padrão (default) deve ser:
  - **Aplicar apenas nas parcelas não editadas manualmente**

### 4.4 Exclusão
Ao excluir a transação mãe, o sistema deve perguntar:
- Excluir todas as parcelas (confirmada + projetadas)
- Manter parcelas existentes (confirmada e/ou projetadas)

---

## 5. Recorrências

### 5.1 Tipos suportados
- Mensal
- Anual

### 5.2 Natureza
- Recorrências são **projeções** e **não** transações imediatas.

### 5.3 Geração ao iniciar o mês
Quando um novo mês inicia:
- para cada recorrência aplicável ao mês:
  - gerar uma **transação confirmada**
  - manter a recorrência ativa para o próximo ciclo

### 5.4 Edição
- Alterar uma recorrência afeta **apenas projeções futuras**.
- O sistema não deve modificar transações confirmadas já geradas por recorrências anteriores.

### 5.5 Datas em fins de semana
- Mantém a data definida (não ajustar para dias úteis).

---

## 6. Cartão de Crédito e Faturas

### 6.1 Configuração
- O cartão possui **dia de fechamento**.
- Não existe vencimento no escopo atual.
- Não existe controle de limite no escopo atual.

### 6.2 Regra de competência por fechamento
Dada uma transação no cartão em `date`:
- Se `date` ocorrer **antes** do dia de fechamento: pertence à **fatura do mês atual**.
- Se `date` ocorrer **no dia do fechamento**: pertence ao **ciclo após o fechamento**.

### 6.3 Parcelamento no cartão
- Todas as parcelas devem respeitar a regra de fechamento (competência definida individualmente por parcela).

---

## 7. Salário

### 7.1 Persistência
- Salário é uma **entidade própria** (ex.: `salary.json`).
  - Deve incluir `categoryId` e `description` para as transações geradas.
  - As transações de salário usam `direction = income`.

### 7.2 Componentes
O salário do mês pode ser composto por:
- **adiantamento** (opcional)
  - percentual do salário
  - data de pagamento do adiantamento
- **pagamento final** (obrigatório)
  - data de pagamento final
  - valor restante (salário − adiantamento)

### 7.3 Regra mensal
- Adiantamento e pagamento final pertencem ao **mesmo mês**.

### 7.4 Confirmação das Transações de Salário

- O salário é tratado como entidade própria e gera transações financeiras.
- No **início de cada mês**, o sistema deve gerar **transações projetadas** para:
  - adiantamento salarial (quando configurado)
  - pagamento final (valor restante do salário)

#### Confirmação automática por data
- As transações de salário **não são confirmadas automaticamente no início do mês**.
- Cada transação de salário deve ser **confirmada automaticamente quando a data atual for maior ou igual à sua data de pagamento**.
- Caso o usuário abra o sistema **após** a data de pagamento, a confirmação deve ocorrer **no primeiro acesso**.
- Não é exigido processo em background; a verificação pode ocorrer no carregamento da aplicação.

#### Regra mensal
- O adiantamento e o pagamento final **pertencem sempre ao mesmo mês**, independentemente das datas específicas.

---

## 8. Categorias

### 8.1 CRUD
- Categorias devem ser editáveis desde o início.
- Não existe categorização automática.

### 8.2 Categoria especial: "Dinheiro Guardado"
- Existe como categoria especial.
- Pode ser usada em transações normais.
- Não existem outras categorias especiais previstas.

---

## 9. Dashboard

### 9.1 Resumo mensal
O resumo mensal deve considerar:
- transações confirmadas do mês
- recorrências projetadas do mês
- parcelas projetadas do mês

#### Formato do resumo mensal
O resumo mensal deve retornar **totais consolidados** (não lista de itens), incluindo no mínimo:
- total de entradas confirmadas
- total de saídas confirmadas
- total de entradas projetadas
- total de saídas projetadas
- saldo do mês considerando apenas confirmadas
- saldo projetado (confirmadas + projetadas)

#### Deduplicacao entre recorrencias projetadas e confirmadas
Quando houver uma transacao confirmada que corresponda a uma recorrencia projetada no mesmo mes, a recorrencia projetada **nao deve ser somada** aos totais.
A correspondencia deve usar simultaneamente:
- source.type = "recurring"
- date
- amount
- categoryId
- description

### 9.2 Resumo anual
- O resumo anual e a **soma dos resumos mensais ja deduplicados**.

---

## 10. Navegação e Estado

### 10.1 Troca de mês/ano
- Ao trocar de mês/ano, o sistema deve alertar se houver **dados não salvos**.

### 10.2 Persistência de navegação
- O sistema deve lembrar o **último mês acessado**.

---

## 11. UX do Calendário
- O calendário mensal é apenas visual.
- Não permite criação/edição direta de transações no MVP.

---

## 12. Tratamento de Erros
- Erros devem ser apresentados com **feedback visual**.
- Sem logs persistentes no escopo atual.

---

## 13. Pendências e Dúvidas
Qualquer item não definido com clareza aqui deve:
1) Ser registrado como pendência (com contexto)
2) Não ser implementado até definição explícita