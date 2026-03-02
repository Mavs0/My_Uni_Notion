#!/usr/bin/env node
/**
 * Wrapper para next dev que aplica --max-http-header-size em todos os processos.
 * Corrige erro 431 (Request Header Fields Too Large) quando cookies ficam grandes.
 */
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");

// 128KB - garante que cookies grandes (Supabase, sessão) não causem 431
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || "") + " --max-http-header-size=131072";

// Forçar webpack no dev (evitar 404 em chunks). Só usa Turbopack se TURBO=1.
if (process.env.TURBO !== "1") {
  delete process.env.TURBOPACK;
  delete process.env.IS_TURBOPACK_TEST;
}

// Garantir que o Next rode sempre a partir da raiz do projeto (ufam-hub)
const cwd = process.cwd();
const safeCwd = cwd.endsWith("ufam-hub") ? cwd : projectRoot;

// Sem --turbopack = webpack (padrão). Turbopack pode causar 404 em chunks no Next 15.4.
// Use TURBO=1 para forçar Turbopack: TURBO=1 npm run dev
const useTurbo = process.env.TURBO === "1";
const child = spawn(
  process.execPath,
  ["--max-http-header-size=131072", nextBin, "dev", ...(useTurbo ? ["--turbopack"] : []), ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env, cwd: safeCwd }
);

child.on("exit", (code) => process.exit(code || 0));
