# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-020
- **Titulo curto:** Recorrencias (CRUD + geracao mensal)
- **Status:** DONE
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** High

---

## Contexto
Recorrencias geram transacoes no inicio do mes e precisam suportar edicao que afeta apenas projecoes futuras.

---

## Escopo da Tarefa
### Inclui
- CRUD de recorrencias
- Geracao mensal de transacoes confirmadas
- Edicao que nao altera transacoes ja geradas

### Nao inclui (importante)
- Regras de automatizacao nao definidas

---

## Regras de Negocio Relacionadas
- ideias.md: 6 (Recorrencias)
- regras-de-negocio.md: 5 (Recorrencias)
- modelos-json.md: 5 (recurring.json)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/recurring.json`
- `data/transactions/`

---

## Passos de Implementacao Esperados
1. Criar endpoints CRUD de recorrencias
2. Implementar geracao de transacoes no inicio do mes
3. Garantir que edicoes so afetam projecoes futuras

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [x] Recorrencias persistidas conforme modelo JSON
- [x] Transacoes geradas no inicio do mes
- [x] Edicao nao altera transacoes ja confirmadas
- [x] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Criar recorrencia mensal e gerar transacao no inicio do mes
2. Editar recorrencia e validar que nao altera transacao confirmada

---

## Pendencias / Observacoes
- Nenhuma
