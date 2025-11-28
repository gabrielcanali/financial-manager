import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createDbHelper(dbFileRelative = path.join("tests", "tmp", "db-test.json")) {
  const DB_TEST_FILE = dbFileRelative;
  const DB_ABSOLUTE_PATH = path.resolve(__dirname, "..", "..", DB_TEST_FILE);

  const resetTestDb = async () => {
    await fs.mkdir(path.dirname(DB_ABSOLUTE_PATH), { recursive: true });
    await fs.writeFile(DB_ABSOLUTE_PATH, "", "utf-8");
  };

  const seedDb = async (content) => {
    await fs.mkdir(path.dirname(DB_ABSOLUTE_PATH), { recursive: true });
    const json = JSON.stringify(content, null, 2);
    await fs.writeFile(DB_ABSOLUTE_PATH, json, "utf-8");
  };

  const readDb = async () => {
    const raw = await fs.readFile(DB_ABSOLUTE_PATH, "utf-8");
    return raw.trim() ? JSON.parse(raw) : {};
  };

  return { DB_TEST_FILE, DB_ABSOLUTE_PATH, resetTestDb, seedDb, readDb };
}

export { createDbHelper };
