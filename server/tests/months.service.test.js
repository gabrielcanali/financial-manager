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

async function seedDb(content) {
  await fs.mkdir(path.dirname(DB_ABSOLUTE_PATH), { recursive: true });
  const json = JSON.stringify(content, null, 2);
  await fs.writeFile(DB_ABSOLUTE_PATH, json, "utf-8");
}

async function readDb() {
  const raw = await fs.readFile(DB_ABSOLUTE_PATH, "utf-8");
  return raw.trim() ? JSON.parse(raw) : {};
}

describe("months.service", () => {
  beforeEach(resetTestDb);
  afterEach(async () => {
    await fs.rm(DB_ABSOLUTE_PATH, { force: true });
  });

  it("migra dados legados gerando ids e recalcula total", async () => {
    await seedDb({
      anos: {
        "2025": {
          meses: {
            "01": {
              dados: { adiantamento: 100, pagamento: 50 },
              entradas_saidas: [
                { data: "2025-01-10", valor: -20, descricao: "Sem id" },
              ],
              contas_recorrentes_pre_fatura: [
                { data: "2025-01-05", valor: -30, descricao: "Internet" },
              ],
              contas_recorrentes_pos_fatura: [],
            },
          },
        },
      },
    });

    const month = await monthsService.getMonth("2025", "01");
    assert.equal(month.entradas_saidas[0].parcela, null);
    assert.ok(month.entradas_saidas[0].id);
    assert.ok(month.contas_recorrentes_pre_fatura[0].id);
    assert.equal(month.dados.total_liquido, 100 + 50 - 20 - 30);

    const persisted = await readDb();
    assert.ok(
      persisted.anos["2025"].meses["01"].entradas_saidas[0].id,
      "id migrado deve ser persistido"
    );
  });

  it("gera parcelas futuras e aplica atualizacao em cascata", async () => {
    await monthsService.setMonthData("2025", "01", {
      adiantamento: 0,
      pagamento: 0,
    });

    const month = await monthsService.addEntry(
      "2025",
      "01",
      {
        data: "2025-01-05",
        valor: -100,
        descricao: "Cartao",
        parcela: "1/3",
      },
      { generateFutureInstallments: true }
    );

    const baseEntry = month.entradas_saidas[0];
    const feb = await monthsService.getMonth("2025", "02");
    const mar = await monthsService.getMonth("2025", "03");

    assert.equal(feb.entradas_saidas[0].parcela, "2/3");
    assert.equal(mar.entradas_saidas[0].parcela, "3/3");
    assert.ok(feb.entradas_saidas[0].serie_id);
    assert.equal(feb.entradas_saidas[0].serie_id, baseEntry.serie_id);
    assert.equal(mar.dados.total_liquido, -100);

    await monthsService.updateEntry(
      "2025",
      "01",
      baseEntry.id,
      { valor: -200 },
      { cascade: true }
    );

    const febAfter = await monthsService.getMonth("2025", "02");
    const marAfter = await monthsService.getMonth("2025", "03");
    assert.equal(febAfter.entradas_saidas[0].valor, -200);
    assert.equal(marAfter.entradas_saidas[0].valor, -200);
    assert.equal(febAfter.dados.total_liquido, -200);
  });

  it("gera recorrencias futuras e cascata de atualizacao", async () => {
    const jan = await monthsService.addRecurring(
      "2025",
      "01",
      "contas_recorrentes_pre_fatura",
      {
        data: "2025-01-03",
        valor: -40,
        descricao: "Internet",
        recorrencia: { tipo: "mensal", termina_em: "2025-03" },
      },
      { generateFutureRecurring: true }
    );

    const serieId = jan.contas_recorrentes_pre_fatura[0].serie_id;
    const feb = await monthsService.getMonth("2025", "02");
    const mar = await monthsService.getMonth("2025", "03");

    assert.equal(jan.contas_recorrentes_pre_fatura.length, 1);
    assert.equal(feb.contas_recorrentes_pre_fatura.length, 1);
    assert.equal(mar.contas_recorrentes_pre_fatura.length, 1);
    assert.equal(feb.contas_recorrentes_pre_fatura[0].serie_id, serieId);

    await monthsService.updateRecurring(
      "2025",
      "01",
      "contas_recorrentes_pre_fatura",
      jan.contas_recorrentes_pre_fatura[0].id,
      { valor: -60 },
      { cascade: true }
    );

    const marAfter = await monthsService.getMonth("2025", "03");
    assert.equal(marAfter.contas_recorrentes_pre_fatura[0].valor, -60);
    assert.equal(marAfter.dados.total_liquido, -60);
  });
});
