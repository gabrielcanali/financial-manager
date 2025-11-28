# Contrato de dados (JSON)

## Convencoes gerais
- Armazenamento local em unico JSON; sem banco externo.
- Datas no formato ISO `YYYY-MM-DD`.
- Anos no formato `YYYY` e meses `MM` (strings com zero a esquerda).
- Valores numericos usam ponto decimal; positivos representam entrada/credito, negativos saida/debito.
- Objetos com chaves em snake_case para alinhar com o JSON existente.

## Raiz do arquivo
```json
{
  "anos": {
    "2025": {
      "meses": {
        "01": {
          "dados": { ... },
          "calendario": { ... },
          "entradas_saidas": [ ... ],
          "contas_recorrentes_pre_fatura": [ ... ],
          "contas_recorrentes_pos_fatura": [ ... ]
        }
      }
    }
  }
}
```

## Estrutura de `mes`
- `dados`:
  - `adiantamento` (number): 40% do salario bruto.
  - `pagamento` (number): 60% do salario bruto.
  - `total_liquido` (number): liquido do mes (pode ser calculado ou persistido como cache). Opcional guardar `saldo` se for derivado de movimentacoes.
- `calendario`:
  - `pagamentos` (string[]): dias do mes com pagamentos (datas ISO).
  - `fechamento_fatura` (string|null): data ISO do fechamento da fatura.
- `entradas_saidas` (Movimentacao[]): lista de lancamentos do mes.
- `contas_recorrentes_pre_fatura` (Recorrente[]): contas recorrentes ate o fechamento da fatura (sem parcela).
- `contas_recorrentes_pos_fatura` (Recorrente[]): contas recorrentes apos o fechamento (sem parcela).

## Tipo `Movimentacao`
```json
{
  "id": "uuid",           // recomendado para edicao/remocao
  "data": "YYYY-MM-DD",   // data do lancamento
  "valor": -150.75,         // positivo=entrada, negativo=saida
  "descricao": "Conta de luz",
  "parcela": "2/10"       // ou null, quando parcelado
}
```
Notas:
- `id` pode ser omitido no arquivo legado, mas deve ser gerado na criacao via API.
- O campo `parcela` segue o padrao "n/m"; para recorrentes nao deve ser usado.

## Tipo `Recorrente`
Mesmo formato de `Movimentacao`, mas sem `parcela` e com opcional de controle de recorrencia:
```json
{
  "id": "uuid",
  "data": "YYYY-MM-DD",     // dia de cobranca dentro do mes de referencia
  "valor": -200.00,
  "descricao": "Internet",
  "recorrencia": {
    "tipo": "mensal",       // futura extensao: semanal, anual
    "termina_em": "2025-12" // opcional; null para recorrencia aberta
  }
}
```

## Dashboard (futuro)
- Resumo mensal: saldo do mes (salario + entradas - saidas - recorrentes), total liquido, percentuais.
- Resumo anual: soma de saldos mensais, mediana de gastos/receitas, varicoes.
- Poupanca: saldo guardado ate o mes, movimentos de aporte/retirada.
- Emprestimos: lista de emprestimos feitos/recebidos com saldo em aberto.

## Apartamento (futuro)
- `financiamento_caixa`: [{ `ano`, `mes`, `valor_parcela`, `diferenca_vs_mes_anterior` }].
- `entrada_construtora`: [{ `ano`, `mes`, `valor_parcela`, `diferenca_vs_mes_anterior` }].
- Opcional `saldo_devedor` e historico para grafico de evolucao.

## Exemplo minimo de mes
```json
{
  "dados": {
    "adiantamento": 4000,
    "pagamento": 6000,
    "total_liquido": 10000
  },
  "calendario": {
    "pagamentos": ["2025-01-10", "2025-01-25"],
    "fechamento_fatura": "2025-01-20"
  },
  "entradas_saidas": [
    { "id": "1", "data": "2025-01-10", "valor": -150.75, "descricao": "Conta de luz", "parcela": null }
  ],
  "contas_recorrentes_pre_fatura": [
    { "id": "2", "data": "2025-01-05", "valor": -120.00, "descricao": "Internet" }
  ],
  "contas_recorrentes_pos_fatura": []
}
```
