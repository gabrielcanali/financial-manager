# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-017
- **Titulo curto:** Configuracao de cartao de credito (fechamento)
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** Medium

---

## Contexto
O cartao possui dia de fechamento que define a competencia das transacoes. A API precisa expor configuracao e aplicar regra de fechamento.

---

## Escopo da Tarefa
### Inclui
- Endpoint de configuracao do cartao (leitura/atualizacao)
- Validacao do dia de fechamento
- Aplicar regra de competencia nas transacoes de cartao

### Nao inclui (importante)
- Controle de limite
- Vencimento de fatura

---

## Regras de Negocio Relacionadas
- ideias.md: 5 (Cartao de credito e fatura)
- regras-de-negocio.md: 6 (Cartao de credito e faturas)
- modelos-json.md: 6 (creditCard.json)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/` (creditCard.json)

---

## Passos de Implementacao Esperados
1. Criar endpoints para obter e atualizar `creditCard.json`
2. Validar `closingDay` (1-31)
3. Aplicar regra de competencia ao criar parcelas no cartao

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] Configuracao do cartao persistida conforme modelo JSON
- [ ] Regra de fechamento aplicada conforme regras de negocio
- [ ] Validacao ocorre antes do controller
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Atualizar `closingDay` e validar persistencia
2. Criar transacao em data antes do fechamento e validar competencia
3. Criar transacao no dia do fechamento e validar competencia

---

## Pendencias / Observacoes
- Nenhuma
