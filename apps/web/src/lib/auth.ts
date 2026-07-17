import { dash } from "@better-auth/infra";
import { betterAuth } from "better-auth";
import { getBindings } from "@/lib/cloudflare";

export async function createAuth() {
  const env = await getBindings();
  const githubConfigured = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
  const infraConfigured = Boolean(env.BETTER_AUTH_API_KEY);

  const secret = env.BETTER_AUTH_SECRET;
  if (!secret && env.APP_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET must be set in production");
  }

  return betterAuth({
    appName: "UIRift",
    baseURL: env.BETTER_AUTH_URL,
    secret: secret ?? "uirift-local-development-secret-change-before-deploying",
    database: env.DB,
    socialProviders: githubConfigured
      ? { github: { clientId: env.GITHUB_CLIENT_ID!, clientSecret: env.GITHUB_CLIENT_SECRET!, scope: ["user:email"] } }
      : {},
    plugins: infraConfigured ? [dash({ apiKey: env.BETTER_AUTH_API_KEY })] : [],
    advanced: { database: { generateId: "uuid" } },
  });
}

export async function getRequestUser(request: Request) {
  const env = await getBindings();
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    if (env.APP_ENV === "production") return null;
    return { id: "local-demo-user", name: "Yeabsira Mekuria", email: "demo@uirift.local" };
  }
  const auth = await createAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}
