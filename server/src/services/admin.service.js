import fs from "node:fs/promises";
import path from "node:path";
import jsonStorage from "../lib/jsonStorage.js";

function nowIso() {
  return new Date().toISOString();
}

function getBackupDir() {
  const dbFile = jsonStorage.getDbFilePath();
  return path.join(path.dirname(dbFile), "backups");
}

function validateImportPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    errors.push("Payload deve ser um objeto JSON.");
    return errors;
  }
  if (payload.anos && typeof payload.anos !== "object") {
    errors.push("Campo 'anos' deve ser um objeto.");
  }
  if (payload.apartamento && typeof payload.apartamento !== "object") {
    errors.push("Campo 'apartamento' deve ser um objeto.");
  }
  return errors;
}

async function exportData() {
  const db = await jsonStorage.read();
  return {
    exported_at: nowIso(),
    db,
  };
}

async function importData(payload) {
  const errors = validateImportPayload(payload);
  if (errors.length) {
    return { errors, result: null };
  }

  await jsonStorage.write(payload);
  return {
    errors: [],
    result: {
      imported_at: nowIso(),
      status: "ok",
      size_bytes: Buffer.byteLength(JSON.stringify(payload)),
    },
  };
}

async function backupData() {
  const backupDir = getBackupDir();
  await fs.mkdir(backupDir, { recursive: true });
  const db = await jsonStorage.read();
  const serialized = JSON.stringify(db, null, 2);
  const timestamp = nowIso().replace(/[:.]/g, "-");
  const filename = `financeiro-${timestamp}.json`;
  const dest = path.join(backupDir, filename);
  await fs.writeFile(dest, serialized, "utf-8");

  return {
    backup_at: nowIso(),
    file: dest,
    size_bytes: Buffer.byteLength(serialized),
  };
}

export default { exportData, importData, backupData };
