# **Documento Unificado de Ideias — Projeto de Gerenciamento Financeiro Pessoal**

## 1. Estrutura Geral do Sistema

* Armazenamento local em JSON, com possibilidade de importar e exportar.
* Visualização organizada por anos e meses.
* Exibição de calendário mensal com marcações:

  - Dias de pagamento
  - Dia de fechamento da fatura

* Dashboard com visão geral financeira:

  - Resumo mensal e anual
  - Saldo disponível
  - Evolução patrimonial
  - Dinheiro guardado
  - Empréstimos feitos ou recebidos

* Controle detalhado do apartamento:

  - Parcelas do financiamento (com comparação mês a mês)
  - Parcelas da entrada (construtora)
  - Gráficos de evolução das parcelas

---

## 2. Funcionalidades Essenciais

### 2.1. Entradas e Saídas

* Registro de transações com:

  - Data
  - Valor (positivo ou negativo)
  - Descrição
  - Número da parcela (ex.: 2/10)
* Cálculo de total mensal
* Contas recorrentes:

  - Até o fechamento da fatura
  - Após o fechamento da fatura

### 2.2. Configurações Iniciais

* Data de fechamento da fatura
* Existência de adiantamento salarial
* Dia e porcentagem do adiantamento

### 2.3. Rotas e Navegação

* Dashboard
* Meu Apartamento
* Empréstimos
* Visualização Mensal
* Contas Recorrentes

---

## 3. Recursos de Experiência do Usuário

* Uso intuitivo e interface simplificada.
* Quick Action Bar para acesso rápido (ex.: cadastrar fatura).
* Páginas componentizadas para futura migração para Vue.

---

## 4. Funcionalidades Planejadas

### 4.1. Edição na Interface

* Edição direta no calendário mensal.
* Edição de salário e data de fechamento.
* CRUD das parcelas do apartamento.

### 4.2. Alertas e Metas

* Alertas simples baseados em recorrências e categorias.
* Metas por categoria:

  - Exemplo: limite mensal para supermercado.
  - Barra de progresso e alerta quando ultrapassado.

### 4.3. Avisos Inteligentes

* Alerta de gastos fora do padrão:

  - "Você gastou X% do seu salário em alimentação".
  - "Seus gastos em mercado foram maiores que no mês anterior."

### 4.4. Simulação Rápida

* Campo para perguntas automáticas:

  - "Se eu comprar X por 300 reais, qual fica meu saldo?"
  - "Se parcelar em 3 vezes, como fica meu fluxo futuro?"

---

## 5. Funcionalidades Avançadas

### 5.1. Integração e Importação

* Importação de extratos PDF/CSV.
* Tentativa de categorização automática.
* Marcar transações como confirmadas.
* Possível integração futura via Open Finance.

### 5.2. Reconhecimento Automático

* Sugestão automática de categorias:

  - "MC DONALDS" → alimentação
  - "UBER" → transporte
  - "AMAZON" → compras

### 5.3. Controle de Cartão de Crédito

* Gestão de fatura aberta e futura.
* Registro de compras dentro e fora do mês.
* Parcelamentos impactando meses seguintes.
* Cálculo de limite restante.

### 5.4. Relatórios e Gráficos

* Gastos por categoria.
* Tendências mensais e anuais.
* Evolução do patrimônio.
* Comparação com médias anteriores.

---

## 6. Funcionalidades Diferenciadas

### 6.1. Timeline Financeira

Linha do tempo exibindo:

* Recebimento de salário
* Grandes compras
* Eventos financeiros importantes

### 6.2. Previsão e Projeção

* Simulação automática do saldo futuro.
* Projeção baseada nos padrões de gasto:

  - "Se continuar assim, seu saldo será X no fim do mês."

### 6.3. Chat Financeiro Interno

Responde perguntas como:

* "Quanto gastei no mercado esse mês?"
* "Mostre gastos acima de R$ 200."
* "Quais assinaturas tenho cadastradas?"

### 6.4. Auditoria e Histórico

* Log interno de:

  - Criação
  - Alteração
  - Exclusão de transações

### 6.5. Modo Anônimo

* Oculta valores reais para apresentações.
* Mantém apenas estrutura visual da interface.

---

## 7. Observações Finais

* Alguns documentos eram apenas rascunhos, portanto foram integrados apenas quando havia informações úteis.
* O conteúdo redundante foi unificado e reorganizado para melhorar clareza e consulta.
* Todas as ideias continuam contempladas, divididas por contexto e etapa lógica do sistema.