import { afterEach, describe, expect, it, vi } from "vitest";
import { capturePageLocally, scanRouteLocally } from "./local-capture";

describe("local capture client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads screenshots as binary JPEG responses without base64 decoding", async () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const fetchMock = vi.fn().mockResolvedValue(new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "X-Breakscope-Final-Url": encodeURIComponent("https://example.com/final"),
        "X-Breakscope-Status": "200",
        "X-Breakscope-Duration-Ms": "125",
        "X-Breakscope-Document-Height": "2400",
      },
    }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await capturePageLocally({ url: "https://example.com", routePath: "/", viewport: "desktop", width: 1280 });

    expect(fetchMock).toHaveBeenCalledWith("/api/local-capture/image", expect.objectContaining({ method: "POST" }));
    expect(new Uint8Array(await result.image.arrayBuffer())).toEqual(bytes);
    expect(result.finalUrl).toBe("https://example.com/final");
    expect(result.snapshot.documentHeight).toBe(2400);
  });

  it("forwards profile and checkpoint audit widths to the responsive scanner", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ routePath: "/", samples: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await scanRouteLocally({
      url: "https://example.com",
      routePath: "/",
      widths: [320, 768, 1440],
      auditWidths: [768, 1440],
      testProfile: "accessibility",
      profile: { browserEngine: "chromium" },
    });

    const request = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(JSON.parse(String(request.body))).toEqual(expect.objectContaining({ testProfile: "accessibility", auditWidths: [768, 1440] }));
  });
});
