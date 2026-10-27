import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    templateDb: string;
  }
}

/** Builds one migrated SQLite file; every test file copies it, so each gets a fresh database. */
export default function setup(project: TestProject) {
  const dir = mkdtempSync(join(tmpdir(), "n5deal-test-"));
  const template = join(dir, "template.db");

  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      env: { ...process.env, DATABASE_URL: `file:${template.replaceAll("\\", "/")}` },
      stdio: "pipe",
    },
  );

  project.provide("templateDb", template);
  return () => rmSync(dir, { recursive: true, force: true });
}
