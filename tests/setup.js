import '@testing-library/jest-dom';
import { vi } from 'vitest';

globalThis.jest = vi;
globalThis.jest.setTimeout = (timeout) => vi.setConfig({ testTimeout: timeout });



