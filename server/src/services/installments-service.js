const { AppError } = require('../http/app-error');
const installmentsRepository = require('../repositories/installments-repository');

function buildConflictError(code, message, details = null) {
  return new AppError({
    code,
    message,
    status: 409,
    details,
  });
}

function mapRepositoryError(error, context = {}) {
  if (!error) {
    return null;
  }

  const message = error.message || '';

  if (message.startsWith('Installment groupId already exists')) {
    return new AppError({
      code: 'INSTALLMENT_GROUP_ALREADY_EXISTS',
      message: 'Installment groupId already exists',
      status: 409,
      details: context.groupId ? { groupId: context.groupId } : null,
    });
  }

  if (message.startsWith('Installment parentId already exists')) {
    return new AppError({
      code: 'INSTALLMENT_PARENT_ALREADY_EXISTS',
      message: 'Installment parentId already exists',
      status: 409,
      details: context.parentId ? { parentId: context.parentId } : null,
    });
  }

  if (message.startsWith('Transaction id already exists')) {
    return new AppError({
      code: 'INSTALLMENT_PARCEL_ALREADY_EXISTS',
      message: 'Installment parcel id already exists',
      status: 409,
      details: context.parcelId ? { id: context.parcelId } : null,
    });
  }

  if (message.startsWith('Installment parent not found')) {
    return new AppError({
      code: 'INSTALLMENT_PARENT_NOT_FOUND',
      message: 'Installment parent not found',
      status: 404,
      details: context.groupId ? { groupId: context.groupId } : null,
    });
  }

  if (message.startsWith('Installment parcel not found')) {
    return new AppError({
      code: 'INSTALLMENT_PARCEL_NOT_FOUND',
      message: 'Installment parcel not found',
      status: 404,
      details: context.parcelId ? { id: context.parcelId } : null,
    });
  }

  if (message === 'Edited parcels require conflictStrategy') {
    return buildConflictError(
      'INSTALLMENT_CONFLICT_CONFIRMATION_REQUIRED',
      'Edited parcels require conflictStrategy',
      context.groupId ? { groupId: context.groupId } : null
    );
  }

  if (message === 'Installment parent update cancelled') {
    return buildConflictError(
      'INSTALLMENT_UPDATE_CANCELLED',
      'Installment parent update cancelled',
      context.groupId ? { groupId: context.groupId } : null
    );
  }

  if (message === 'Invalid conflictStrategy') {
    return new AppError({
      code: 'INSTALLMENT_CONFLICT_STRATEGY_INVALID',
      message: 'conflictStrategy must be skipEdited, overwriteEdited, or cancel',
      status: 400,
      details: null,
    });
  }

  if (message === 'Target transaction is not an installment parcel') {
    return buildConflictError(
      'INSTALLMENT_PARCEL_INVALID_TARGET',
      'Target transaction is not an installment parcel',
      context.parcelId ? { id: context.parcelId } : null
    );
  }

  if (message === 'Installment parcel date must match target month') {
    return new AppError({
      code: 'INSTALLMENT_PARCEL_MONTH_MISMATCH',
      message: 'Installment parcel date must match target month',
      status: 400,
      details: context.month ? { month: context.month } : null,
    });
  }

  if (message.endsWith('cannot be changed')) {
    return buildConflictError('INSTALLMENT_IMMUTABLE_FIELD', message, null);
  }

  return null;
}

async function createInstallmentPlan({ payload }) {
  try {
    return await installmentsRepository.createInstallmentPlan(payload);
  } catch (error) {
    const mapped = mapRepositoryError(error, {
      groupId: payload?.groupId,
      parentId: payload?.parentId,
    });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function updateInstallmentParent({ parent, conflictStrategy }) {
  try {
    return await installmentsRepository.updateInstallmentParent(parent, {
      conflictStrategy,
    });
  } catch (error) {
    const mapped = mapRepositoryError(error, {
      groupId: parent?.installment?.groupId,
    });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function updateInstallmentParcel({ month, parcel }) {
  try {
    return await installmentsRepository.updateInstallmentParcel(month, parcel);
  } catch (error) {
    const mapped = mapRepositoryError(error, {
      month,
      parcelId: parcel?.id,
    });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

async function deleteInstallmentGroup({ groupId, deleteParcels }) {
  try {
    await installmentsRepository.deleteInstallmentGroup(groupId, {
      deleteParcels,
    });
  } catch (error) {
    const mapped = mapRepositoryError(error, { groupId });
    if (mapped) {
      throw mapped;
    }
    throw error;
  }
}

module.exports = {
  createInstallmentPlan,
  updateInstallmentParent,
  updateInstallmentParcel,
  deleteInstallmentGroup,
};
