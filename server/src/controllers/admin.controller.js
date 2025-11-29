import adminService from "../services/admin.service.js";

async function exportData(req, res, next) {
  try {
    const result = await adminService.exportData();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const status = await adminService.getStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
}

async function validateImport(req, res, next) {
  try {
    const payload = req.body?.data ?? req.body;
    const result = await adminService.validateImport(payload);
    if (result.errors.length) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function importData(req, res, next) {
  try {
    const payload = req.body?.data ?? req.body;
    const { errors, warnings, result, summary } =
      await adminService.importData(payload);
    if (errors.length) {
      return res.status(400).json({ errors, warnings, summary });
    }
    res.json({ ...result, warnings, summary });
  } catch (err) {
    next(err);
  }
}

async function bootstrapData(req, res, next) {
  try {
    const { errors, warnings, result } = await adminService.bootstrapData(
      req.body || {}
    );
    if (errors.length) {
      return res.status(400).json({ errors, warnings });
    }
    res.json({ ...result, warnings });
  } catch (err) {
    next(err);
  }
}

async function backupData(req, res, next) {
  try {
    const result = await adminService.backupData();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export default {
  exportData,
  importData,
  validateImport,
  bootstrapData,
  getStatus,
  backupData,
};
