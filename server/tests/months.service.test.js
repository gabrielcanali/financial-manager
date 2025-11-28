import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, beforeEach, afterEach } from "node:test";

const DB_TEST_FILE = path.join("tests", "tmp", "db-test.json");
process.env.DB_FILE = DB_TEST_FILE;

const monthsService = (await import("../src/services/months.service.js")).default;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_ABSOLUTE_PATH = path.resolve(__dirname, "..", DB_TEST_FILE);

async function resetTestDb() {
  await fs.mkdir(path.dirname(DB_ABSOLUTE_PATH), { recursive: true });
  await fs.writeFile(DB_ABSOLUTE_PATH, "", "utf-8");
}

describe("months.service", () => {
  beforeEach(resetTestDb);
  afterEach(async () => {
    await fs.rm(DB_ABSOLUTE_PATH, { force: true });
  });

  it("cria mes e recalcula total_liquido ao adicionar entrada", async () => {
    await monthsService.setMonthData("2025", "01", {
      adiantamento: 400,
      pagamento: 600,
    });

    const month = await monthsService.addEntry("2025", "01", {
      data: "2025-01-05",
      valor: -100,
      descricao: "Conta de teste",
      parcela: null,
    });

    assert.equal(month.dados.total_liquido, 900);
    assert.equal(month.entradas_saidas.length, 1);
    assert.ok(month.entradas_saidas[0].id);
  });

  it("atualiza e remove recorrentes recalculando total", async () => {
    await monthsService.setMonthData("2025", "02", {
      adiantamento: 1000,
      pagamento: 2000,
    });

    await monthsService.addRecurring(
      "2025",
      "02",
      "contas_recorrentes_pre_fatura",
      {
        data: "2025-02-10",
        valor: -500,
        descricao: "Internet",
      }
    );

    let month = await monthsService.getMonth("2025", "02");
    assert.equal(month.dados.total_liquido, 2500);

    const recurringId = month.contas_recorrentes_pre_fatura[0].id;
    await monthsService.updateRecurring(
      "2025",
      "02",
      "contas_recorrentes_pre_fatura",
      recurringId,
      { valor: -300 }
    );

    month = await monthsService.getMonth("2025", "02");
    assert.equal(month.dados.total_liquido, 2700);

    await monthsService.deleteRecurring(
      "2025",
      "02",
      "contas_recorrentes_pre_fatura",
      recurringId
    );

    month = await monthsService.getMonth("2025", "02");
    assert.equal(month.dados.total_liquido, 3000);
    assert.equal(month.contas_recorrentes_pre_fatura.length, 0);
  });
});
