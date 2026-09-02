export class JPEGError extends Error {}

const isSOF = (marker: number) =>
  (marker >= 0xc0 && marker <= 0xc3) ||
  (marker >= 0xc5 && marker <= 0xc7) ||
  (marker >= 0xc9 && marker <= 0xcb) ||
  (marker >= 0xcd && marker <= 0xcf);

/** Validates the JPEG envelope and dimensions without decoding image pixels. */
export function inspectJPEG(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new JPEGError('INVALID_MAGIC');
  let offset = 2;
  let pendingMarker: number | undefined;
  let dimensions: { width: number; height: number } | undefined;
  let sawSOS = false;

  while (offset < bytes.length || pendingMarker !== undefined) {
    let marker = pendingMarker;
    pendingMarker = undefined;
    if (marker === undefined) {
      if (bytes[offset++] !== 0xff) throw new JPEGError('INVALID_MARKER');
      while (offset < bytes.length && bytes[offset] === 0xff) offset++;
      if (offset >= bytes.length) throw new JPEGError('TRUNCATED');
      marker = bytes[offset++];
    }
    if (marker === 0xd9) {
      if (!dimensions) throw new JPEGError('NO_DIMENSIONS');
      if (!sawSOS) throw new JPEGError('MISSING_SOS');
      return dimensions;
    }
    if (marker === 0x00) throw new JPEGError('INVALID_MARKER');
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.length) throw new JPEGError('TRUNCATED');
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) throw new JPEGError('TRUNCATED');
    if (isSOF(marker)) {
      if (length < 7) throw new JPEGError('INVALID_DIMENSIONS');
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      if (!width || !height) throw new JPEGError('INVALID_DIMENSIONS');
      if (width > 4096 || height > 4096) throw new JPEGError('DIMENSIONS_TOO_LARGE');
      if (width * height > 16_000_000) throw new JPEGError('PIXELS_TOO_LARGE');
      dimensions = { width, height };
    }
    offset += length;
    if (marker !== 0xda) continue;
    sawSOS = true;
    let foundMarker = false;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 0xff) continue;
      if (offset >= bytes.length) throw new JPEGError('TRUNCATED');
      while (offset < bytes.length && bytes[offset] === 0xff) offset++;
      if (offset >= bytes.length) throw new JPEGError('TRUNCATED');
      const entropyMarker = bytes[offset++];
      if (entropyMarker === 0x00 || (entropyMarker >= 0xd0 && entropyMarker <= 0xd7)) continue;
      pendingMarker = entropyMarker;
      foundMarker = true;
      break;
    }
    if (!foundMarker) throw new JPEGError('MISSING_EOI');
  }
  throw new JPEGError(sawSOS ? 'MISSING_EOI' : 'MISSING_SOS');
}
