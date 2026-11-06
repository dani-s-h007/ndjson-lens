/**
 * ndjson-lens: Stream Transform & Filter Engine
 */

import { Transform } from 'node:stream';
import { formatLogEntry, normalizeLogLevel } from './formatter.js';

export class NdjsonLensTransform extends Transform {
  /**
   * @param {object} [options]
   * @param {string[]} [options.allowedLevels]
   * @param {RegExp} [options.grepRegex]
   * @param {boolean} [options.showDelta=true]
   */
  constructor(options = {}) {
    super({ decodeStrings: false });
    this.allowedLevels = options.allowedLevels ? new Set(options.allowedLevels.map((l) => l.toLowerCase())) : null;
    this.grepRegex = options.grepRegex || null;
    this.showDelta = options.showDelta ?? true;

    this.lastTimestamp = null;
    this.buffer = '';
  }

  _transform(chunk, encoding, callback) {
    const chunkStr = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    this.buffer += chunkStr;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.processLine(line);
    }
    callback();
  }

  _flush(callback) {
    if (this.buffer.trim().length > 0) {
      this.processLine(this.buffer);
    }
    callback();
  }

  processLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // Non-JSON line: pass through raw
      this.push(line + '\n');
      return;
    }

    if (typeof parsed !== 'object' || parsed === null) {
      this.push(line + '\n');
      return;
    }

    // Filter by level
    const level = normalizeLogLevel(parsed.level || parsed.lvl || parsed.severity || 'info');
    if (this.allowedLevels && !this.allowedLevels.has(level)) {
      return;
    }

    // Filter by grep
    if (this.grepRegex && !this.grepRegex.test(trimmed)) {
      return;
    }

    // Calculate latency delta
    const currentTs = parsed.time || parsed.timestamp || parsed.ts || Date.now();
    let deltaMs;
    const currentTimeMs = typeof currentTs === 'number' ? currentTs : new Date(currentTs).getTime();

    if (this.lastTimestamp !== null && !isNaN(currentTimeMs) && !isNaN(this.lastTimestamp)) {
      deltaMs = Math.max(0, currentTimeMs - this.lastTimestamp);
    }
    this.lastTimestamp = isNaN(currentTimeMs) ? null : currentTimeMs;

    const formatted = formatLogEntry(parsed, {
      deltaMs,
      showDelta: this.showDelta
    });

    this.push(formatted);
  }
}

