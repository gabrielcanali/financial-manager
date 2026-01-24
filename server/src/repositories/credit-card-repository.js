const path = require('path');
const dataRepository = require('../../data/credit-card-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function getCreditCardConfig() {
  return dataRepository.getCreditCardConfig(baseDir);
}

async function setCreditCardConfig(config) {
  return dataRepository.setCreditCardConfig(config, baseDir);
}

module.exports = {
  getCreditCardConfig,
  setCreditCardConfig,
};
