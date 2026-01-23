# Tarefa – Board do Projeto

## Identificacao
- **ID da tarefa:** API-015
- **Titulo curto:** Base HTTP Express e padrao de resposta/erro
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** Medium

---

## Contexto
Estabelecer a base HTTP da API (app Express, middlewares e padrao de resposta/erro) para garantir consistencia com os padroes minimos e com a diretriz de validacao antes do controller.

---

## Escopo da Tarefa
### Inclui
- Criar app Express com registro central de rotas
- Middleware de validacao por rota (estrutura base)
- Padrao unificado de resposta de sucesso e erro
- Handler global de erros

### Nao inclui (importante)
- Implementacao de endpoints de dominio (transacoes, categorias, etc.)
- Mudancas em regras de negocio

---

## Regras de Negocio Relacionadas
- ideias.md: 2.1 (Stack oficial), 2.2 (Padroes minimos API)
- regras-de-negocio.md: 12 (Tratamento de erros)
- modelos-json.md: 2 (Convencoes globais)

---

## Arquivos Impactados
- `server/` (estrutura Express)
- `docs/` (se houver necessidade de registrar decisoes)

---

## Passos de Implementacao Esperados
1. Criar a estrutura de app Express e registrar rotas
2. Implementar padrao de resposta (success/error)
3. Adicionar handler global de erros
4. Garantir ponto unico para validacao antes do controller

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] Padrao de resposta segue `docs/wiki/padroes-minimos.md`
- [ ] Erros seguem o formato padronizado
- [ ] Validacao ocorre antes do controller
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Subir o servidor
2. Bater em uma rota de teste e validar formato de resposta
3. Forcar erro e validar formato de erro

---

## Pendencias / Observacoes
- Nenhuma
