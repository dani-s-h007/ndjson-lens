import { Transform } from 'node:stream';

export interface FormatOptions {
  deltaMs?: number;
  showDelta?: boolean;
}

export declare function normalizeLogLevel(level: string | number): string;
export declare function formatLogEntry(obj: Record<string, any>, options?: FormatOptions): string;

export interface LensOptions {
  allowedLevels?: string[];
  grepRegex?: RegExp;
  showDelta?: boolean;
}

export declare class NdjsonLensTransform extends Transform {
  constructor(options?: LensOptions);
}

