import { describe, expect, it } from "vitest";
import { isApprovedPublicUrl, isCaptureUrl, isPublicHttpsUrl } from "./index";

describe("public URL validation", () => {
  it("accepts approved HTTPS preview hosts", () => {
    expect(isApprovedPublicUrl("https://preview-example.vercel.app/pricing")).toBe(true);
  });

  it("accepts custom public HTTPS domains for local capture", () => {
    expect(isPublicHttpsUrl("https://adavia.com")).toBe(true);
    expect(isCaptureUrl("https://dev.adavia.com")).toBe(true);
  });

  it("still rejects unsafe custom URLs", () => {
    expect(isCaptureUrl("http://adavia.com")).toBe(false);
    expect(isCaptureUrl("https://localhost/admin")).toBe(false);
    expect(isCaptureUrl("https://user:pass@adavia.com")).toBe(false);
    expect(isCaptureUrl("https://10.0.0.4")).toBe(false);
  });

  it("rejects private and credentialed URLs", () => {
    expect(isApprovedPublicUrl("http://localhost:3000")).toBe(false);
    expect(isApprovedPublicUrl("https://user:pass@example.vercel.app")).toBe(false);
    expect(isApprovedPublicUrl("https://192.168.1.2")).toBe(false);
  });
});
