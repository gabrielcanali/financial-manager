import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { describe, it, beforeEach, afterEach } from "node:test";
import { createDbHelper } from "./helpers/db.js";

const { DB_TEST_FILE, DB_ABSOLUTE_PATH, resetTestDb } = createDbHelper(
  "tests/tmp/db-summary.json"
);

process.env.DB_FILE = DB_TEST_FILE;

const monthsService = (await import("../src/services/months.service.js")).default;
const summaryService = (await import("../src/services/summary.service.js")).default;
const apartmentService = (await import("../src/services/apartment.service.js")).default;

describe("summary.service", () => {
  beforeEach(resetTestDb);
  afterEach(async () => {
    await fs.rm(DB_ABSOLUTE_PATH, { force: true });
  });

  it("gera resumo mensal com poupanca e emprestimos", async () => {
    await monthsService.setMonthData("2025", "01", {
      adiantamento: 1000,
      pagamento: 2000,
    });
    await monthsService.addEntry("2025", "01", {
      data: "2025-01-05",
      valor: -100,
      descricao: "Conta",
      parcela: null,
    });
    await monthsService.addRecurring(
      "2025",
      "01",
      "contas_recorrentes_pre_fatura",
      {
        data: "2025-01-02",
        valor: -50,
        descricao: "Mensalidade",
      }
    );
    await monthsService.addEntry("2025", "01", {
      data: "2025-01-15",
      valor: 200,
      descricao: "Bonus",
      parcela: null,
    });

    await monthsService.setMonthSavings("2025", "01", {
      movimentos: [
        {
          data: "2025-01-03",
          valor: 200,
          descricao: "Aporte inicial",
          tipo: "aporte",
        },
        {
          data: "2025-01-20",
          valor: 50,
          descricao: "Resgate emergencia",
          tipo: "resgate",
        },
      ],
    });

    await monthsService.setMonthLoans("2025", "01", {
      feitos: [
        { data: "2025-01-04", valor: 100, descricao: "Emprestado amigo" },
      ],
      recebidos: [
        { data: "2025-01-10", valor: 150, descricao: "Peguei emprestado" },
      ],
    });
    await apartmentService.setMonthData("2025", "01", {
      financiamento_caixa: { valor_parcela: 1800, saldo_devedor: 190000 },
      entrada_construtora: { valor_parcela: 400, saldo_devedor: 8000 },
    });

    const summary = await summaryService.getMonthSummary("2025", "01");

    assert(summary, "deve retornar resumo");
    assert.equal(summary.resultado.liquido, 3050);
    assert.equal(summary.poupanca.saldo_mes, 150);
    assert.equal(summary.emprestimos.saldo_mes, 50);
    assert.equal(summary.resultado.saldo_disponivel, 2950);
    assert.equal(summary.apartamento.totais.parcelas, 2200);
    assert.equal(
      summary.apartamento.financiamento_caixa.saldo_devedor,
      190000
    );
  });

  it("gera resumo anual acumulando poupanca e emprestimos", async () => {
    await monthsService.setMonthData("2025", "01", {
      adiantamento: 1000,
      pagamento: 2000,
    });
    await monthsService.addEntry("2025", "01", {
      data: "2025-01-15",
      valor: 50,
      descricao: "Freela",
      parcela: null,
    });
    await monthsService.setMonthSavings("2025", "01", {
      movimentos: [
        {
          data: "2025-01-05",
          valor: 150,
          descricao: "Aporte jan",
          tipo: "aporte",
        },
      ],
    });
    await monthsService.setMonthLoans("2025", "01", {
      feitos: [],
      recebidos: [{ data: "2025-01-08", valor: 50, descricao: "Ajuda" }],
    });
    await apartmentService.setMonthData("2025", "01", {
      financiamento_caixa: { valor_parcela: 1800, saldo_devedor: 190000 },
      entrada_construtora: { valor_parcela: 400, saldo_devedor: 9000 },
    });

    await monthsService.setMonthData("2025", "02", {
      adiantamento: 500,
      pagamento: 500,
    });
    await monthsService.addEntry("2025", "02", {
      data: "2025-02-10",
      valor: -300,
      descricao: "Mercado",
      parcela: null,
    });
    await monthsService.setMonthSavings("2025", "02", {
      movimentos: [
        {
          data: "2025-02-05",
          valor: 100,
          descricao: "Aporte fev",
          tipo: "aporte",
        },
      ],
    });
    await monthsService.setMonthLoans("2025", "02", {
      feitos: [{ data: "2025-02-12", valor: 200, descricao: "Emprestimo mae" }],
      recebidos: [],
    });
    await apartmentService.setMonthData("2025", "02", {
      financiamento_caixa: { valor_parcela: 1850, saldo_devedor: 188000 },
      entrada_construtora: { valor_parcela: 600, saldo_devedor: 5000 },
    });

    const yearly = await summaryService.getYearSummary("2025");
    assert(yearly, "deve retornar resumo anual");
    assert.equal(yearly.totais.resultado.liquido, 3750);
    assert.equal(yearly.totais.poupanca.saldo_final, 250);
    assert.equal(yearly.totais.emprestimos.saldo_final, -150);
    assert.equal(yearly.medias.liquido, 1875);
    assert.equal(yearly.medias.saldo_disponivel, 1675);
    assert.equal(yearly.totais.apartamento.parcelas.total, 4650);
    assert.equal(
      yearly.totais.apartamento.saldo_devedor_final.total,
      193000
    );
    assert.deepEqual(yearly.meses_disponiveis, ["01", "02"]);
  });
});
