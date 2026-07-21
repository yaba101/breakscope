export function capturedImageMimeType(image: ArrayBuffer) {
  const bytes = new Uint8Array(image, 0, Math.min(image.byteLength, 3));
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff ? "image/jpeg" : "image/png";
}
