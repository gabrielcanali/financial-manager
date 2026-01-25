const path = require('path');
const dataRepository = require('../../data/installments-repository');

const baseDir = path.resolve(__dirname, '../../..');

async function createInstallmentPlan(payload) {
  return dataRepository.createInstallmentPlan(payload, baseDir);
}

async function updateInstallmentParent(parent, options = {}) {
  return dataRepository.updateInstallmentParent(parent, options, baseDir);
}

async function updateInstallmentParcel(month, parcel) {
  return dataRepository.updateInstallmentParcel(month, parcel, baseDir);
}

async function deleteInstallmentGroup(groupId, options = {}) {
  return dataRepository.deleteInstallmentGroup(groupId, options, baseDir);
}

module.exports = {
  createInstallmentPlan,
  updateInstallmentParent,
  updateInstallmentParcel,
  deleteInstallmentGroup,
};
