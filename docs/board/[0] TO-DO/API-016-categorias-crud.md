# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-016
- **Titulo curto:** Endpoints de categorias (CRUD)
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** Medium

---

## Contexto
Categorias sao base para transacoes e precisam ser editaveis desde o inicio, incluindo a categoria especial "Dinheiro Guardado".

---

## Escopo da Tarefa
### Inclui
- CRUD de categorias
- Garantir existencia e manutencao da categoria especial
- Validacoes de entrada

### Nao inclui (importante)
- Categorizar automaticamente transacoes
- Regras fora do MVP

---

## Regras de Negocio Relacionadas
- ideias.md: 8 (Categorias)
- regras-de-negocio.md: 8 (Categorias)
- modelos-json.md: 8 (categories.json)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/` (categories.json)

---

## Passos de Implementacao Esperados
1. Criar endpoints CRUD de categorias
2. Validar payloads antes do controller
3. Garantir categoria especial presente e preservada

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] CRUD funciona conforme modelo JSON
- [ ] Categoria especial "Dinheiro Guardado" preservada
- [ ] Validacao ocorre antes do controller
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Criar categoria
2. Listar categorias e validar categoria especial
3. Atualizar e remover categoria nao especial

---

## Pendencias / Observacoes
- Nenhuma
