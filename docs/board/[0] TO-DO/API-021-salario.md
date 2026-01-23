# Tarefa - Board do Projeto

## Identificacao
- **ID da tarefa:** API-021
- **Titulo curto:** Salario (config + projecao + confirmacao por data)
- **Status:** TO-DO
- **Responsavel (agente):** Codex (GPT-5)
- **Reasoning effort:** High

---

## Contexto
Salario e entidade propria e gera transacoes projetadas que se confirmam automaticamente quando a data de pagamento chega.

---

## Escopo da Tarefa
### Inclui
- Endpoint para configurar `salary.json`
- Geracao de transacoes projetadas (adiantamento e pagamento final)
- Confirmacao automatica por data

### Nao inclui (importante)
- Processos em background
- Regras fora do contrato atual

---

## Regras de Negocio Relacionadas
- ideias.md: 7 (Salario)
- regras-de-negocio.md: 7 (Salario)
- modelos-json.md: 7 (salary.json) e 4.6 (Transacoes de salario)

---

## Arquivos Impactados
- `server/` (routes/controllers/services/repositories)
- `data/salary.json`
- `data/transactions/`

---

## Passos de Implementacao Esperados
1. Criar endpoints para leitura/atualizacao do salario
2. Gerar transacoes projetadas no inicio do mes
3. Confirmar transacoes quando data atual >= data de pagamento

---

## Criterios de Aceite
A tarefa so pode ser movida para **DONE** se **todos** forem verdadeiros:
- [ ] Salario persistido conforme modelo JSON
- [ ] Transacoes projetadas geradas no inicio do mes
- [ ] Confirmacao automatica ocorre pela data
- [ ] Nao houve criacao de funcionalidade fora do escopo

---

## Como Testar (Manual)
1. Configurar salario com adiantamento
2. Gerar projecoes no inicio do mes
3. Simular data atual e validar confirmacao

---

## Pendencias / Observacoes
- Nenhuma
