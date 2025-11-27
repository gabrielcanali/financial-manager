import jsonStorage from "../lib/jsonStorage.js";

function ensureMonthStructure(db, year, month) {
  if (!db.anos) db.anos = {};
  if (!db.anos[year]) db.anos[year] = { meses: {} };

  if (!db.anos[year].meses[month]) {
    db.anos[year].meses[month] = {
      dados: {
        adiantamento: 0,
        pagamento: 0,
        total_liquido: 0
      },
      calendario: {
        pagamentos: [],
        fechamento_fatura: null
      },
      entradas_saidas: [],
      contas_recorrentes_pre_fatura: [],
      contas_recorrentes_pos_fatura: []
    };
  }

  return db.anos[year].meses[month];
}

async function getMonth(year, month) {
  const db = await jsonStorage.read();
  return db.anos?.[year]?.meses?.[month] ?? null;
}

async function addEntry(year, month, entry) {
  const db = await jsonStorage.read();
  const monthRef = ensureMonthStructure(db, year, month);

  // TODO: definir 'tipo' = 'entrada' | 'saida', etc.
  monthRef.entradas_saidas.push(entry);

  // TODO: adicionar lógica para recalcular dados.dados / totais
  await jsonStorage.write(db);

  return monthRef;
}

export default { getMonth, addEntry };