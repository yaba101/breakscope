import { describe, expect, it } from "vitest";
import { isApprovedPublicUrl } from "./index";

describe("public URL validation", () => {
  it("accepts approved HTTPS preview hosts", () => {
    expect(isApprovedPublicUrl("https://preview-example.vercel.app/pricing")).toBe(true);
  });

  it("rejects private and credentialed URLs", () => {
    expect(isApprovedPublicUrl("http://localhost:3000")).toBe(false);
    expect(isApprovedPublicUrl("https://user:pass@example.vercel.app")).toBe(false);
    expect(isApprovedPublicUrl("https://192.168.1.2")).toBe(false);
  });
});
