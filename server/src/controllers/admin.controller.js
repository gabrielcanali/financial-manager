import adminService from "../services/admin.service.js";

async function exportData(req, res, next) {
  try {
    const result = await adminService.exportData();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function importData(req, res, next) {
  try {
    const payload = req.body?.data ?? req.body;
    const { errors, result } = await adminService.importData(payload);
    if (errors.length) {
      return res.status(400).json({ errors });
    }
    res.json(result);
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

export default { exportData, importData, backupData };
