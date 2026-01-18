const path = require("path");

const DATA_DIR_NAME = "data";
const TRANSACTIONS_DIR_NAME = "transactions";

function resolveDataRoot(baseDir = process.cwd()) {
  return path.resolve(baseDir, DATA_DIR_NAME);
}

function resolveTransactionsDir(baseDir = process.cwd()) {
  return path.join(resolveDataRoot(baseDir), TRANSACTIONS_DIR_NAME);
}

function resolveTransactionsMonthPath(month, baseDir = process.cwd()) {
  return path.join(resolveTransactionsDir(baseDir), `${month}.json`);
}

function resolveGlobalFilePath(fileName, baseDir = process.cwd()) {
  return path.join(resolveDataRoot(baseDir), fileName);
}

module.exports = {
  resolveDataRoot,
  resolveTransactionsDir,
  resolveTransactionsMonthPath,
  resolveGlobalFilePath,
};
