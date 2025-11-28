import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { describe, it, beforeEach, afterEach } from "node:test";
import { createDbHelper } from "./helpers/db.js";

const {
  DB_TEST_FILE,
  DB_ABSOLUTE_PATH,
  resetTestDb,
  readDb,
} = createDbHelper("tests/tmp/db-apartment.json");

process.env.DB_FILE = DB_TEST_FILE;

const apartmentService = (await import("../src/services/apartment.service.js")).default;

describe("apartment.service", () => {
  beforeEach(resetTestDb);
  afterEach(async () => {
    await fs.rm(DB_ABSOLUTE_PATH, { force: true });
  });

  it("registra parcelas e calcula diferenca e saldo devedor", async () => {
    const jan = await apartmentService.setMonthData("2025", "01", {
      financiamento_caixa: { valor_parcela: 1200, saldo_devedor: 200000 },
    });

    assert.equal(jan.financiamento_caixa.valor_parcela, 1200);
    assert.equal(jan.financiamento_caixa.diferenca_vs_mes_anterior, null);
    assert.equal(jan.totais.parcelas, 1200);
    assert.equal(jan.totais.saldo_devedor, 200000);

    const feb = await apartmentService.setMonthData("2025", "02", {
      financiamento_caixa: { valor_parcela: 1250, saldo_devedor: 198500 },
      entrada_construtora: { valor_parcela: 800, saldo_devedor: 15000 },
    });

    assert.equal(feb.financiamento_caixa.diferenca_vs_mes_anterior, 50);
    assert.equal(feb.financiamento_caixa.saldo_devedor_variacao, -1500);
    assert.equal(feb.totais.parcelas, 2050);
    assert.equal(feb.totais.saldo_devedor, 213500);

    const evolution = await apartmentService.getEvolution();
    assert.equal(
      evolution.financiamento_caixa[1].diferenca_vs_mes_anterior,
      50
    );
    assert.equal(evolution.entrada_construtora[0].saldo_devedor, 15000);
    assert.equal(evolution.combinada[1].diferenca_vs_mes_anterior, 850);
    assert.equal(evolution.combinada[1].saldo_devedor_variacao, 13500);

    const persisted = await readDb();
    assert.equal(
      persisted.apartamento.financiamento_caixa[0].mes,
      "01",
      "mes deve ser normalizado com zero a esquerda"
    );
  });

  it("remove dados do mes quando recebe null", async () => {
    await apartmentService.setMonthData("2025", "01", {
      financiamento_caixa: { valor_parcela: 1000, saldo_devedor: 150000 },
      entrada_construtora: { valor_parcela: 400, saldo_devedor: 20000 },
    });

    const cleaned = await apartmentService.setMonthData("2025", "01", {
      financiamento_caixa: null,
    });

    assert.equal(cleaned.financiamento_caixa, null);
    assert.ok(cleaned.entrada_construtora);
    assert.equal(cleaned.totais.parcelas, 400);
  });
});
