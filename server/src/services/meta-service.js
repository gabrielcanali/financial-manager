const metaRepository = require('../repositories/meta-repository');

async function getMeta() {
  return metaRepository.getMeta();
}

async function updateLastOpenedMonth({ lastOpenedMonth }) {
  return metaRepository.setLastOpenedMonth(lastOpenedMonth);
}

module.exports = {
  getMeta,
  updateLastOpenedMonth,
};
