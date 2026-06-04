import { webcrypto } from 'node:crypto';
import '@testing-library/jest-dom/vitest';
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream } from 'node:stream/web';

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}
if (!global.ReadableStream) {
  global.ReadableStream = ReadableStream;
}
