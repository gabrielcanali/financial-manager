# financial-manager

API, cliente web e planejamentos para um painel financeiro local usando JSON como armazenamento.

## Como rodar backend + cliente

Instale dependencias:

```bash
cd server && npm install
cd ../client && npm install
```

Dev:
```bash
cd server && npm run dev       # API em http://localhost:3000/api
cd client && npm run dev       # Vite em http://localhost:5173 com proxy para /api
```

Build/producao:
```bash
cd client && npm run build     # gera client/dist
cd server && npm start         # serve API e frontend; usa client/dist se existir
```

- `npm test` (em `server/`) roda os testes de unidade do backend.


Variaveis:
- `PORT` (opcional): porta do servidor.
- `DB_FILE` (opcional): caminho relativo ao backend para o arquivo JSON (default: `data/financeiro.json`).

Health check: `GET /health`.

## Rotas principais (prefixed por /api)
- `GET /months/:year/:month` - retorna o mes (`year=YYYY`, `month=MM`).
- `GET /months/:year/:month/summary` - resumo mensal (receitas, despesas, poupanca, emprestimos, saldo disponivel).
- `PUT /months/:year/:month/data` - define `adiantamento` e `pagamento`.
- `PUT /months/:year/:month/calendar` - define `pagamentos[]` e `fechamento_fatura`.
- `PUT /months/:year/:month/savings` - define movimentos de poupanca (`movimentos`: lista com `data`, `valor`, `descricao`, `tipo` = `aporte`|`resgate`).
- `PUT /months/:year/:month/loans` - define emprestimos feitos/recebidos (`feitos`/`recebidos`: listas com `data`, `valor`, `descricao`).
- `POST /months/:year/:month/entries` - cria lancamento de entrada/saida.
- `PUT /months/:year/:month/entries/:entryId` - atualiza lancamento.
- `DELETE /months/:year/:month/entries/:entryId` - remove lancamento.
- `POST /months/:year/:month/recurrents/:period` - cria recorrente (`period` = `pre` ou `pos`).
- `PUT /months/:year/:month/recurrents/:period/:recurringId` - atualiza recorrente.
- `DELETE /months/:year/:month/recurrents/:period/:recurringId` - remove recorrente.
- `GET /years/:year/summary` - resumo anual agregado (salarios, variaveis, poupanca, emprestimos).
- `PUT /apartment/:year/:month` - define parcelas do financiamento (Caixa/Construtora) e saldo devedor do mes.
- `GET /apartment/:year/:month` - retorna snapshot do mes (parcelas, diferencas vs mes anterior e totais).
- `GET /apartment/evolution` - serie ordenada para graficos com Caixa, Construtora e linha combinada (aceita `?year=YYYY`).
- Flags opcionais:
  - `?generateFuture=true` em `POST /entries` cria automaticamente as demais parcelas futuras baseadas em `parcela` (`n/m`).
  - `?generateFuture=true` em `POST /recurrents` gera meses futuros ate `recorrencia.termina_em`.
  - `?cascade=true` em `PUT /entries` ou `PUT /recurrents` aplica a alteracao para toda a serie (parcelas/recorrencias restantes).
- Admin e operacao:
  - `GET /admin/status` - retorna se ha base carregada e a configuracao atual.
  - `GET /admin/export` - devolve o JSON completo atual.
  - `POST /admin/validate` - valida um JSON sem sobrescrever a base.
  - `POST /admin/import?backup=true|false` - sobrescreve o JSON com o corpo enviado e (por padrao) cria um backup antes.
  - `POST /admin/bootstrap` - cria uma nova base vazia com configuracoes iniciais.
  - `POST /admin/backup` - grava um arquivo de backup em `data/backups/financeiro-<timestamp>.json`.

Formato de datas: ISO `YYYY-MM-DD`. Valores numericos (positivo=entrada, negativo=saida).

Contrato de dados detalhado em `docs/schema.md` e roadmap em `docs/planejamento.md`.
