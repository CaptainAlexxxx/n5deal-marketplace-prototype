import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

if (!existsSync(".env")) copyFileSync(".env.example", ".env");

const env = readFileSync(".env", "utf8");
const line = /^AUTH_SECRET=["']?([^"'\r\n]*)["']?\s*$/m;
const current = env.match(line)?.[1] ?? "";

if (!current.trim()) {
  const secret = randomBytes(32).toString("base64");
  const next = line.test(env)
    ? env.replace(line, `AUTH_SECRET="${secret}"`)
    : `${env.trimEnd()}\nAUTH_SECRET="${secret}"\n`;
  writeFileSync(".env", next);
  console.log("Generated AUTH_SECRET in .env");
}
