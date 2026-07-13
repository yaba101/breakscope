import { z } from "zod";

const approvedSuffixes = ["pages.dev", "vercel.app", "netlify.app", "workers.dev"];

function isIpLiteral(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

export function isApprovedPublicUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || isIpLiteral(host)) return false;
    return approvedSuffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    const host = url.hostname.toLowerCase();
    return host !== "localhost" && !host.endsWith(".localhost") && !isIpLiteral(host);
  } catch {
    return false;
  }
}

export function isLocalPreviewUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export function isCaptureUrl(value: string) {
  return isPublicHttpsUrl(value) || isLocalPreviewUrl(value);
}

export const projectInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  baselineUrl: z.string().url().refine(isPublicHttpsUrl, "Use a public HTTPS URL"),
  candidateUrl: z.string().url().refine(isPublicHttpsUrl, "Use a public HTTPS URL"),
});

export const runInputSchema = z.object({
  routePath: z.string().startsWith("/").max(180),
  viewport: z.enum(["desktop", "mobile"]),
});
