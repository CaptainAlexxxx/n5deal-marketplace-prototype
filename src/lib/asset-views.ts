import { prisma } from "@/lib/db";

/** Counts one view per user per asset; repeat visits do nothing. */
export async function recordAssetView(assetId: string, userId: string) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.assetView.create({ data: { assetId, userId } });
      await tx.asset.update({ where: { id: assetId }, data: { views: { increment: 1 } } });
    });
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return false;
    throw error;
  }
}
