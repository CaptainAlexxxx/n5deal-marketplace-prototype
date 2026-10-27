import type { AssetStatus } from "./enums";

/**
 * Status and publishedAt after a seller moves a listing to `next`. Coming back
 * from the archive counts as a fresh listing, otherwise it reappears buried at
 * the bottom of "Newest listings". Shared by the edit form and the status buttons.
 */
export function applyTransition(
  current: { status: string; publishedAt: Date | null },
  next: AssetStatus,
  now = new Date(),
) {
  if (next !== "PUBLISHED") return { status: next, publishedAt: current.publishedAt };
  const fresh = current.status === "ARCHIVED" || !current.publishedAt;
  return { status: next, publishedAt: fresh ? now : current.publishedAt };
}
