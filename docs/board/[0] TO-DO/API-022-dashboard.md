# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-022
- **Titulo curto:** Dashboard (resumo mensal/anual + deduplicacao)
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** High

---

## Contexto
O dashboard precisa calcular totais consolidados e deduplicar recorrencias projetadas quando ja existem transacoes confirmadas equivalentes no mes.

---

## Escopo da Tarefa
### Inclui
- Endpoint de resumo mensal
- Endpoint de resumo anual
- Deduplicacao entre recorrencias projetadas e confirmadas

### Nao inclui (importante)
- Listagem detalhada de itens
- Analises fora do contrato

---

## Regras de Negocio Relacionadas
- ideias.md: 9 (Saldo e resumos)
- regras-de-negocio.md: 9 (Dashboard) e 3.2 (Saldo mensal)
- modelos-json.md: 12 (Resumo mensal/anual)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/transactions/`
- `data/recurring.json`

---

## Passos de Implementacao Esperados
1. Calcular totais confirmados e projetados do mes
2. Aplicar regra de deduplicacao definida
3. Somar resumos mensais para resumo anual

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] Resumo mensal retorna totais consolidados
- [ ] Resumo anual e soma dos meses deduplicados
- [ ] Regra de deduplicacao aplicada corretamente
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Criar recorrencia e transacao confirmada equivalente no mes
2. Gerar resumo mensal e validar deduplicacao
3. Gerar resumo anual e validar soma de meses

---

## Pendencias / Observacoes
- Nenhuma
