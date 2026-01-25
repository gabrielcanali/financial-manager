const installmentsService = require('../services/installments-service');
const { sendSuccess } = require('../http/response');

async function createInstallmentPlan(req, res, next) {
  try {
    const payload = req.body;
    const items = await installmentsService.createInstallmentPlan({ payload });
    return sendSuccess(res, { data: { items }, meta: {} }, 201);
  } catch (error) {
    return next(error);
  }
}

async function updateInstallmentParent(req, res, next) {
  try {
    const { groupId } = req.params;
    const conflictStrategy = req.query.conflictStrategy;
    const parent = {
      ...req.body,
      installment: {
        ...req.body.installment,
        groupId,
      },
    };
    const result = await installmentsService.updateInstallmentParent({
      parent,
      conflictStrategy,
    });
    return sendSuccess(res, { data: result, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function updateInstallmentParcel(req, res, next) {
  try {
    const { month, id } = req.params;
    const parcel = { ...req.body, id };
    const updated = await installmentsService.updateInstallmentParcel({
      month,
      parcel,
    });
    return sendSuccess(res, { data: updated, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

async function deleteInstallmentGroup(req, res, next) {
  try {
    const { groupId } = req.params;
    const deleteParcels = req.query.deleteParcels === 'true';
    await installmentsService.deleteInstallmentGroup({ groupId, deleteParcels });
    return sendSuccess(res, { data: {}, meta: {} }, 200);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createInstallmentPlan,
  updateInstallmentParent,
  updateInstallmentParcel,
  deleteInstallmentGroup,
};
