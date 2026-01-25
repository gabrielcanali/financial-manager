const path = require('path');
const dataRepository = require('../../data/meta-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function getMeta() {
  return dataRepository.getMeta(baseDir);
}

async function setLastOpenedMonth(month) {
  return dataRepository.setLastOpenedMonth(month, baseDir);
}

module.exports = {
  getMeta,
  setLastOpenedMonth,
};
