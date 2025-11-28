import monthsService from "./months.service.js";
import apartmentService from "./apartment.service.js";

function padMonth(month) {
  return String(month).padStart(2, "0");
}

function summarizeList(list = []) {
  return list.reduce(
    (acc, item) => {
      const valor = Number(item.valor || 0);
      if (valor >= 0) {
        acc.entradas += valor;
      } else {
        acc.saidas += valor;
        acc.saidasAbs += Math.abs(valor);
      }
      acc.saldo += valor;
      return acc;
    },
    { entradas: 0, saidas: 0, saldo: 0, saidasAbs: 0 }
  );
}

function summarizeSavings(movimentos = [], previousBalance = 0) {
  const aportes = movimentos
    .filter((item) => item.tipo === "aporte")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const resgates = movimentos
    .filter((item) => item.tipo === "resgate")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const saldoMes = aportes - resgates;
  const saldoAcumulado = Number((previousBalance + saldoMes).toFixed(2));

  return {
    aportes: Number(aportes.toFixed(2)),
    resgates: Number(resgates.toFixed(2)),
    saldo_mes: Number(saldoMes.toFixed(2)),
    saldo_acumulado: saldoAcumulado,
  };
}

function summarizeLoans(emprestimos = {}, previousBalance = 0) {
  const feitos = (emprestimos.feitos || []).reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );
  const recebidos = (emprestimos.recebidos || []).reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );

  const saldoMes = recebidos - feitos;
  const saldoAcumulado = Number((previousBalance + saldoMes).toFixed(2));

  return {
    feitos: Number(feitos.toFixed(2)),
    recebidos: Number(recebidos.toFixed(2)),
    saldo_mes: Number(saldoMes.toFixed(2)),
    saldo_acumulado: saldoAcumulado,
  };
}

function buildMonthSummary(year, month, monthRef, { savingsAccum, loansAccum, apartment }) {
  const salarios = {
    adiantamento: Number(monthRef.dados?.adiantamento || 0),
    pagamento: Number(monthRef.dados?.pagamento || 0),
  };
  const salarioBruto = salarios.adiantamento + salarios.pagamento;

  const variaveis = summarizeList(monthRef.entradas_saidas || []);
  const recorrentesPre = summarizeList(
    monthRef.contas_recorrentes_pre_fatura || []
  );
  const recorrentesPos = summarizeList(
    monthRef.contas_recorrentes_pos_fatura || []
  );

  const receitas =
    salarioBruto +
    variaveis.entradas +
    recorrentesPre.entradas +
    recorrentesPos.entradas;
  const despesas =
    variaveis.saidasAbs + recorrentesPre.saidasAbs + recorrentesPos.saidasAbs;

  const liquido =
    monthRef.dados?.total_liquido ??
    salarioBruto +
      variaveis.saldo +
      recorrentesPre.saldo +
      recorrentesPos.saldo;

  const poupanca = summarizeSavings(monthRef.poupanca?.movimentos, savingsAccum);
  const emprestimos = summarizeLoans(monthRef.emprestimos, loansAccum);

  const saldoDisponivel = Number(
    (Number(liquido) - poupanca.saldo_mes + emprestimos.saldo_mes).toFixed(2)
  );

  return {
    referencia: `${year}-${month}`,
    salarios: {
      ...salarios,
      bruto: Number(salarioBruto.toFixed(2)),
    },
    variaveis: {
      entradas: Number(variaveis.entradas.toFixed(2)),
      saidas: Number(variaveis.saidas.toFixed(2)),
      saldo: Number(variaveis.saldo.toFixed(2)),
    },
    recorrentes: {
      pre_fatura: {
        total: Number(recorrentesPre.saldo.toFixed(2)),
        entradas: Number(recorrentesPre.entradas.toFixed(2)),
        saidas: Number(recorrentesPre.saidas.toFixed(2)),
      },
      pos_fatura: {
        total: Number(recorrentesPos.saldo.toFixed(2)),
        entradas: Number(recorrentesPos.entradas.toFixed(2)),
        saidas: Number(recorrentesPos.saidas.toFixed(2)),
      },
    },
    resultado: {
      receitas: Number(receitas.toFixed(2)),
      despesas: Number(despesas.toFixed(2)),
      liquido: Number(Number(liquido).toFixed(2)),
      saldo_disponivel: saldoDisponivel,
    },
    poupanca,
    emprestimos,
    apartamento: apartment ?? {
      referencia: `${year}-${month}`,
      financiamento_caixa: null,
      entrada_construtora: null,
      totais: null,
    },
  };
}

async function loadYearMonths(year) {
  const normalizedYear = String(year);
  const months = [];

  for (let i = 1; i <= 12; i += 1) {
    const monthKey = padMonth(i);
    const monthRef = await monthsService.getMonth(normalizedYear, monthKey);
    if (monthRef) {
      months.push({ month: monthKey, data: monthRef });
    }
  }

  return months;
}

async function getMonthSummary(year, month) {
  const normalizedMonth = padMonth(month);
  const months = await loadYearMonths(year);
  let savingsAccum = 0;
  let loansAccum = 0;
  let result = null;

  for (const { month: monthKey, data } of months) {
    const apartment = await apartmentService.getMonth(year, monthKey);
    const summary = buildMonthSummary(year, monthKey, data, {
      savingsAccum,
      loansAccum,
      apartment,
    });
    savingsAccum = summary.poupanca.saldo_acumulado;
    loansAccum = summary.emprestimos.saldo_acumulado;

    if (monthKey === normalizedMonth) {
      result = summary;
    }
  }

  return result;
}

async function getYearSummary(year) {
  const months = await loadYearMonths(year);
  if (!months.length) return null;

  let savingsAccum = 0;
  let loansAccum = 0;

  const monthly = [];
  for (const { month, data } of months) {
    const apartment = await apartmentService.getMonth(year, month);
    const summary = buildMonthSummary(year, month, data, {
      savingsAccum,
      loansAccum,
      apartment,
    });
    savingsAccum = summary.poupanca.saldo_acumulado;
    loansAccum = summary.emprestimos.saldo_acumulado;
    monthly.push(summary);
  }

  const totals = monthly.reduce(
    (acc, item) => {
      acc.salarios.adiantamento += item.salarios.adiantamento;
      acc.salarios.pagamento += item.salarios.pagamento;
      acc.salarios.bruto += item.salarios.bruto;

      acc.variaveis.entradas += item.variaveis.entradas;
      acc.variaveis.saidas += item.variaveis.saidas;
      acc.variaveis.saldo += item.variaveis.saldo;

      acc.recorrentes.pre_fatura += item.recorrentes.pre_fatura.total;
      acc.recorrentes.pos_fatura += item.recorrentes.pos_fatura.total;

      acc.resultado.receitas += item.resultado.receitas;
      acc.resultado.despesas += item.resultado.despesas;
      acc.resultado.liquido += item.resultado.liquido;
      acc.resultado.saldo_disponivel += item.resultado.saldo_disponivel;

      acc.poupanca.aportes += item.poupanca.aportes;
      acc.poupanca.resgates += item.poupanca.resgates;
      acc.emprestimos.feitos += item.emprestimos.feitos;
      acc.emprestimos.recebidos += item.emprestimos.recebidos;
      if (item.apartamento.financiamento_caixa) {
        acc.apartamento.parcelas.caixa +=
          item.apartamento.financiamento_caixa.valor_parcela;
        if (item.apartamento.financiamento_caixa.saldo_devedor !== null) {
          acc.apartamento.saldo_devedor_final.caixa =
            item.apartamento.financiamento_caixa.saldo_devedor;
        }
      }
      if (item.apartamento.entrada_construtora) {
        acc.apartamento.parcelas.construtora +=
          item.apartamento.entrada_construtora.valor_parcela;
        if (item.apartamento.entrada_construtora.saldo_devedor !== null) {
          acc.apartamento.saldo_devedor_final.construtora =
            item.apartamento.entrada_construtora.saldo_devedor;
        }
      }
      if (item.apartamento.totais) {
        acc.apartamento.parcelas.total += item.apartamento.totais.parcelas;
        if (item.apartamento.totais.saldo_devedor !== null) {
          acc.apartamento.saldo_devedor_final.total =
            item.apartamento.totais.saldo_devedor;
        }
      }
      return acc;
    },
    {
      salarios: { adiantamento: 0, pagamento: 0, bruto: 0 },
      variaveis: { entradas: 0, saidas: 0, saldo: 0 },
      recorrentes: { pre_fatura: 0, pos_fatura: 0 },
      resultado: {
        receitas: 0,
        despesas: 0,
        liquido: 0,
        saldo_disponivel: 0,
      },
      poupanca: { aportes: 0, resgates: 0 },
      emprestimos: { feitos: 0, recebidos: 0 },
      apartamento: {
        parcelas: { caixa: 0, construtora: 0, total: 0 },
        saldo_devedor_final: { caixa: null, construtora: null, total: null },
      },
    }
  );

  const count = monthly.length;
  return {
    ano: String(year).padStart(4, "0"),
    meses_disponiveis: monthly.map((item) => item.referencia.split("-")[1]),
    totais: {
      salarios: {
        adiantamento: Number(totals.salarios.adiantamento.toFixed(2)),
        pagamento: Number(totals.salarios.pagamento.toFixed(2)),
        bruto: Number(totals.salarios.bruto.toFixed(2)),
      },
      variaveis: {
        entradas: Number(totals.variaveis.entradas.toFixed(2)),
        saidas: Number(totals.variaveis.saidas.toFixed(2)),
        saldo: Number(totals.variaveis.saldo.toFixed(2)),
      },
      recorrentes: {
        pre_fatura: Number(totals.recorrentes.pre_fatura.toFixed(2)),
        pos_fatura: Number(totals.recorrentes.pos_fatura.toFixed(2)),
      },
      resultado: {
        receitas: Number(totals.resultado.receitas.toFixed(2)),
        despesas: Number(totals.resultado.despesas.toFixed(2)),
        liquido: Number(totals.resultado.liquido.toFixed(2)),
        saldo_disponivel: Number(totals.resultado.saldo_disponivel.toFixed(2)),
      },
      poupanca: {
        aportes: Number(totals.poupanca.aportes.toFixed(2)),
        resgates: Number(totals.poupanca.resgates.toFixed(2)),
        saldo_final: Number(savingsAccum.toFixed(2)),
      },
      emprestimos: {
        feitos: Number(totals.emprestimos.feitos.toFixed(2)),
        recebidos: Number(totals.emprestimos.recebidos.toFixed(2)),
        saldo_final: Number(loansAccum.toFixed(2)),
      },
      apartamento: {
        parcelas: {
          caixa: Number(totals.apartamento.parcelas.caixa.toFixed(2)),
          construtora: Number(
            totals.apartamento.parcelas.construtora.toFixed(2)
          ),
          total: Number(totals.apartamento.parcelas.total.toFixed(2)),
        },
        saldo_devedor_final: {
          caixa: totals.apartamento.saldo_devedor_final.caixa,
          construtora: totals.apartamento.saldo_devedor_final.construtora,
          total: totals.apartamento.saldo_devedor_final.total,
        },
      },
    },
    medias: {
      liquido: Number((totals.resultado.liquido / count).toFixed(2)),
      saldo_disponivel: Number(
        (totals.resultado.saldo_disponivel / count).toFixed(2)
      ),
    },
    meses: monthly,
  };
}

export default { getMonthSummary, getYearSummary };
