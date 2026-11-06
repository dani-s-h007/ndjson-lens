import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { formatLogEntry, normalizeLogLevel } from '../src/formatter.js';
import { NdjsonLensTransform } from '../src/stream.js';

describe('ndjson-lens', () => {
  describe('normalizeLogLevel', () => {
    it('translates numeric Pino/Bunyan codes to standard strings', () => {
      assert.equal(normalizeLogLevel(30), 'info');
      assert.equal(normalizeLogLevel(40), 'warn');
      assert.equal(normalizeLogLevel(50), 'error');
      assert.equal(normalizeLogLevel(60), 'fatal');
    });

    it('handles case-insensitive strings', () => {
      assert.equal(normalizeLogLevel('WARNING'), 'warning');
      assert.equal(normalizeLogLevel('ERROR'), 'error');
    });
  });

  describe('formatLogEntry', () => {
    it('formats log line and embeds delta ms', () => {
      const entry = {
        level: 'info',
        time: 1700000000000,
        msg: 'User authenticated',
        userId: 42
      };

      const formatted = formatLogEntry(entry, { deltaMs: 145, showDelta: true });
      assert.ok(formatted.includes('INFO'));
      assert.ok(formatted.includes('User authenticated'));
      assert.ok(formatted.includes('+145ms'));
      assert.ok(formatted.includes('"userId": 42'));
    });
  });

  describe('NdjsonLensTransform stream', () => {
    it('processes stream lines and tracks delta intervals', async () => {
      const transform = new NdjsonLensTransform();
      const input = [
        JSON.stringify({ level: 'info', time: 1000, msg: 'Step 1' }) + '\n',
        JSON.stringify({ level: 'info', time: 1350, msg: 'Step 2' }) + '\n',
        'Raw non-json line\n'
      ];

      const readable = Readable.from(input);
      const chunks = [];

      for await (const chunk of readable.pipe(transform)) {
        chunks.push(chunk);
      }

      const output = chunks.join('');
      assert.ok(output.includes('Step 1'));
      assert.ok(output.includes('Step 2'));
      assert.ok(output.includes('+350ms'));
      assert.ok(output.includes('Raw non-json line'));
    });

    it('filters by log level', async () => {
      const transform = new NdjsonLensTransform({ allowedLevels: ['error'] });
      const input = [
        JSON.stringify({ level: 'info', msg: 'Harmless info' }) + '\n',
        JSON.stringify({ level: 'error', msg: 'Critical crash' }) + '\n'
      ];

      const readable = Readable.from(input);
      const chunks = [];

      for await (const chunk of readable.pipe(transform)) {
        chunks.push(chunk);
      }

      const output = chunks.join('');
      assert.ok(!output.includes('Harmless info'));
      assert.ok(output.includes('Critical crash'));
    });
  });
});

