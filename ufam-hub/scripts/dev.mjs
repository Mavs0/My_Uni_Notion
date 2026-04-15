#!/usr/bin/env node
/**
 * Wrapper para next dev que aplica --max-http-header-size em todos os processos.
 * Corrige erro 431 (Request Header Fields Too Large) quando cookies ficam grandes.
 *
 * Por defeito apaga `.next` antes de arrancar — evita 404 em /_next/static/*,
 * Cannot find module './NNNN.js' e __webpack_modules__ após HMR/reload partido.
 * `UFAM_DEV_SKIP_NEXT_CLEAN=1` para não apagar (arranque mais rápido, mais frágil).
 * Por defeito o `next dev` **não herda** `NODE_OPTIONS` do Cursor (evita Console Ninja).
 * `UFAM_PRESERVE_NODE_OPTIONS=1` para voltar a juntar as flags do terminal ao --max-http-header-size.
 */
import { spawn } from "child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");

if (process.env.npm_lifecycle_event === "devnpm") {
  console.log(
    "\x1b[33m[dev]\x1b[0m \x1b[1mdevnpm\x1b[0m é alias de \x1b[1mdev\x1b[0m — usa \x1b[1mnpm run dev\x1b[0m para evitar confusão.\n",
  );
}

/**
 * O Cursor/VS Code injeta `-r …/wallabyjs.console-ninja/.../buildHook/index.js` em NODE_OPTIONS.
 * Esse preload tenta ler `vendor-chunks/@supabase.js` e rebenta com ENOENT após limpar `.next`,
 * gerando 500 em páginas e 404/500 em `/_next/static/*`. O processo `next dev` deve arrancar sem isso.
 */
function stripConsoleNinjaFromNodeOptions(input) {
  let s = (input || "").trim();
  if (!s) return "";
  s = s.replace(
    /\s*(?:-r|--require|--import)\s+["']?[^\s"']*wallabyjs[^\s"']*["']?/gi,
    "",
  );
  s = s.replace(
    /\s*(?:-r|--require|--import)\s+["']?[^\s"']*console-ninja[^\s"']*["']?/gi,
    "",
  );
  s = s.replace(/\s*[^\s]*wallabyjs[^\s]*/gi, "");
  s = s.replace(/\s*[^\s]*console-ninja[^\s]*/gi, "");
  return s.replace(/\s+/g, " ").trim();
}

/** Remove -r/--require/--import + argumento se o caminho for buildHook / .cursor / ninja */
function stripNodeOptionsByTokens(input) {
  const raw = (input || "").trim();
  if (!raw) return "";
  const parts = raw.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const t = parts[i].replace(/^"|"$/g, "");
    const lower = t.toLowerCase();
    const isLoaderFlag = t === "-r" || t === "--require" || t === "--import";
    if (isLoaderFlag && i + 1 < parts.length) {
      const next = parts[i + 1].replace(/^"|"$/g, "");
      const n = next.toLowerCase();
      if (
        n.includes("wallabyjs") ||
        n.includes("console-ninja") ||
        n.includes("buildhook") ||
        n.includes(".cursor/extensions")
      ) {
        i++;
        continue;
      }
    }
    if (
      lower.includes("wallabyjs") ||
      lower.includes("console-ninja") ||
      lower.includes("buildhook")
    ) {
      continue;
    }
    out.push(parts[i]);
  }
  return out.join(" ").trim();
}

const nodeOptsBefore = (process.env.NODE_OPTIONS || "").trim();
const preserveParent =
  process.env.UFAM_PRESERVE_NODE_OPTIONS === "1" ||
  process.env.UFAM_PRESERVE_NODE_OPTIONS === "true";

// Por defeito: NÃO herdar NODE_OPTIONS do Cursor (preload Ninja escapa a regexs simples).
// Só `--max-http-header-size` — alinhado ao `npm start` (cookies sb-* grandes).
const headerOnly = "--max-http-header-size=524288";
let nodeOptionsForNext;
let hadNinjaHook = false;

if (preserveParent) {
  const stripped =
    stripNodeOptionsByTokens(stripConsoleNinjaFromNodeOptions(nodeOptsBefore)) ||
    stripConsoleNinjaFromNodeOptions(nodeOptsBefore);
  hadNinjaHook = stripped !== nodeOptsBefore;
  nodeOptionsForNext = (stripped ? stripped + " " : "") + headerOnly;
} else {
  hadNinjaHook =
    /wallabyjs|console-ninja|buildhook|\.cursor\/extensions/i.test(nodeOptsBefore);
  nodeOptionsForNext = headerOnly;
}

// Forçar webpack no dev (evitar 404 em chunks). Só usa Turbopack se TURBO=1.
if (process.env.TURBO !== "1") {
  delete process.env.TURBOPACK;
  delete process.env.IS_TURBOPACK_TEST;
}

// Garantir que o Next rode sempre a partir da raiz do projeto (ufam-hub)
const cwd = process.cwd();
const safeCwd = cwd.endsWith("ufam-hub") ? cwd : projectRoot;

const nextDir = join(projectRoot, ".next");
if (process.env.UFAM_DEV_SKIP_NEXT_CLEAN !== "1" && existsSync(nextDir)) {
  console.log(
    "\x1b[90m[dev]\x1b[0m A limpar .next antes do arranque (evita chunks 404 / webpack partido). " +
      "Saltar: \x1b[1mUFAM_DEV_SKIP_NEXT_CLEAN=1\x1b[0m ou \x1b[1mnpm run dev:noclean\x1b[0m.\n",
  );
  rmSync(nextDir, { recursive: true, force: true });
}

if (!preserveParent) {
  console.log(
    "\n\x1b[32m[dev]\x1b[0m NODE_OPTIONS do terminal \x1b[1mnão é herdado\x1b[0m pelo processo next dev " +
      "(usa só --max-http-header-size). Assim o preload do Cursor/\x1b[1mConsole Ninja\x1b[0m não entra. " +
      "Herdar opções: \x1b[1mUFAM_PRESERVE_NODE_OPTIONS=1\x1b[0m.\n",
  );
} else if (hadNinjaHook) {
  console.log(
    "\n\x1b[32m[dev]\x1b[0m Tentativa de remover preload \x1b[1mConsole Ninja\x1b[0m de NODE_OPTIONS.\n",
  );
}
console.log(
  "\n\x1b[31mATENÇÃO\x1b[0m: Se ainda vires «Console Ninja … connected to Next.js», \x1b[1mdesativa\x1b[0m a extensão " +
    "neste workspace — o IDE pode injetar para além de NODE_OPTIONS. " +
    "(\x1b[1m.vscode/extensions.json\x1b[0m lista-a como indesejada.)\n",
);
console.log(
  "\n\x1b[33mUFAM Hub (dev)\x1b[0m — Webpack: cache em \x1b[1mmemória\x1b[0m por defeito (next.config). " +
    "Sem cache Webpack: \x1b[1mNEXT_WEBPACK_DEV_CACHE=0 npm run dev\x1b[0m. " +
    "Ambiente mínimo (sem variáveis do IDE): \x1b[1mnpm run dev:plain\x1b[0m. " +
    "Não corras \x1b[1mnpm run build\x1b[0m em paralelo com o dev no mesmo diretório.\n",
);

/**
 * Remove variáveis que a extensão Console Ninja / Wallaby pode injectar; mantém o resto
 * para o Next ler .env.local e ferramentas nativas funcionarem.
 */
function envForNextChild() {
  const env = { ...process.env, NODE_OPTIONS: nodeOptionsForNext };
  for (const key of Object.keys(env)) {
    const k = key.toUpperCase();
    if (
      k.includes("WALLABY") ||
      k.includes("CONSOLE_NINJA") ||
      k.includes("NINJA_ENTRY") ||
      k === "NINJA_ENV" ||
      k === "NINJA_LOG_LEVEL"
    ) {
      delete env[key];
    }
  }
  if (process.env.UFAM_MINIMAL_ENV === "1" || process.env.UFAM_MINIMAL_ENV === "true") {
    const keep = [
      "PATH",
      "HOME",
      "USER",
      "LOGNAME",
      "LANG",
      "LC_ALL",
      "LC_CTYPE",
      "SHELL",
      "TERM",
      "TMPDIR",
      "PWD",
      "TZ",
      "NODE_ENV",
      "npm_config_user_agent",
      "npm_node_execpath",
      "npm_execpath",
      "SystemRoot",
      "USERPROFILE",
      "APPDATA",
      "LOCALAPPDATA",
      "PATHEXT",
      "ProgramFiles",
      "ProgramFiles(x86)",
    ];
    const next = { NODE_OPTIONS: nodeOptionsForNext };
    for (const name of keep) {
      if (env[name] != null) next[name] = env[name];
    }
    next.PWD = safeCwd;
    return next;
  }
  return env;
}

// Sem --turbopack = webpack (padrão). Turbopack pode causar 404 em chunks no Next 15.4.
// Use TURBO=1 para forçar Turbopack: TURBO=1 npm run dev
const useTurbo = process.env.TURBO === "1";
const childEnv = envForNextChild();
const child = spawn(
  process.execPath,
  ["--max-http-header-size=524288", nextBin, "dev", ...(useTurbo ? ["--turbopack"] : []), ...process.argv.slice(2)],
  { stdio: "inherit", env: childEnv, cwd: safeCwd }
);

child.on("exit", (code) => process.exit(code || 0));
