import { z } from "zod";

// SQLite stores these as TEXT. The tuples below are what the TS unions, the zod
// validators and the UI option lists are all derived from.

function enumOf<const T extends readonly [string, ...string[]]>(values: T) {
  return { values, schema: z.enum(values) };
}

export const ROLES = enumOf(["BUYER", "SELLER", "MANAGER"] as const);
export type Role = (typeof ROLES.values)[number];

export const USER_STATUSES = enumOf(["ACTIVE", "SUSPENDED", "REMOVED"] as const);
export type UserStatus = (typeof USER_STATUSES.values)[number];

export const ASSET_STATUSES = enumOf([
  "DRAFT",
  "PUBLISHED",
  "SUSPENDED",
  "ARCHIVED",
] as const);
export type AssetStatus = (typeof ASSET_STATUSES.values)[number];

export const BUSINESS_STATUSES = enumOf(["ACTIVE_BUSINESS", "LICENSE_ONLY"] as const);
export type BusinessStatus = (typeof BUSINESS_STATUSES.values)[number];

export const LICENSE_TYPES = enumOf([
  "BANKING",
  "EMI",
  "SEMI",
  "PI",
  "API",
  "MSO",
  "MSB",
  "VASP",
  "BROKER",
  "PSP",
] as const);
export type LicenseType = (typeof LICENSE_TYPES.values)[number];

export const INVESTOR_TYPES = enumOf([
  "STRATEGIC",
  "FINANCIAL",
  "FAMILY_OFFICE",
  "OPERATOR",
] as const);
export type InvestorType = (typeof INVESTOR_TYPES.values)[number];

export const TIMELINES = enumOf([
  "IMMEDIATE",
  "WITHIN_3M",
  "WITHIN_6M",
  "EXPLORING",
] as const);
export type Timeline = (typeof TIMELINES.values)[number];

export const CONTACT_STATUSES = enumOf([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CLOSED",
] as const);
export type ContactStatus = (typeof CONTACT_STATUSES.values)[number];

export const MODERATION_ACTIONS = enumOf([
  "SUSPEND_USER",
  "REINSTATE_USER",
  "REMOVE_USER",
  "SUSPEND_ASSET",
  "REINSTATE_ASSET",
] as const);
export type ModerationActionKind = (typeof MODERATION_ACTIONS.values)[number];

export const LABELS = {
  role: {
    BUYER: "Buyer",
    SELLER: "Seller",
    MANAGER: "Platform Manager",
  },
  userStatus: {
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
    REMOVED: "Removed",
  },
  assetStatus: {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    SUSPENDED: "Suspended",
    ARCHIVED: "Archived",
  },
  businessStatus: {
    ACTIVE_BUSINESS: "Active business",
    LICENSE_ONLY: "Licence only",
  },
  licenseType: {
    BANKING: "Banking",
    EMI: "EMI",
    SEMI: "SEMI",
    PI: "Payment Institution",
    API: "Authorised PI",
    MSO: "MSO",
    MSB: "MSB",
    VASP: "VASP / Crypto",
    BROKER: "Broker",
    PSP: "PSP",
  },
  investorType: {
    STRATEGIC: "Strategic acquirer",
    FINANCIAL: "Financial investor",
    FAMILY_OFFICE: "Family office",
    OPERATOR: "Operator / entrepreneur",
  },
  timeline: {
    IMMEDIATE: "Ready now",
    WITHIN_3M: "Within 3 months",
    WITHIN_6M: "Within 6 months",
    EXPLORING: "Exploring the market",
  },
  contactStatus: {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    CLOSED: "Closed by moderation",
  },
  moderationAction: {
    SUSPEND_USER: "Suspended participant",
    REINSTATE_USER: "Reinstated participant",
    REMOVE_USER: "Removed participant",
    SUSPEND_ASSET: "Suspended asset",
    REINSTATE_ASSET: "Reinstated asset",
  },
} as const;

export function optionsFor<K extends keyof typeof LABELS>(group: K) {
  return Object.entries(LABELS[group]).map(([value, label]) => ({ value, label }));
}
