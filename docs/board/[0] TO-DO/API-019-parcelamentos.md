# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-019
- **Titulo curto:** Parcelamentos (mae + parcelas + conflitos)
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** High

---

## Contexto
Parcelamentos exigem transacao mae como metadado separado e regras claras de geracao, edicao e exclusao, incluindo conflito entre mae e parcelas editadas.

---

## Escopo da Tarefa
### Inclui
- Criar/editar/excluir transacao mae (metadado)
- Gerar parcelas confirmadas/projetadas
- Regra de conflito quando parcela tem edicao local
- Opcao de excluir mae mantendo parcelas

### Nao inclui (importante)
- Automacoes nao definidas
- Parcelamentos fora das regras do cartao

---

## Regras de Negocio Relacionadas
- ideias.md: 4.2 (Transacoes parceladas), 4.3 (Edicao/exclusao)
- regras-de-negocio.md: 4 (Parcelamento)
- modelos-json.md: 4 (Parcelamento e parcelas)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/installments.json`
- `data/transactions/`

---

## Passos de Implementacao Esperados
1. Persistir transacao mae como metadado
2. Gerar parcelas (1 confirmada + futuras projetadas)
3. Implementar regras de edicao e conflito
4. Implementar exclusao da mae com opcoes

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] Mae e parcelas seguem modelo JSON
- [ ] Regra de conflito respeita edicao local
- [ ] Exclusao da mae oferece opcoes e respeita regras
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Criar parcelamento e validar parcelas projetadas
2. Editar parcela individual e depois editar mae
3. Excluir mae e escolher manter parcelas

---

## Pendencias / Observacoes
- Nenhuma
