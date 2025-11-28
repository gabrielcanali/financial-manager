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
          "contas_recorrentes_pos_fatura": [ ... ],
          "poupanca": { ... },
          "emprestimos": { ... }
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
- `poupanca`: { `movimentos`: MovimentoPoupanca[] }.
- `emprestimos`: { `feitos`: MovimentoEmprestimo[], `recebidos`: MovimentoEmprestimo[] }.

## Tipo `Movimentacao`
```json
{
  "id": "uuid",           // recomendado para edicao/remocao
  "serie_id": "uuid",     // opcional; identifica o grupo de parcelas ou serie recorrente
  "data": "YYYY-MM-DD",   // data do lancamento
  "valor": -150.75,         // positivo=entrada, negativo=saida
  "descricao": "Conta de luz",
  "parcela": "2/10"       // ou null, quando parcelado
}
```
Notas:
- `id` pode ser omitido no arquivo legado, mas deve ser gerado na criacao via API.
- `serie_id` e usado para agrupar e aplicar edicoes em cascata em uma mesma serie de parcelas.
- O campo `parcela` segue o padrao "n/m" com limites `1 <= n <= m <= 36`; para recorrentes nao deve ser usado.
- `data` deve pertencer ao mes de referencia informado na rota.

## Tipo `Recorrente`
Mesmo formato de `Movimentacao`, mas sem `parcela` e com opcional de controle de recorrencia:
```json
{
  "id": "uuid",
  "serie_id": "uuid",        // agrupa uma serie de recorrencias
  "data": "YYYY-MM-DD",     // dia de cobranca dentro do mes de referencia
  "valor": -200.00,
  "descricao": "Internet",
  "recorrencia": {
    "tipo": "mensal",       // futura extensao: semanal, anual
    "termina_em": "2025-12" // opcional; null para recorrencia aberta
  }
}
```
Notas:
- A API gera `serie_id` automaticamente para recorrencias, permitindo aplicacao de edicoes em cascata.
- `recorrencia.termina_em` deve ser igual ou posterior ao mes de origem quando usado para gerar meses futuros.

## Tipo `MovimentoPoupanca`
```json
{
  "id": "uuid",
  "data": "YYYY-MM-DD",
  "valor": 200.0,
  "descricao": "Aporte extra",
  "tipo": "aporte" // ou "resgate"
}
```
Notas:
- Valores sempre positivos; o sinal e definido por `tipo` (aporte aumenta saldo, resgate diminui).
- Datas devem pertencer ao mes/ano da rota.
- O acumulado da poupanca e calculado no resumo mensal/anual, nao gravado em cache.

## Tipo `MovimentoEmprestimo`
```json
{
  "id": "uuid",
  "data": "YYYY-MM-DD",
  "valor": 150.0,
  "descricao": "Emprestimo para mae"
}
```
Notas:
- `emprestimos.feitos` representa dinheiro que saiu (ativo a receber) e `emprestimos.recebidos` dinheiro que entrou (passivo a pagar).
- Datas devem pertencer ao mes/ano da rota.

## Resumos e dashboard (API /summary)
- `GET /api/months/:year/:month/summary` retorna um snapshot contendo:
  - `referencia`, `salarios` (adiantamento, pagamento, bruto).
  - `variaveis` (entradas, saidas, saldo) e `recorrentes.pre_fatura|pos_fatura` (totais).
  - `resultado` (receitas, despesas, liquido calculado, `saldo_disponivel = liquido - poupanca.saldo_mes + emprestimos.saldo_mes`).
  - `poupanca` (aportes, resgates, saldo_mes, saldo_acumulado) e `emprestimos` (feitos, recebidos, saldo_mes, saldo_acumulado).
- `GET /api/years/:year/summary` agrega todos os meses do ano, trazendo `totais`, `medias` (liquido, saldo_disponivel) e a lista de `meses` com os resumos mensais.

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
    "total_liquido": 9729.25
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
  "contas_recorrentes_pos_fatura": [],
  "poupanca": {
    "movimentos": [
      { "id": "3", "data": "2025-01-05", "valor": 500.00, "descricao": "Aporte", "tipo": "aporte" }
    ]
  },
  "emprestimos": {
    "feitos": [],
    "recebidos": [
      { "id": "4", "data": "2025-01-08", "valor": 200.00, "descricao": "Ajuda da familia" }
    ]
  }
}
```
