import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import routes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "..", "..", "client");
const distDir = path.join(clientDir, "dist");
const staticDir = fs.existsSync(path.join(distDir, "index.html"))
  ? distDir
  : clientDir;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Responde 400 para JSON malformado em vez de 500 genérico
app.use((err, req, res, next) => {
  if (err?.type === "entity.parse.failed" || err instanceof SyntaxError) {
    console.error("Erro ao fazer parse do JSON:", err.message);
    return res.status(400).json({
      error: "Payload JSON invalido",
      detail: err.message,
    });
  }
  next(err);
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Serve cliente SPA estatico (prioriza build do Vite em /client/dist)
app.use(express.static(staticDir));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
  const origin =
    staticDir === distDir ? "client/dist (build do Vite)" : "client (fontes)";
  console.log(`Frontend servido a partir de ${origin}`);
});
