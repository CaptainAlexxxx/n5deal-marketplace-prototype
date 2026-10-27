/** Secrets that shipped in .env.example or local setups; never acceptable in production. */
const KNOWN_DEMO_SECRETS = [
  "dev-only-secret-not-for-any-deployment-2f8c1a9b47e3",
  "dev-only-secret-do-not-use-in-production-2f8c1a9b47e3",
];

export function isDemoMode(env: NodeJS.ProcessEnv = process.env) {
  return env.DEMO_MODE === "true";
}

export function assertProductionEnv(env: NodeJS.ProcessEnv = process.env) {
  if (env.NODE_ENV !== "production") return;
  const secret = env.AUTH_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET is not set. Refusing to start in production.");
  if (KNOWN_DEMO_SECRETS.includes(secret)) {
    throw new Error("AUTH_SECRET is a published demo value. Refusing to start in production.");
  }
}
