#!/usr/bin/env node
/**
 * ndjson-lens: Interactive Live Demo
 */

import { formatLogEntry } from '../src/formatter.js';

console.log('\n=== [DEMO] Starting ndjson-lens ===\n');

const mockLogStream = [
  { level: 'info', time: 1700000000000, msg: 'API Gateway received POST /checkout', service: 'gateway' },
  { level: 'info', time: 1700000000045, msg: 'Auth token verified', service: 'auth-svc' },
  { level: 'warn', time: 1700000000620, msg: 'Database query slow on orders table', service: 'db-pool', queryMs: 575 },
  { level: 'error', time: 1700000002800, msg: 'Third-party payment gateway timeout', service: 'payment-svc', error: 'ETIMEDOUT' }
];

console.log('Formatting Structured JSON Logs with Inter-Log Latency Profiling:');
console.log('------------------------------------------------------------');

let lastTime = mockLogStream[0].time;
for (const entry of mockLogStream) {
  const deltaMs = entry.time - lastTime;
  lastTime = entry.time;
  process.stdout.write(formatLogEntry(entry, { deltaMs, showDelta: true }));
}

console.log('------------------------------------------------------------');
console.log('[SUCCESS] Demo completed successfully.\n');

