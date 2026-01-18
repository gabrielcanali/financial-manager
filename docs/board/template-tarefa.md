# Template de Tarefa – Board do Projeto

> Este arquivo serve como **esqueleto obrigatório** para qualquer tarefa dentro de `docs/board`.
> O agente **não pode** criar tarefas fora deste formato.

---

## Identificação
- **ID da tarefa:** (ex: API-001)
- **Título curto:**
- **Status:** TO-DO | DOING | DONE
- **Responsável (agente):** (modelo + versão)
- **Reasoning effort:** Low | Medium | High | Extra High

---

## Contexto
Descreva brevemente **por que** esta tarefa existe e **qual problema resolve**, sempre referenciando os documentos em `docs/wiki` quando aplicável.

---

## Escopo da Tarefa
### Inclui
- Item 1
- Item 2

### Não inclui (importante)
- Item explicitamente fora do escopo

---

## Regras de Negócio Relacionadas
Liste os trechos relevantes de:
- ideias.md
- regras-de-negocio.md
- modelos-json.md

(Referenciar por seção, não copiar texto inteiro)

---

## Arquivos Impactados
- `server/...`
- `client/...`
- `docs/...` (se houver atualização de documentação)

---

## Passos de Implementação Esperados
1. Passo 1
2. Passo 2
3. Passo 3

> O agente pode ajustar os passos, mas **não pode sair do escopo**.

---

## Critérios de Aceite
A tarefa só pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] Regra de negócio respeitada
- [ ] Persistência segue o modelo JSON
- [ ] Não houve criação de funcionalidade fora do escopo
- [ ] Fluxo mínimo funcional validado manualmente

---

## Como Testar (Manual)
Descreva um passo a passo simples para validar o comportamento implementado.

---

## Pendências / Observações
- Dúvidas encontradas
- Pontos não definidos em contrato

> Se houver pendência não resolvida, a tarefa **não pode** ir para DONE.