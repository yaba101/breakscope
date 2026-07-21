import { describe, expect, it } from "vitest";
import { capturedImageMimeType } from "./captured-image";

describe("capturedImageMimeType", () => {
  it("recognizes compact JPEG captures and preserves legacy PNG captures", () => {
    expect(capturedImageMimeType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]).buffer)).toBe("image/jpeg");
    expect(capturedImageMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]).buffer)).toBe("image/png");
  });
});
