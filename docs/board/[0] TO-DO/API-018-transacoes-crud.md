# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-018
- **Titulo curto:** Transacoes (CRUD + persistencia mensal)
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** High

---

## Contexto
Transacoes sao o nucleo do sistema e devem seguir o modelo mensal em JSON, com validacoes e impacto imediato nos saldos do mes.

---

## Escopo da Tarefa
### Inclui
- CRUD de transacoes
- Persistencia por mes (`transactions/YYYY-MM.json`)
- Validacao de datas e valores
- Recalculo de totais do mes impactado

### Nao inclui (importante)
- Importacoes externas
- Auditoria/historico

---

## Regras de Negocio Relacionadas
- ideias.md: 4 (Transacoes), 9 (Saldo e resumos)
- regras-de-negocio.md: 2 (Persistencia), 3 (Transacoes)
- modelos-json.md: 2 (Convencoes globais), 3 (transactions)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/transactions/`

---

## Passos de Implementacao Esperados
1. Criar endpoints CRUD de transacoes
2. Aplicar validacoes de entrada antes do controller
3. Persistir por mes e recalcular totais ao editar/excluir

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] CRUD funciona com arquivo mensal correto
- [ ] Validacoes de data e valor aplicadas
- [ ] Edicao/exclusao recalcula totais do mes
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Criar transacao em mes sem arquivo e validar criacao do arquivo
2. Editar transacao passada e validar totais
3. Excluir transacao e validar totais

---

## Pendencias / Observacoes
- Nenhuma
