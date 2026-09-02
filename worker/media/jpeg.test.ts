import { describe, expect, it } from 'vitest';
import { inspectJPEG } from './jpeg';

const jpeg = (width = 1200, height = 900, entropy = [1, 2, 3]) => new Uint8Array([
  0xff, 0xd8,
  0xff, 0xc0, 0, 17, 8, height >> 8, height & 255, width >> 8, width & 255, 3, 1, 0x11, 0, 2, 0x11, 0, 3, 0x11, 0,
  0xff, 0xda, 0, 8, 1, 1, 0, 0, 63, 0,
  ...entropy,
  0xff, 0xd9,
]);
const noSOS = (width = 2, height = 2) => jpeg(width, height).slice(0, 21);

describe('JPEG structural inspector', () => {
  it('accepts a complete structural JPEG', () => expect(inspectJPEG(jpeg())).toEqual({ width: 1200, height: 900 }));
  it('rejects invalid magic', () => expect(() => inspectJPEG(new Uint8Array([1, 2, 3]))).toThrow('INVALID_MAGIC'));
  it('rejects a truncated SOF', () => expect(() => inspectJPEG(new Uint8Array([0xff, 0xd8, 0xff, 0xc0, 0, 17]))).toThrow('TRUNCATED'));
  it('rejects zero dimensions', () => expect(() => inspectJPEG(jpeg(0, 2))).toThrow('INVALID_DIMENSIONS'));
  it('rejects oversized dimensions', () => expect(() => inspectJPEG(jpeg(4097, 2))).toThrow('DIMENSIONS_TOO_LARGE'));
  it('rejects the pixel limit', () => expect(() => inspectJPEG(jpeg(4096, 4096))).toThrow('PIXELS_TOO_LARGE'));
  it('rejects SOF without SOS', () => expect(() => inspectJPEG(noSOS())).toThrow('MISSING_SOS'));
  it('rejects SOS without EOI', () => expect(() => inspectJPEG(jpeg().slice(0, -2))).toThrow('MISSING_EOI'));
  it('rejects an entropy stream ending in FF', () => expect(() => inspectJPEG(jpeg().slice(0, -1))).toThrow('TRUNCATED'));
  it('accepts stuffed FF00', () => expect(inspectJPEG(jpeg(3, 2, [1, 0xff, 0, 2]))).toEqual({ width: 3, height: 2 }));
  it('accepts restart markers', () => expect(inspectJPEG(jpeg(3, 2, [1, 0xff, 0xd2, 2]))).toEqual({ width: 3, height: 2 }));
});
