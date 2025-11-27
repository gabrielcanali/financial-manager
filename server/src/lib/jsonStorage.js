import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB_FILE = path.resolve(__dirname, "..", "..", "data", "financeiro.json");

const DB_FILE = process.env.DB_FILE
  ? path.resolve(__dirname, "..", "..", process.env.DB_FILE)
  : DEFAULT_DB_FILE;

async function read() {
  try {
    const content = await fs.readFile(DB_FILE, "utf-8");
    if (!content.trim()) return {};
    return JSON.parse(content);
  } catch (err) {
    if (err.code === "ENOENT") {
      return {};
    }
    throw err;
  }
}

async function write(data) {
  const json = JSON.stringify(data, null, 2);
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, json, "utf-8");
}

export default { read, write };