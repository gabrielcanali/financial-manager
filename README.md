# financial-manager

API e planejamentos para um painel financeiro local usando JSON como armazenamento.

## Como rodar o backend

```bash
cd server
npm install
npm run dev   # ou npm start
# npm test    # executa testes de unidade
```

Variaveis:
- `PORT` (opcional): porta do servidor.
- `DB_FILE` (opcional): caminho relativo ao backend para o arquivo JSON (default: `data/financeiro.json`).

Health check: `GET /health`.

## Rotas principais (prefixed por /api)
- `GET /months/:year/:month` — retorna o mes (`year=YYYY`, `month=MM`).
- `PUT /months/:year/:month/data` — define `adiantamento` e `pagamento`.
- `PUT /months/:year/:month/calendar` — define `pagamentos[]` e `fechamento_fatura`.
- `POST /months/:year/:month/entries` — cria lancamento de entrada/saida.
- `PUT /months/:year/:month/entries/:entryId` — atualiza lancamento.
- `DELETE /months/:year/:month/entries/:entryId` — remove lancamento.
- `POST /months/:year/:month/recurrents/:period` — cria recorrente (`period` = `pre` ou `pos`).
- `PUT /months/:year/:month/recurrents/:period/:recurringId` — atualiza recorrente.
- `DELETE /months/:year/:month/recurrents/:period/:recurringId` — remove recorrente.

Formato de datas: ISO `YYYY-MM-DD`. Valores numericos (positivo=entrada, negativo=saida).

Contrato de dados detalhado em `docs/schema.md` e roadmap em `docs/planejamento.md`.
