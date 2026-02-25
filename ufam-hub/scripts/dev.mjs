#!/usr/bin/env node
/**
 * Wrapper para next dev que aplica --max-http-header-size em todos os processos.
 * Corrige erro 431 (Request Header Fields Too Large) quando cookies ficam grandes.
 */
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nextBin = join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");

// 128KB - garante que cookies grandes (Supabase, sessão) não causem 431
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || "") + " --max-http-header-size=131072";

// --turbo desabilitado: evita ENOENT em app-build-manifest.json (bug Next.js 15 + Turbopack)
// Use TURBO=1 para forçar Turbopack: TURBO=1 npm run dev
const useTurbo = process.env.TURBO === "1";
const child = spawn(
  process.execPath,
  ["--max-http-header-size=131072", nextBin, "dev", ...(useTurbo ? ["--turbo"] : []), ...process.argv.slice(2)],
  { stdio: "inherit", env: process.env }
);

child.on("exit", (code) => process.exit(code || 0));
