import type { Prisma } from "@prisma/client";

export const contactPartySelect = {
  select: {
    id: true,
    email: true,
    buyerProfile: { select: { displayName: true, contactName: true, phone: true } },
    sellerProfile: {
      select: { companyName: true, contactName: true, phone: true, website: true },
    },
  },
} satisfies Prisma.ContactRequestInclude["initiator"];

export type ContactParty = Prisma.UserGetPayload<typeof contactPartySelect>;

export function displayNameOf(party: ContactParty) {
  return (
    party.sellerProfile?.companyName ?? party.buyerProfile?.displayName ?? party.email
  );
}

/** Flattens the two profile shapes into the one card the UI renders. */
export function contactDetailsOf(party: ContactParty) {
  const profile = party.sellerProfile ?? party.buyerProfile;
  return {
    name: profile?.contactName ?? party.email,
    email: party.email,
    phone: profile?.phone ?? null,
    website: party.sellerProfile?.website ?? null,
  };
}
