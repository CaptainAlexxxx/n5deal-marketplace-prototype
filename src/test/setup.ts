import { copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inject, vi } from "vitest";

// Runs before any test file imports @/lib/db, so the client binds to this copy.
const file = join(mkdtempSync(join(tmpdir(), "n5deal-db-")), "test.db");
copyFileSync(inject("templateDb"), file);
process.env.DATABASE_URL = `file:${file.replaceAll("\\", "/")}`;

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
