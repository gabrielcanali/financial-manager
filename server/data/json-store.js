const fs = require("fs/promises");
const path = require("path");

async function readJsonFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    const parseError = new Error(`Invalid JSON in ${filePath}`);
    parseError.cause = error;
    throw parseError;
  }
}

async function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, `${content}\n`, "utf8");
}

module.exports = {
  readJsonFile,
  writeJsonFile,
};
