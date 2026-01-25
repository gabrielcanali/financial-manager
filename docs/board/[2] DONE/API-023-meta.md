# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-023
- **Titulo curto:** Meta (ultimo mes acessado)
- **Status:** DONE
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** Medium

---

## Contexto
O sistema deve persistir o ultimo mes acessado para manter a navegacao entre sessoes.

---

## Escopo da Tarefa
### Inclui
- Endpoint para obter/atualizar `meta.json`
- Persistir `lastOpenedMonth`

### Nao inclui (importante)
- Qualquer regra extra de navegacao

---

## Regras de Negocio Relacionadas
- ideias.md: 10.2 (Navegacao)
- regras-de-negocio.md: 10.2 (Persistencia de navegacao)
- modelos-json.md: 9 (meta.json)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/meta.json`

---

## Passos de Implementacao Esperados
1. Criar endpoint de leitura de meta
2. Criar endpoint de atualizacao de `lastOpenedMonth`
3. Validar formato `YYYY-MM`

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] `lastOpenedMonth` persistido conforme modelo JSON
- [ ] Validacao de formato aplicada
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Atualizar `lastOpenedMonth`
2. Buscar meta e validar persistencia

---

## Pendencias / Observacoes
- Nenhuma
