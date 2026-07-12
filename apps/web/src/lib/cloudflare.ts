import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getBindings() {
  return (await getCloudflareContext({ async: true })).env;
}

export async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
