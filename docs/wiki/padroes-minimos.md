# Padroes Minimos de Projeto (API e Front-end)

Este documento define a **lista aprovada de padroes minimos** para organizar o projeto.
Ele complementa `docs/wiki/ideias.md` e serve como referencia obrigatoria para qualquer implementacao.

---

## 1. API (Express)

### 1.1 Estrutura minima
- `routes/` - definicao de rotas e middlewares por recurso
- `controllers/` - adaptacao HTTP (req/res), sem regra de negocio
- `services/` - regras de negocio e orquestracao
- `repositories/` - acesso a dados (JSON local)

### 1.2 Responsabilidades por camada
- **Routes**
  - mapeia endpoints e middlewares
  - executa validacao de entrada antes do controller
- **Controllers**
  - extrai dados do request
  - chama services
  - retorna resposta padronizada
- **Services**
  - implementa regras de negocio
  - coordena chamadas a repositories
  - nao acessa diretamente `req`/`res`
- **Repositories**
  - leitura/escrita de arquivos JSON
  - nenhum acoplamento com HTTP

### 1.3 Validacao
- toda entrada deve ser validada **antes** de chegar ao controller
- preferencia por middlewares de validacao por rota
- erros de validacao devem retornar `400` com padrao de erro consistente

### 1.4 Padrao de resposta
- **Sucesso**
  - HTTP 2xx
  - corpo:
    ```json
    {
      "success": true,
      "data": {},
      "meta": {}
    }
    ```
- **Erro**
  - HTTP 4xx/5xx
  - corpo:
    ```json
    {
      "success": false,
      "error": {
        "code": "ERROR_CODE",
        "message": "Mensagem clara",
        "details": {}
      }
    }
    ```
- `meta` e `details` sao opcionais, mas o formato geral deve ser mantido

### 1.5 Naming e convencoes
- arquivos e pastas: `kebab-case`
- funcoes e variaveis: `camelCase`
- classes e tipos: `PascalCase`
- endpoints: substantivos no plural (ex.: `/transactions`)

---

## 2. Front-end (Vue 3 + Vite + Tailwind + Pinia)

### 2.1 Estrutura minima
- `components/` - componentes reutilizaveis
- `pages/` - telas de rota
- `stores/` - Pinia stores (estado global)
- `services/` - chamadas HTTP e integracoes externas

### 2.2 Composicao e separacao de responsabilidades
- **Pages**
  - orquestram a tela
  - conectam stores e componentes
- **Components**
  - focados em UI e interacao local
  - nao fazem chamadas HTTP diretas
- **Stores (Pinia)**
  - estado global centralizado
  - regras de cache e sincronizacao
  - chamam `services/` quando necessario
- **Services**
  - camada unica para consumo da API
  - sem estado de UI

### 2.3 Estado
- estado global deve residir apenas nas stores do Pinia
- estado local (UI) deve ficar no componente, quando nao for compartilhado
- nenhum componente deve acessar dados globais fora das stores

### 2.4 Naming e convencoes
- componentes: `PascalCase.vue`
- pages: `PascalCasePage.vue`
- stores: `useXStore.(js|ts)` com `defineStore('x', ...)`
- services: `x.service.(js|ts)` por dominio (ex.: `transactions.service.ts`)

---

## 3. Observacoes finais
- Qualquer excecao a estes padroes deve ser registrada em `docs/pendencias.md`.
- Se houver conflito com as regras de negocio, prevalecem os documentos em `docs/wiki/`.
