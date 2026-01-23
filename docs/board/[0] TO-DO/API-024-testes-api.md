# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-024
- **Titulo curto:** Testes de contrato e integracao da API
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** High

---

## Contexto
Antes de iniciar o front-end, a API precisa estar estavel e validada contra o contrato definido nas regras de negocio e modelos JSON.

---

## Escopo da Tarefa
### Inclui
- Testes de contrato para endpoints criticos
- Testes de integracao para fluxos principais
- Cobertura de casos de erro e validacao

### Nao inclui (importante)
- Testes de front-end
- Mudancas no contrato de negocio

---

## Regras de Negocio Relacionadas
- ideias.md: 2 (Principios) e 3 (Armazenamento)
- regras-de-negocio.md: 2 (Persistencia), 3 (Transacoes), 9 (Dashboard)
- modelos-json.md: 1-9 (Estruturas e convencoes)

---

## Arquivos Impactados
- `server/` (tests)
- `docs/` (se houver necessidade de registrar decisoes)

---

## Passos de Implementacao Esperados
1. Definir lista de endpoints criticos e contratos
2. Criar testes de sucesso e erro por endpoint
3. Criar testes de integracao para fluxos principais

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] Endpoints criticos com testes de contrato
- [ ] Fluxos principais com testes de integracao
- [ ] Casos de erro cobertos
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Rodar suite de testes
2. Validar que falhas de contrato sao detectadas

---

## Pendencias / Observacoes
- Nenhuma
