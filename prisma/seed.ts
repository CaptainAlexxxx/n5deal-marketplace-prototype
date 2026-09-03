import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

// Fixed clock, so a reseed produces the same listing order every time.
const NOW = new Date("2026-08-20T09:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const CATEGORIES = [
  { slug: "bank", name: "Bank", sortOrder: 1 },
  { slug: "emi", name: "EMI", sortOrder: 2 },
  { slug: "payment", name: "Payment", sortOrder: 3 },
  { slug: "fintech", name: "Fintech", sortOrder: 4 },
  { slug: "crypto", name: "Crypto", sortOrder: 5 },
];

const COUNTRIES = [
  { slug: "united-kingdom", name: "United Kingdom", code: "GB", regulator: "FCA" },
  { slug: "lithuania", name: "Lithuania", code: "LT", regulator: "Bank of Lithuania" },
  { slug: "malta", name: "Malta", code: "MT", regulator: "MFSA" },
  { slug: "cyprus", name: "Cyprus", code: "CY", regulator: "CySEC" },
  { slug: "germany", name: "Germany", code: "DE", regulator: "BaFin" },
  { slug: "netherlands", name: "Netherlands", code: "NL", regulator: "DNB" },
  { slug: "estonia", name: "Estonia", code: "EE", regulator: "Estonian FIU" },
  { slug: "poland", name: "Poland", code: "PL", regulator: "KNF" },
  { slug: "czechia", name: "Czechia", code: "CZ", regulator: "CNB" },
  { slug: "switzerland", name: "Switzerland", code: "CH", regulator: "FINMA" },
  { slug: "united-states", name: "United States", code: "US", regulator: "FinCEN" },
  { slug: "canada", name: "Canada", code: "CA", regulator: "FINTRAC" },
  { slug: "australia", name: "Australia", code: "AU", regulator: "AUSTRAC" },
  { slug: "singapore", name: "Singapore", code: "SG", regulator: "MAS" },
  { slug: "hong-kong", name: "Hong Kong", code: "HK", regulator: "SFC" },
  { slug: "uae", name: "United Arab Emirates", code: "AE", regulator: "CBUAE" },
  { slug: "georgia", name: "Georgia", code: "GE", regulator: "National Bank of Georgia" },
  { slug: "kazakhstan", name: "Kazakhstan", code: "KZ", regulator: "AFSA" },
  { slug: "mauritius", name: "Mauritius", code: "MU", regulator: "FSC" },
  { slug: "panama", name: "Panama", code: "PA", regulator: "SBP" },
];

const BENEFITS = [
  { slug: "staff", name: "Trained staff" },
  { slug: "security", name: "Security & compliance" },
  { slug: "multi-currency", name: "Multi-currency" },
  { slug: "software", name: "Core software" },
  { slug: "clients", name: "Active client base" },
  { slug: "bank-accounts", name: "Bank accounts" },
  { slug: "office", name: "Office & premises" },
  { slug: "iban", name: "IBAN issuing" },
  { slug: "correspondent", name: "Correspondent accounts" },
  { slug: "api", name: "Public API" },
];

type SellerSeed = {
  email: string;
  company: string;
  about: string;
  website: string;
  contactName: string;
  phone: string;
  status?: "ACTIVE" | "SUSPENDED";
  suspendReason?: string;
};

const SELLERS: SellerSeed[] = [
  {
    email: "seller@n5deal.demo",
    company: "Harbour Point Advisory",
    about:
      "Boutique advisory placing regulated payment and e-money entities across the EEA. Every mandate is seller-side with signed exclusivity.",
    website: "https://harbourpoint.example",
    contactName: "Elena Marchetti",
    phone: "+356 2100 4471",
  },
  {
    email: "seller.northgate@n5deal.demo",
    company: "Northgate Licensing Group",
    about:
      "We hold and season licences in the Baltics and Central Europe, then hand them over fully staffed and audited.",
    website: "https://northgate-lg.example",
    contactName: "Tomas Vaitkus",
    phone: "+370 640 21188",
  },
  {
    email: "seller.meridian@n5deal.demo",
    company: "Meridian Capital Exits",
    about:
      "Exit specialists for founder-owned fintechs in the 2M to 25M EUR range. Data rooms prepared before listing.",
    website: "https://meridian-exits.example",
    contactName: "Priya Raghunathan",
    phone: "+44 20 7946 0812",
  },
  {
    email: "seller.atlas@n5deal.demo",
    company: "Atlas Charter Partners",
    about:
      "North American and offshore banking charters. We only list entities with clean regulatory histories.",
    website: "https://atlascharter.example",
    contactName: "Daniel Okafor",
    phone: "+1 646 555 0173",
  },
  {
    email: "seller.kestrel@n5deal.demo",
    company: "Kestrel Digital Assets",
    about:
      "VASP and crypto-adjacent entities with live processing volumes and banking rails already in place.",
    website: "https://kestrel-da.example",
    contactName: "Marta Nowak",
    phone: "+48 22 307 4490",
  },
  {
    email: "seller.blocked@n5deal.demo",
    company: "Vantage Shelf Holdings",
    about: "Bulk shelf company vendor.",
    website: "https://vantage-shelf.example",
    contactName: "Roman Petrov",
    phone: "+357 25 884 019",
    status: "SUSPENDED",
    suspendReason:
      "Listed the same licence under three references and refused to provide regulator correspondence.",
  },
];

type BuyerSeed = {
  email: string;
  displayName: string;
  headline: string;
  thesis: string;
  investorType: string;
  timeline: string;
  min: number;
  max: number;
  preferred: string | null;
  categories: string[];
  countries: string[];
  contactName: string;
  phone: string;
  published?: boolean;
  status?: "ACTIVE" | "SUSPENDED";
  suspendReason?: string;
};

const BUYERS: BuyerSeed[] = [
  {
    email: "buyer@n5deal.demo",
    displayName: "Lindwall Ventures",
    headline: "EEA e-money licences with live IBAN issuing",
    thesis:
      "We operate a payroll platform in the Nordics and need our own EMI rather than a sponsor bank. Priority is an entity that already issues IBANs and has a working compliance team we can retain.",
    investorType: "STRATEGIC",
    timeline: "IMMEDIATE",
    min: 800_000,
    max: 4_000_000,
    preferred: "ACTIVE_BUSINESS",
    categories: ["emi", "payment"],
    countries: ["lithuania", "malta", "estonia", "netherlands"],
    contactName: "Anders Lindwall",
    phone: "+46 8 559 21 40",
  },
  {
    email: "buyer.sunhill@n5deal.demo",
    displayName: "Sunhill Family Office",
    headline: "Long-hold positions in regulated payment infrastructure",
    thesis:
      "Patient capital, no leverage, no flipping. We buy cash-generative payment businesses and keep management in place. EBITDA above 400k is the entry bar.",
    investorType: "FAMILY_OFFICE",
    timeline: "WITHIN_3M",
    min: 2_000_000,
    max: 12_000_000,
    preferred: "ACTIVE_BUSINESS",
    categories: ["payment", "fintech"],
    countries: ["united-kingdom", "germany", "switzerland"],
    contactName: "Beatrix Sunhill",
    phone: "+41 44 585 12 09",
  },
  {
    email: "buyer.orinoco@n5deal.demo",
    displayName: "Orinoco Digital",
    headline: "VASP licences in permissive but reputable jurisdictions",
    thesis:
      "Exchange operator expanding out of a single jurisdiction. We want a VASP registration with banking already attached; a bare licence with no rails is worth very little to us.",
    investorType: "OPERATOR",
    timeline: "IMMEDIATE",
    min: 300_000,
    max: 2_500_000,
    preferred: null,
    categories: ["crypto"],
    countries: ["poland", "czechia", "lithuania", "uae"],
    contactName: "Rafael Duarte",
    phone: "+971 4 355 8820",
  },
  {
    email: "buyer.kingsway@n5deal.demo",
    displayName: "Kingsway Growth Partners",
    headline: "Buy-and-build across UK and Irish payment services",
    thesis:
      "Third add-on for an existing platform. We look for API or PI permissions with a merchant book we can migrate onto our own processing stack within two quarters.",
    investorType: "FINANCIAL",
    timeline: "WITHIN_3M",
    min: 1_500_000,
    max: 8_000_000,
    preferred: "ACTIVE_BUSINESS",
    categories: ["payment", "emi"],
    countries: ["united-kingdom", "malta", "cyprus"],
    contactName: "Owen Blackwood",
    phone: "+44 20 3608 7712",
  },
  {
    email: "buyer.tamar@n5deal.demo",
    displayName: "Tamar Holdings",
    headline: "Clean shelf licences, no operating history required",
    thesis:
      "We build our own stack and hire our own team. What we need is a licence with no legacy clients, no historic SARs and a regulator that will approve a change of control quickly.",
    investorType: "STRATEGIC",
    timeline: "WITHIN_6M",
    min: 150_000,
    max: 1_200_000,
    preferred: "LICENSE_ONLY",
    categories: ["emi", "payment", "crypto"],
    countries: ["georgia", "kazakhstan", "mauritius", "panama"],
    contactName: "Sasha Berman",
    phone: "+995 32 240 1177",
  },
  {
    email: "buyer.pinewood@n5deal.demo",
    displayName: "Pinewood Bancorp",
    headline: "US and Canadian MSB platforms with remittance corridors",
    thesis:
      "Remittance operator consolidating corridors into Latin America. Volume matters more than headline profit; we will fix margins after integration.",
    investorType: "STRATEGIC",
    timeline: "WITHIN_3M",
    min: 1_000_000,
    max: 6_000_000,
    preferred: "ACTIVE_BUSINESS",
    categories: ["payment", "fintech"],
    countries: ["united-states", "canada", "panama"],
    contactName: "Gloria Mendez",
    phone: "+1 305 555 0148",
  },
  {
    email: "buyer.halberd@n5deal.demo",
    displayName: "Halberd Credit",
    headline: "Small banking charters in stable jurisdictions",
    thesis:
      "Private credit shop that wants a deposit-taking entity to fund its own book. Anything below a full banking licence is out of scope.",
    investorType: "FINANCIAL",
    timeline: "EXPLORING",
    min: 8_000_000,
    max: 40_000_000,
    preferred: "ACTIVE_BUSINESS",
    categories: ["bank"],
    countries: ["switzerland", "germany", "singapore", "mauritius"],
    contactName: "Konrad Lehner",
    phone: "+49 69 2222 8830",
  },
  {
    email: "buyer.solstice@n5deal.demo",
    displayName: "Solstice Fintech Studio",
    headline: "Early-stage fintech assets with working software",
    thesis:
      "We rebuild and relaunch underperforming fintech products. The software and the team matter; licences are a bonus rather than the point.",
    investorType: "OPERATOR",
    timeline: "IMMEDIATE",
    min: 100_000,
    max: 1_500_000,
    preferred: null,
    categories: ["fintech"],
    countries: ["estonia", "poland", "czechia", "united-kingdom"],
    contactName: "Yara Haddad",
    phone: "+372 601 4429",
  },
  {
    email: "buyer.avelon@n5deal.demo",
    displayName: "Avelon Asia",
    headline: "APAC payment and e-money entities",
    thesis:
      "Singapore-based group extending into Hong Kong and Australia. We need local regulatory standing to serve enterprise clients that will not accept an offshore counterparty.",
    investorType: "STRATEGIC",
    timeline: "WITHIN_6M",
    min: 2_500_000,
    max: 15_000_000,
    preferred: "ACTIVE_BUSINESS",
    categories: ["payment", "emi", "fintech"],
    countries: ["singapore", "hong-kong", "australia"],
    contactName: "Wei Ling Tan",
    phone: "+65 6812 4470",
  },
  {
    email: "buyer.rothmere@n5deal.demo",
    displayName: "Rothmere Industrial",
    headline: "First move into financial services",
    thesis:
      "Manufacturing group with surplus cash looking for an uncorrelated asset. We are early in our education and expect to lean on the seller for post-close support.",
    investorType: "FINANCIAL",
    timeline: "EXPLORING",
    min: 500_000,
    max: 5_000_000,
    preferred: null,
    categories: ["payment", "bank", "fintech"],
    countries: ["germany", "netherlands", "poland"],
    contactName: "Ingrid Rothmere",
    phone: "+31 20 794 3350",
  },
  {
    email: "buyer.draft@n5deal.demo",
    displayName: "Cobalt Reach Capital",
    headline: "Profile still being prepared",
    thesis:
      "Mandate still being agreed with our investment committee. We expect to focus on UK payment services once the sizing is signed off.",
    investorType: "FINANCIAL",
    timeline: "EXPLORING",
    min: 400_000,
    max: 3_000_000,
    preferred: null,
    categories: ["fintech"],
    countries: ["united-kingdom"],
    contactName: "Miriam Farrow",
    phone: "+44 20 3608 1140",
    published: false,
  },
  {
    email: "buyer.blocked@n5deal.demo",
    displayName: "Zenith Acquisitions LLC",
    headline: "Aggressive acquirer, any jurisdiction",
    thesis: "Cash ready, will close in days, no questions asked, discretion guaranteed.",
    investorType: "FINANCIAL",
    timeline: "IMMEDIATE",
    min: 50_000,
    max: 50_000_000,
    preferred: null,
    categories: ["bank", "emi", "payment", "fintech", "crypto"],
    countries: ["panama", "mauritius", "kazakhstan"],
    contactName: "Victor Sallens",
    phone: "+507 838 7712",
    status: "SUSPENDED",
    suspendReason:
      "Mass-contacted 40 sellers in one day with an identical message and would not confirm source of funds.",
  },
];

type AssetStatusSeed = "DRAFT" | "PUBLISHED" | "ARCHIVED";

type AssetSeed = {
  seller: string;
  title: string;
  summary: string;
  category: string;
  country: string;
  license: string;
  businessStatus: string;
  price: number;
  revenue: number | null;
  ebitda: number | null;
  employees: number;
  year: number;
  views: number;
  benefits: string[];
  status?: AssetStatusSeed;
  listedDaysAgo?: number;
};

const ASSETS: AssetSeed[] = [
  { seller: "seller@n5deal.demo", title: "Maltese EMI with live IBAN issuing", summary: "Full MFSA e-money institution, 3,100 active accounts, SEPA and SWIFT rails already in production.", category: "emi", country: "malta", license: "EMI", businessStatus: "ACTIVE_BUSINESS", price: 3_400_000, revenue: 2_150_000, ebitda: 640_000, employees: 24, year: 2019, views: 412, benefits: ["staff", "iban", "multi-currency", "clients", "correspondent"], listedDaysAgo: 6 },
  { seller: "seller@n5deal.demo", title: "Lithuanian EMI, seasoned and unused", summary: "Licence granted in 2021, kept in good standing with the regulator, no clients onboarded.", category: "emi", country: "lithuania", license: "EMI", businessStatus: "LICENSE_ONLY", price: 890_000, revenue: null, ebitda: null, employees: 4, year: 2021, views: 268, benefits: ["security", "software"], listedDaysAgo: 11 },
  { seller: "seller@n5deal.demo", title: "Dutch payment institution serving marketplaces", summary: "DNB-authorised PI with 60 marketplace merchants and an in-house reconciliation engine.", category: "payment", country: "netherlands", license: "PI", businessStatus: "ACTIVE_BUSINESS", price: 5_200_000, revenue: 3_800_000, ebitda: 1_120_000, employees: 31, year: 2017, views: 537, benefits: ["staff", "clients", "software", "api", "bank-accounts"], listedDaysAgo: 3 },
  { seller: "seller@n5deal.demo", title: "Cypriot EMI with card issuing programme", summary: "CySEC-supervised EMI running a principal card issuing programme on two BINs.", category: "emi", country: "cyprus", license: "EMI", businessStatus: "ACTIVE_BUSINESS", price: 2_750_000, revenue: 1_640_000, ebitda: 380_000, employees: 18, year: 2018, views: 349, benefits: ["staff", "multi-currency", "clients", "software"], listedDaysAgo: 19 },
  { seller: "seller@n5deal.demo", title: "Estonian payment institution, remittance focus", summary: "Corridors into Ukraine and Moldova, fully automated KYC, two banking partners.", category: "payment", country: "estonia", license: "PI", businessStatus: "ACTIVE_BUSINESS", price: 1_450_000, revenue: 980_000, ebitda: 265_000, employees: 12, year: 2020, views: 191, benefits: ["clients", "software", "bank-accounts"], listedDaysAgo: 27 },
  { seller: "seller@n5deal.demo", title: "German BaFin PI, draft listing", summary: "Preparing documentation before going public. Not visible to buyers yet.", category: "payment", country: "germany", license: "PI", businessStatus: "ACTIVE_BUSINESS", price: 6_100_000, revenue: 4_200_000, ebitda: 890_000, employees: 40, year: 2016, views: 0, benefits: ["staff", "clients", "office"], status: "DRAFT" },

  { seller: "seller.northgate@n5deal.demo", title: "Lithuanian PI, clean shelf entity", summary: "Never traded, share capital paid, regulator confirmed readiness for change of control.", category: "payment", country: "lithuania", license: "PI", businessStatus: "LICENSE_ONLY", price: 420_000, revenue: null, ebitda: null, employees: 2, year: 2022, views: 604, benefits: ["security"], listedDaysAgo: 2 },
  { seller: "seller.northgate@n5deal.demo", title: "Czech small-scale payment provider", summary: "CNB registration with a modest but stable merchant book in e-commerce.", category: "payment", country: "czechia", license: "PSP", businessStatus: "ACTIVE_BUSINESS", price: 680_000, revenue: 510_000, ebitda: 145_000, employees: 8, year: 2019, views: 233, benefits: ["clients", "software"], listedDaysAgo: 14 },
  { seller: "seller.northgate@n5deal.demo", title: "Polish crypto VASP with banking", summary: "KNF register entry plus two EU bank accounts that survive crypto-related screening.", category: "crypto", country: "poland", license: "VASP", businessStatus: "ACTIVE_BUSINESS", price: 760_000, revenue: 430_000, ebitda: 118_000, employees: 6, year: 2021, views: 728, benefits: ["bank-accounts", "clients", "api"], listedDaysAgo: 1 },
  { seller: "seller.northgate@n5deal.demo", title: "Estonian VASP, licence only", summary: "Registration maintained through the 2023 rule tightening, no operating history.", category: "crypto", country: "estonia", license: "VASP", businessStatus: "LICENSE_ONLY", price: 245_000, revenue: null, ebitda: null, employees: 2, year: 2020, views: 512, benefits: ["security"], listedDaysAgo: 22 },
  { seller: "seller.northgate@n5deal.demo", title: "Georgian payment provider with local rails", summary: "NBG-licensed provider connected to the domestic clearing system and three local banks.", category: "payment", country: "georgia", license: "PSP", businessStatus: "ACTIVE_BUSINESS", price: 540_000, revenue: 390_000, ebitda: 96_000, employees: 11, year: 2018, views: 158, benefits: ["staff", "bank-accounts", "office"], listedDaysAgo: 33 },
  { seller: "seller.northgate@n5deal.demo", title: "Kazakh AFSA fintech licence", summary: "AIFC-domiciled entity with a fintech permission and English-law corporate structure.", category: "fintech", country: "kazakhstan", license: "PSP", businessStatus: "LICENSE_ONLY", price: 310_000, revenue: null, ebitda: null, employees: 3, year: 2022, views: 121, benefits: ["security", "office"], listedDaysAgo: 41 },

  { seller: "seller.meridian@n5deal.demo", title: "UK API with SME lending book", summary: "FCA authorised payment institution plus a performing 4.2M EUR SME receivables book.", category: "payment", country: "united-kingdom", license: "API", businessStatus: "ACTIVE_BUSINESS", price: 7_900_000, revenue: 5_100_000, ebitda: 1_480_000, employees: 47, year: 2015, views: 883, benefits: ["staff", "clients", "software", "office", "api"], listedDaysAgo: 4 },
  { seller: "seller.meridian@n5deal.demo", title: "UK small payment institution, founder exit", summary: "Owner retiring. Clean book, 900 merchants, no regulatory findings in eight years.", category: "payment", country: "united-kingdom", license: "PI", businessStatus: "ACTIVE_BUSINESS", price: 2_300_000, revenue: 1_700_000, ebitda: 520_000, employees: 15, year: 2016, views: 476, benefits: ["clients", "staff", "software"], listedDaysAgo: 9 },
  { seller: "seller.meridian@n5deal.demo", title: "London-based treasury management fintech", summary: "SaaS treasury product with 38 corporate subscribers, unregulated but licence-adjacent.", category: "fintech", country: "united-kingdom", license: "PSP", businessStatus: "ACTIVE_BUSINESS", price: 1_850_000, revenue: 1_240_000, ebitda: 310_000, employees: 14, year: 2019, views: 297, benefits: ["software", "clients", "api", "staff"], listedDaysAgo: 16 },
  { seller: "seller.meridian@n5deal.demo", title: "Swiss FINMA fintech licence holder", summary: "Deposit-taking up to CHF 100m under the fintech licence, private banking clientele.", category: "fintech", country: "switzerland", license: "PSP", businessStatus: "ACTIVE_BUSINESS", price: 9_400_000, revenue: 3_900_000, ebitda: 1_050_000, employees: 22, year: 2018, views: 641, benefits: ["staff", "clients", "office", "security"], listedDaysAgo: 7 },
  { seller: "seller.meridian@n5deal.demo", title: "German BaFin EMI with payroll niche", summary: "Serves 120 mid-market employers with dedicated salary accounts and multi-currency payouts.", category: "emi", country: "germany", license: "EMI", businessStatus: "ACTIVE_BUSINESS", price: 6_800_000, revenue: 4_400_000, ebitda: 1_210_000, employees: 38, year: 2017, views: 559, benefits: ["staff", "clients", "multi-currency", "iban", "office"], listedDaysAgo: 12 },
  { seller: "seller.meridian@n5deal.demo", title: "Singapore major payment institution", summary: "MAS MPI licence covering account issuance, cross-border and domestic transfers.", category: "payment", country: "singapore", license: "API", businessStatus: "ACTIVE_BUSINESS", price: 11_200_000, revenue: 6_700_000, ebitda: 1_900_000, employees: 55, year: 2020, views: 714, benefits: ["staff", "clients", "multi-currency", "correspondent", "api"], listedDaysAgo: 5 },
  { seller: "seller.meridian@n5deal.demo", title: "Hong Kong SVF licence with retail wallet", summary: "Stored value facility with a consumer wallet at 240k registered users.", category: "emi", country: "hong-kong", license: "EMI", businessStatus: "ACTIVE_BUSINESS", price: 8_600_000, revenue: 4_950_000, ebitda: 870_000, employees: 44, year: 2019, views: 468, benefits: ["clients", "software", "staff", "multi-currency"], listedDaysAgo: 21 },
  { seller: "seller.meridian@n5deal.demo", title: "Australian AUSTRAC remittance network", summary: "Registered remitter with 60 agent locations across three states.", category: "payment", country: "australia", license: "MSB", businessStatus: "ACTIVE_BUSINESS", price: 3_100_000, revenue: 2_400_000, ebitda: 490_000, employees: 29, year: 2014, views: 226, benefits: ["clients", "staff", "office"], listedDaysAgo: 30 },
  { seller: "seller.meridian@n5deal.demo", title: "Archived: Dutch EMI withdrawn by owner", summary: "Seller withdrew the mandate. Retained for reference only.", category: "emi", country: "netherlands", license: "EMI", businessStatus: "ACTIVE_BUSINESS", price: 4_100_000, revenue: 2_800_000, ebitda: 610_000, employees: 26, year: 2018, views: 88, benefits: ["clients"], status: "ARCHIVED", listedDaysAgo: 60 },

  { seller: "seller.atlas@n5deal.demo", title: "Mauritius investment banking licence", summary: "FSC category 1 licence, deposit taking and corporate lending, audited to IFRS.", category: "bank", country: "mauritius", license: "BANKING", businessStatus: "ACTIVE_BUSINESS", price: 14_500_000, revenue: 7_300_000, ebitda: 2_400_000, employees: 61, year: 2013, views: 392, benefits: ["staff", "correspondent", "office", "security", "clients"], listedDaysAgo: 8 },
  { seller: "seller.atlas@n5deal.demo", title: "Panama international banking licence", summary: "SBP general licence with correspondent relationships in three currencies.", category: "bank", country: "panama", license: "BANKING", businessStatus: "ACTIVE_BUSINESS", price: 18_900_000, revenue: 9_100_000, ebitda: 3_050_000, employees: 78, year: 2011, views: 511, benefits: ["correspondent", "staff", "office", "multi-currency"], listedDaysAgo: 18 },
  { seller: "seller.atlas@n5deal.demo", title: "US state-licensed MSB, 34 states", summary: "Money transmitter licences across 34 states with a compliant surety bond structure.", category: "payment", country: "united-states", license: "MSB", businessStatus: "ACTIVE_BUSINESS", price: 5_600_000, revenue: 3_100_000, ebitda: 720_000, employees: 33, year: 2016, views: 802, benefits: ["clients", "staff", "security", "software"], listedDaysAgo: 10 },
  { seller: "seller.atlas@n5deal.demo", title: "US MSB shell, FinCEN registered only", summary: "FinCEN registration with two state licences, no operating history.", category: "payment", country: "united-states", license: "MSB", businessStatus: "LICENSE_ONLY", price: 480_000, revenue: null, ebitda: null, employees: 1, year: 2023, views: 341, benefits: ["security"], listedDaysAgo: 25 },
  { seller: "seller.atlas@n5deal.demo", title: "Canadian FINTRAC MSB with LatAm corridors", summary: "Established remittance flows into Mexico, Colombia and Peru with local payout partners.", category: "payment", country: "canada", license: "MSB", businessStatus: "ACTIVE_BUSINESS", price: 2_900_000, revenue: 2_050_000, ebitda: 440_000, employees: 21, year: 2017, views: 384, benefits: ["clients", "correspondent", "staff"], listedDaysAgo: 13 },
  { seller: "seller.atlas@n5deal.demo", title: "UAE category 3C financial services firm", summary: "CBUAE-adjacent free zone licence with an operational corporate client desk.", category: "fintech", country: "uae", license: "BROKER", businessStatus: "ACTIVE_BUSINESS", price: 4_700_000, revenue: 2_600_000, ebitda: 690_000, employees: 19, year: 2020, views: 447, benefits: ["office", "staff", "clients"], listedDaysAgo: 15 },
  { seller: "seller.atlas@n5deal.demo", title: "Georgian microbank, controlling stake", summary: "National Bank of Georgia licence, retail deposits and consumer lending in Tbilisi.", category: "bank", country: "georgia", license: "BANKING", businessStatus: "ACTIVE_BUSINESS", price: 12_200_000, revenue: 6_400_000, ebitda: 1_750_000, employees: 94, year: 2012, views: 289, benefits: ["staff", "office", "clients", "bank-accounts"], listedDaysAgo: 29 },

  { seller: "seller.kestrel@n5deal.demo", title: "Czech VASP with live exchange volume", summary: "Running spot exchange, 11k verified users, EUR and CZK settlement.", category: "crypto", country: "czechia", license: "VASP", businessStatus: "ACTIVE_BUSINESS", price: 1_950_000, revenue: 1_380_000, ebitda: 410_000, employees: 13, year: 2021, views: 967, benefits: ["clients", "software", "bank-accounts", "api"], listedDaysAgo: 2 },
  { seller: "seller.kestrel@n5deal.demo", title: "UAE VASP with institutional desk", summary: "OTC desk serving family offices, licensed in a Dubai free zone with local banking.", category: "crypto", country: "uae", license: "VASP", businessStatus: "ACTIVE_BUSINESS", price: 3_800_000, revenue: 2_200_000, ebitda: 780_000, employees: 16, year: 2022, views: 823, benefits: ["clients", "bank-accounts", "staff", "office"], listedDaysAgo: 6 },
  { seller: "seller.kestrel@n5deal.demo", title: "Lithuanian crypto exchange operator", summary: "Registered VASP with a custody stack audited by an external security firm.", category: "crypto", country: "lithuania", license: "VASP", businessStatus: "ACTIVE_BUSINESS", price: 1_120_000, revenue: 740_000, ebitda: 190_000, employees: 9, year: 2020, views: 594, benefits: ["security", "software", "clients"], listedDaysAgo: 17 },
  { seller: "seller.kestrel@n5deal.demo", title: "Panama crypto payment gateway", summary: "Merchant-facing gateway processing stablecoin settlements for LatAm e-commerce.", category: "crypto", country: "panama", license: "PSP", businessStatus: "ACTIVE_BUSINESS", price: 890_000, revenue: 620_000, ebitda: 175_000, employees: 7, year: 2021, views: 356, benefits: ["api", "clients", "software"], listedDaysAgo: 24 },
  { seller: "seller.kestrel@n5deal.demo", title: "Singapore digital asset advisory firm", summary: "MAS-recognised advisory entity with a research desk and 22 institutional clients.", category: "fintech", country: "singapore", license: "BROKER", businessStatus: "ACTIVE_BUSINESS", price: 2_600_000, revenue: 1_500_000, ebitda: 430_000, employees: 12, year: 2019, views: 258, benefits: ["staff", "clients", "office"], listedDaysAgo: 34 },
  { seller: "seller.kestrel@n5deal.demo", title: "Mauritius VASP, licence only", summary: "FSC virtual asset licence held clean since issue, ready for change of control.", category: "crypto", country: "mauritius", license: "VASP", businessStatus: "LICENSE_ONLY", price: 380_000, revenue: null, ebitda: null, employees: 2, year: 2023, views: 402, benefits: ["security"], listedDaysAgo: 20 },
  { seller: "seller.kestrel@n5deal.demo", title: "Hong Kong money service operator", summary: "MSO licence with a currency exchange storefront and remittance to mainland China.", category: "payment", country: "hong-kong", license: "MSO", businessStatus: "ACTIVE_BUSINESS", price: 1_680_000, revenue: 1_150_000, ebitda: 295_000, employees: 17, year: 2018, views: 331, benefits: ["office", "staff", "clients", "multi-currency"], listedDaysAgo: 23 },
  { seller: "seller.kestrel@n5deal.demo", title: "Polish EMI application in final stage", summary: "Application filed, regulator feedback addressed, decision expected within one quarter.", category: "emi", country: "poland", license: "EMI", businessStatus: "LICENSE_ONLY", price: 620_000, revenue: null, ebitda: null, employees: 5, year: 2024, views: 277, benefits: ["security", "software"], listedDaysAgo: 26 },
  { seller: "seller.kestrel@n5deal.demo", title: "Australian AFSL-adjacent fintech", summary: "Lending platform operating under an authorised representative arrangement.", category: "fintech", country: "australia", license: "BROKER", businessStatus: "ACTIVE_BUSINESS", price: 1_340_000, revenue: 910_000, ebitda: 205_000, employees: 10, year: 2020, views: 164, benefits: ["software", "clients"], listedDaysAgo: 37 },
  { seller: "seller.kestrel@n5deal.demo", title: "Cypriot investment firm, small CIF", summary: "CySEC investment firm licence with a retail brokerage book being wound down.", category: "fintech", country: "cyprus", license: "BROKER", businessStatus: "ACTIVE_BUSINESS", price: 2_100_000, revenue: 1_100_000, ebitda: 180_000, employees: 20, year: 2015, views: 213, benefits: ["staff", "office", "software"], listedDaysAgo: 39 },
  { seller: "seller.kestrel@n5deal.demo", title: "Kazakh crypto exchange, AIFC licensed", summary: "Licensed within the AIFC perimeter with tenge and USDT pairs.", category: "crypto", country: "kazakhstan", license: "VASP", businessStatus: "ACTIVE_BUSINESS", price: 950_000, revenue: 580_000, ebitda: 130_000, employees: 8, year: 2022, views: 187, benefits: ["software", "clients", "bank-accounts"], listedDaysAgo: 31 },
  { seller: "seller.kestrel@n5deal.demo", title: "Swiss SRO-affiliated financial intermediary", summary: "Self-regulatory body membership covering asset management and payment intermediation.", category: "fintech", country: "switzerland", license: "BROKER", businessStatus: "LICENSE_ONLY", price: 720_000, revenue: null, ebitda: null, employees: 3, year: 2021, views: 249, benefits: ["security", "office"], listedDaysAgo: 28 },
  { seller: "seller.kestrel@n5deal.demo", title: "Netherlands crypto registration with DNB", summary: "DNB register entry maintained since 2021, small custody book still live.", category: "crypto", country: "netherlands", license: "VASP", businessStatus: "ACTIVE_BUSINESS", price: 1_460_000, revenue: 820_000, ebitda: 210_000, employees: 11, year: 2021, views: 305, benefits: ["clients", "security", "software"], listedDaysAgo: 35 },

  { seller: "seller.blocked@n5deal.demo", title: "Premium EMI opportunity, act fast", summary: "Rare chance to acquire a fully licensed institution at a fraction of market value.", category: "emi", country: "panama", license: "EMI", businessStatus: "LICENSE_ONLY", price: 99_000, revenue: null, ebitda: null, employees: 1, year: 2024, views: 1_204, benefits: ["security"], listedDaysAgo: 44 },
  { seller: "seller.blocked@n5deal.demo", title: "Banking licence available immediately", summary: "Same entity as reference above, listed again under a different description.", category: "bank", country: "panama", license: "BANKING", businessStatus: "LICENSE_ONLY", price: 120_000, revenue: null, ebitda: null, employees: 1, year: 2024, views: 987, benefits: ["security"], listedDaysAgo: 43 },
];

type ContactSeed = {
  from: string;
  to: string;
  assetTitle?: string;
  buyerEmail?: string;
  message: string;
  status: string;
  responseNote?: string;
  daysAgo: number;
};

const CONTACTS: ContactSeed[] = [
  { from: "buyer@n5deal.demo", to: "seller@n5deal.demo", assetTitle: "Maltese EMI with live IBAN issuing", message: "We run payroll for 400 Nordic employers and want to move off our sponsor bank. Can you share the compliance headcount and whether the MLRO would stay post-close?", status: "ACCEPTED", responseNote: "Happy to talk. MLRO has indicated she would stay for at least 12 months.", daysAgo: 5 },
  { from: "buyer@n5deal.demo", to: "seller.northgate@n5deal.demo", assetTitle: "Lithuanian EMI, seasoned and unused", message: "Interested in the seasoned Lithuanian licence as a fallback option. What is the realistic change of control timeline with the regulator?", status: "PENDING", daysAgo: 2 },
  { from: "buyer.sunhill@n5deal.demo", to: "seller@n5deal.demo", assetTitle: "Dutch payment institution serving marketplaces", message: "The marketplace concentration worries us. What share of revenue comes from the top three merchants?", status: "ACCEPTED", responseNote: "Top three are 31% combined. Full breakdown available under NDA.", daysAgo: 8 },
  { from: "buyer.sunhill@n5deal.demo", to: "seller.meridian@n5deal.demo", assetTitle: "UK API with SME lending book", message: "We would look at the payment institution without the lending book. Is a carve-out on the table?", status: "DECLINED", responseNote: "Seller wants a clean whole-entity exit, no carve-outs.", daysAgo: 12 },
  { from: "buyer.orinoco@n5deal.demo", to: "seller.kestrel@n5deal.demo", assetTitle: "Czech VASP with live exchange volume", message: "Which banks hold the settlement accounts and have they been told a sale is planned?", status: "ACCEPTED", responseNote: "Two banks, both notified. Introduction call can be arranged this week.", daysAgo: 3 },
  { from: "buyer.orinoco@n5deal.demo", to: "seller.northgate@n5deal.demo", assetTitle: "Polish crypto VASP with banking", message: "Banking is the whole point for us. Can you confirm the accounts survive a change of beneficial owner?", status: "PENDING", daysAgo: 1 },
  { from: "buyer.kingsway@n5deal.demo", to: "seller.meridian@n5deal.demo", assetTitle: "UK small payment institution, founder exit", message: "Third add-on for our platform. We can close in eight weeks with cash. Would the founder consider a short handover?", status: "ACCEPTED", responseNote: "Founder is open to a three month handover. Let us set up a call.", daysAgo: 7 },
  { from: "buyer.tamar@n5deal.demo", to: "seller.northgate@n5deal.demo", assetTitle: "Lithuanian PI, clean shelf entity", message: "Exactly what we are after. Confirming there are no historic suspicious activity reports on the entity?", status: "PENDING", daysAgo: 4 },
  { from: "buyer.pinewood@n5deal.demo", to: "seller.atlas@n5deal.demo", assetTitle: "Canadian FINTRAC MSB with LatAm corridors", message: "Our corridors overlap on Mexico. What is the monthly volume through the Colombia payout partner?", status: "ACCEPTED", responseNote: "Around 2.4M EUR monthly. Happy to share twelve months of data.", daysAgo: 9 },
  { from: "buyer.halberd@n5deal.demo", to: "seller.atlas@n5deal.demo", assetTitle: "Mauritius investment banking licence", message: "We would need the deposit book to be transferable. Has the FSC given any indication on approving a private credit owner?", status: "PENDING", daysAgo: 6 },
  { from: "buyer.avelon@n5deal.demo", to: "seller.meridian@n5deal.demo", assetTitle: "Singapore major payment institution", message: "Strategic fit is strong. Can you confirm the MPI licence covers e-money issuance as well as cross-border transfers?", status: "ACCEPTED", responseNote: "Yes, both permissions are on the licence. Sending the scope document.", daysAgo: 10 },
  { from: "buyer.solstice@n5deal.demo", to: "seller.meridian@n5deal.demo", assetTitle: "London-based treasury management fintech", message: "We care about the codebase more than the revenue. Is the engineering team staying?", status: "DECLINED", responseNote: "Team is not part of the deal, they are moving to the parent group.", daysAgo: 15 },
  { from: "seller@n5deal.demo", to: "buyer.sunhill@n5deal.demo", buyerEmail: "buyer.sunhill@n5deal.demo", message: "Your mandate matches a Dutch PI we have just listed. EBITDA is 1.12M and management would stay. Worth a conversation?", status: "ACCEPTED", responseNote: "Yes, please send the teaser.", daysAgo: 4 },
  { from: "seller.meridian@n5deal.demo", to: "buyer.halberd@n5deal.demo", buyerEmail: "buyer.halberd@n5deal.demo", message: "We are preparing a Swiss deposit-taking entity that fits your ticket range. Would you like early access before it goes public?", status: "PENDING", daysAgo: 2 },
  { from: "seller.atlas@n5deal.demo", to: "buyer.pinewood@n5deal.demo", buyerEmail: "buyer.pinewood@n5deal.demo", message: "Our 34-state MSB has the LatAm corridors you mentioned in your thesis. Deck is ready if you want it.", status: "PENDING", daysAgo: 1 },
  { from: "seller.kestrel@n5deal.demo", to: "buyer.orinoco@n5deal.demo", buyerEmail: "buyer.orinoco@n5deal.demo", message: "The UAE OTC desk may suit you better than the Czech exchange. Banking is with a local bank that is comfortable with digital assets.", status: "DECLINED", responseNote: "UAE is outside our near-term plan, thank you.", daysAgo: 11 },
  { from: "buyer.blocked@n5deal.demo", to: "seller.meridian@n5deal.demo", assetTitle: "Swiss FINMA fintech licence holder", message: "Cash ready. Send all documents immediately.", status: "CLOSED", daysAgo: 13 },
];

function describe(a: AssetSeed, countryName: string, regulator: string, categoryName: string) {
  const trading =
    a.businessStatus === "ACTIVE_BUSINESS"
      ? `The business is trading with ${a.employees} people on the payroll and reported ${a.revenue ? `${(a.revenue / 1_000_000).toFixed(2)}M EUR` : "undisclosed"} of revenue in the last full year.`
      : `The entity is not trading. It is held clean with ${a.employees === 1 ? "a single nominee officer" : `${a.employees} officers`} in place and no client onboarding history.`;

  return [
    a.summary,
    `Licensed in ${countryName} under the supervision of the ${regulator}, the entity has held its ${categoryName.toLowerCase()} permissions since ${a.year}.`,
    trading,
    "The seller will support the change of control filing and remain available for a handover period agreed at signing. Full documentation is released after mutual contact acceptance.",
  ].join("\n\n");
}

async function main() {
  // Reseeding on top of an existing database is safe.
  await prisma.moderationAction.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.assetBenefit.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.buyerCategory.deleteMany();
  await prisma.buyerCountry.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.benefit.deleteMany();
  await prisma.country.deleteMany();
  await prisma.category.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await prisma.category.createMany({ data: CATEGORIES });
  await prisma.country.createMany({
    data: COUNTRIES.map(({ slug, name, code }) => ({ slug, name, code })),
  });
  await prisma.benefit.createMany({ data: BENEFITS });

  const categories = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c]),
  );
  const countries = new Map((await prisma.country.findMany()).map((c) => [c.slug, c]));
  const benefits = new Map((await prisma.benefit.findMany()).map((b) => [b.slug, b]));
  const regulators = new Map(COUNTRIES.map((c) => [c.slug, c.regulator]));

  const manager = await prisma.user.create({
    data: {
      email: "manager@n5deal.demo",
      passwordHash,
      role: "MANAGER",
      status: "ACTIVE",
    },
  });

  const sellerByEmail = new Map<string, { userId: string; profileId: string }>();
  for (const s of SELLERS) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash,
        role: "SELLER",
        status: s.status ?? "ACTIVE",
        suspendedAt: s.status === "SUSPENDED" ? daysAgo(2) : null,
        suspendReason: s.suspendReason ?? null,
        sellerProfile: {
          create: {
            companyName: s.company,
            about: s.about,
            website: s.website,
            contactName: s.contactName,
            phone: s.phone,
          },
        },
      },
      include: { sellerProfile: true },
    });
    sellerByEmail.set(s.email, {
      userId: user.id,
      profileId: user.sellerProfile!.id,
    });
  }

  const buyerByEmail = new Map<string, { userId: string; profileId: string }>();
  for (const b of BUYERS) {
    const user = await prisma.user.create({
      data: {
        email: b.email,
        passwordHash,
        role: "BUYER",
        status: b.status ?? "ACTIVE",
        suspendedAt: b.status === "SUSPENDED" ? daysAgo(1) : null,
        suspendReason: b.suspendReason ?? null,
        buyerProfile: {
          create: {
            displayName: b.displayName,
            headline: b.headline,
            thesis: b.thesis,
            investorType: b.investorType,
            timeline: b.timeline,
            ticketMinEur: b.min,
            ticketMaxEur: b.max,
            preferredBusinessStatus: b.preferred,
            contactName: b.contactName,
            phone: b.phone,
            isPublished: b.published ?? true,
            categories: {
              create: b.categories.map((slug) => ({
                categoryId: categories.get(slug)!.id,
              })),
            },
            countries: {
              create: b.countries.map((slug) => ({
                countryId: countries.get(slug)!.id,
              })),
            },
          },
        },
      },
      include: { buyerProfile: true },
    });
    buyerByEmail.set(b.email, {
      userId: user.id,
      profileId: user.buyerProfile!.id,
    });
  }

  const assetByTitle = new Map<string, string>();
  let reference = 700;
  for (const a of ASSETS) {
    const country = countries.get(a.country)!;
    const category = categories.get(a.category)!;
    const status = a.status ?? "PUBLISHED";
    const created = await prisma.asset.create({
      data: {
        reference: reference++,
        sellerId: sellerByEmail.get(a.seller)!.profileId,
        title: a.title,
        summary: a.summary,
        description: describe(a, country.name, regulators.get(a.country)!, category.name),
        categoryId: category.id,
        countryId: country.id,
        licenseType: a.license,
        regulator: regulators.get(a.country)!,
        businessStatus: a.businessStatus,
        askingPriceEur: a.price,
        annualRevenueEur: a.revenue,
        ebitdaEur: a.ebitda,
        employees: a.employees,
        yearOfIssue: a.year,
        views: a.views,
        status,
        publishedAt:
          status === "PUBLISHED" || status === "ARCHIVED"
            ? daysAgo(a.listedDaysAgo ?? 30)
            : null,
        createdAt: daysAgo((a.listedDaysAgo ?? 30) + 2),
        benefits: {
          create: a.benefits.map((slug) => ({ benefitId: benefits.get(slug)!.id })),
        },
      },
    });
    assetByTitle.set(a.title, created.id);
  }

  for (const c of CONTACTS) {
    const initiator = sellerByEmail.get(c.from) ?? buyerByEmail.get(c.from)!;
    const target = sellerByEmail.get(c.to) ?? buyerByEmail.get(c.to)!;
    await prisma.contactRequest.create({
      data: {
        initiatorId: initiator.userId,
        targetId: target.userId,
        assetId: c.assetTitle ? assetByTitle.get(c.assetTitle)! : null,
        buyerProfileId: c.buyerEmail ? buyerByEmail.get(c.buyerEmail)!.profileId : null,
        message: c.message,
        status: c.status,
        responseNote: c.responseNote ?? null,
        createdAt: daysAgo(c.daysAgo),
        respondedAt: c.status === "PENDING" ? null : daysAgo(Math.max(0, c.daysAgo - 1)),
      },
    });
  }

  const blockedSeller = SELLERS.find((s) => s.status === "SUSPENDED")!;
  const blockedBuyer = BUYERS.find((b) => b.status === "SUSPENDED")!;
  await prisma.moderationAction.createMany({
    data: [
      {
        actorId: manager.id,
        targetType: "USER",
        targetId: sellerByEmail.get(blockedSeller.email)!.userId,
        targetLabel: `${blockedSeller.company} (${blockedSeller.email})`,
        action: "SUSPEND_USER",
        reason: blockedSeller.suspendReason!,
        createdAt: daysAgo(2),
      },
      {
        actorId: manager.id,
        targetType: "USER",
        targetId: buyerByEmail.get(blockedBuyer.email)!.userId,
        targetLabel: `${blockedBuyer.displayName} (${blockedBuyer.email})`,
        action: "SUSPEND_USER",
        reason: blockedBuyer.suspendReason!,
        createdAt: daysAgo(1),
      },
    ],
  });

  const counts = {
    users: await prisma.user.count(),
    assets: await prisma.asset.count(),
    contacts: await prisma.contactRequest.count(),
  };
  console.log(
    `Seeded ${counts.users} users, ${counts.assets} assets, ${counts.contacts} contact requests. Password for every demo account: ${DEMO_PASSWORD}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
