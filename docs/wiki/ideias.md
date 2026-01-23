# Documento de Ideias – Gerenciador Financeiro Pessoal

## 1. Objetivo do Projeto
Criar um **gerenciador financeiro pessoal simples e prático**, focado em controle mensal e anual, com regras claras, pouca automação e sem funcionalidades inteligentes no escopo inicial. O sistema deve ser previsível, transparente e fácil de manter, inclusive quando desenvolvido com auxílio de agentes de IA.

Este documento define **o que o sistema é**, **como ele se comporta** e **o que explicitamente não faz**.

---

## 2. Princípios do Projeto
- Simplicidade acima de completude
- Regras explícitas (nenhum comportamento implícito)
- Dados locais em JSON
- Sem automações inteligentes no MVP
- Qualquer dúvida não especificada **não deve ser implementada** e deve ser registrada como pendência

### 2.1 Stack oficial (MVP)
- Server: Express (Framework Node.JS)
- Client: Vue 3 + Vite + Tailwind + Pinia
- O front-end permanece fora do MVP, salvo decisao explicita.

### 2.2 Padrões mínimos de projeto (MVP)
- API:
  - Estrutura mínima: routes/, controllers/, services/, repositories/
  - Responsabilidades:
    - routes: mapeia endpoints/middlewares e valida entrada antes do controller
    - controllers: adapta HTTP (req/res), chama services, retorna resposta padronizada
    - services: regras de negócio e orquestração; não acessa req/res
    - repositories: leitura/escrita de JSON; sem acoplamento HTTP
  - Validação: toda entrada validada antes do controller; preferência por middleware
  - Resposta:
    - Sucesso (2xx): `{ success: true, data: {}, meta: {} }`
    - Erro (4xx/5xx): `{ success: false, error: { code, message, details } }`
  - Naming:
    - pastas/arquivos: kebab-case
    - funções/variáveis: camelCase
    - classes/tipos: PascalCase
    - endpoints: substantivos no plural (ex.: /transactions)
- Front-end:
  - Estrutura mínima: components/, pages/, stores/, services/
  - Responsabilidades:
    - pages: orquestram a tela e conectam stores/componentes
    - components: UI/interação local; sem chamadas HTTP diretas
    - stores (Pinia): estado global, cache/sincronização; chamam services
    - services: camada única de consumo da API; sem estado de UI
  - Estado:
    - global apenas em stores (Pinia)
    - local no componente quando não for compartilhado
  - Naming:
    - components: PascalCase.vue
    - pages: PascalCasePage.vue
    - stores: useXStore.(js|ts) com defineStore('x', ...)
    - services: x.service.(js|ts) por domínio
- Lista aprovada (documento auxiliar): `docs/wiki/padroes-minimos.md`

---

## 3. Armazenamento e Estrutura de Dados

### 3.1 Organização dos arquivos
- Os dados são armazenados em **arquivos JSON locais**
- Organização por **domínio e mês**
  - Exemplo: `transactions/2026-01.json`
- Um arquivo mensal **só é criado quando houver movimentação** naquele mês

### 3.2 Identificação
- Todas as entidades relevantes possuem **ID único e imutável**

---

## 4. Transações

### 4.1 Estrutura básica
Cada transação possui, no mínimo:
- id
- data
- valor
- tipo (entrada / saída)
- categoria
- descrição

### 4.2 Transações parceladas
- Existe uma **transação mãe**
- Apenas a **primeira parcela é criada como transação confirmada**
- As demais parcelas são **projetadas**
- Parcelas futuras:
  - aparecem nos resumos dos meses futuros

### 4.3 Edição e exclusão
- Editar uma transação passada:
  - recalcula imediatamente o saldo do mês
- Excluir transação mãe:
  - o sistema **pergunta o que fazer com as parcelas** (excluir todas ou manter)
- Exclusões impactam imediatamente os totais

---

## 5. Cartão de Crédito e Fatura

### 5.1 Regra de fechamento
- Compras **antes do dia de fechamento** entram na fatura do mês atual
- Compras **no dia do fechamento** são consideradas **após o fechamento**
- Não existe conceito de vencimento da fatura

### 5.2 Parcelamentos no cartão
- Todas as parcelas seguem a **regra do fechamento**
- Não existe controle de limite de cartão

---

## 6. Recorrências

### 6.1 Tipos suportados
- Mensal
- Anual

### 6.2 Comportamento
- Recorrências são **projeções**, não transações imediatas
- Quando o mês inicia:
  - a recorrência gera uma transação
  - segue automaticamente para o próximo ciclo

### 6.3 Edição
- Alterações em uma recorrência afetam **apenas projeções futuras**

---

## 7. Salário

### 7.1 Estrutura
- O salário é tratado como uma **entidade própria** (ex: `salary.json`)
- Possui:
  - valor total do salário
  - data de pagamento final

### 7.2 Adiantamento
- O salário pode possuir **adiantamento**
- O adiantamento:
  - pode ser **percentual do salário**
  - possui data própria

### 7.3 Regra mensal
- O adiantamento e o pagamento final **sempre pertencem ao mesmo mês**
  - Exemplo:
    - Adiantamento: 40% no dia 15
    - Pagamento final: 60% no dia 30

---

## 8. Categorias

### 8.1 Categorias gerais
- Categorias são **totalmente editáveis desde o início**
- Não existe categorização automática

### 8.2 Categoria especial: Dinheiro Guardado
- É uma categoria especial
- Pode ser usada em transações normais
- Não existem outras categorias especiais previstas

---

## 9. Saldo e Resumos

### 9.1 Saldo mensal
- Saldo disponível = **entradas – saídas do mês atual**

### 9.2 Dashboard

#### Resumo mensal
- Exibe:
  - transações confirmadas
  - recorrências projetadas

#### Resumo anual
- Calculado como **soma dos meses**

---

## 10. Calendário e Navegação

### 10.1 Calendário
- O calendário mensal é **apenas visual**
- Não permite criação ou edição direta de transações

### 10.2 Navegação
- Ao trocar de mês/ano:
  - o sistema alerta se houver dados não salvos
- O sistema lembra:
  - o último mês acessado

---

## 11. Validações e Erros

### 11.1 Validações mínimas
- Impedir:
  - valores negativos onde não fazem sentido
  - datas inválidas

### 11.2 Erros
- Apenas feedback visual
- Sem logs persistentes

---

## 12. Fora do Escopo (Importante)

Este sistema **não faz**:
- Importação de CSV, PDF ou integrações externas
- Auditoria ou histórico de alterações
- Modo anônimo
- Timeline financeira
- Reconhecimento automático ou categorização inteligente
- Simulações financeiras
- Alertas, metas ou avisos
- Chat financeiro ou IA integrada (planejado apenas para o futuro)
- Módulo do apartamento (fora do MVP)

---

## 13. Diretriz para Desenvolvimento com IA

Quando surgir qualquer comportamento não especificado neste documento:
- **Não implementar**
- Registrar como pendência
- Aguardar definição explícita

Este documento é a **fonte de verdade** para o comportamento do sistema.
