# ndjson-lens 👁️

[![CI](https://github.com/dani-s-h007/ndjson-lens/actions/workflows/ci.yml/badge.svg)](https://github.com/dani-s-h007/ndjson-lens/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)

> **Streaming structured log beautifier & latency profiler for Pino, Winston, Zap, and Docker streams.**

Modern cloud and microservice applications output structured JSON/NDJSON. Reading raw single-line JSON logs in terminal windows or Docker outputs is exhausting, and diagnosing which step took 800ms between two log statements requires manually reading millisecond timestamps. `ndjson-lens` formats NDJSON streams in real time with high-visibility ANSI styling, deep payload inspection, and automatic **time delta latency profiling** (`+340ms`, `+2.10s ⚠️`).

---

## ✨ Features

- **Real-Time Latency Delta Tracking**: Automatically calculates and color-codes the elapsed time between consecutive log messages, pinpointing slow database queries, hanging APIs, or blocked event loops.
- **Universal Log Support**: Compatible out-of-the-box with Pino, Winston, Bunyan, Go Zap, Python structlog, and custom JSON loggers.
- **Safe Fallback Pass-Through**: Non-JSON lines (e.g. systemd logs, Docker initialization notices, unhandled stack traces) pass through cleanly without crashing.
- **Level & Grep Filtering**: Quickly isolate errors or specific operation tokens (`--level error,warn` or `--grep "payment"`).
- **Zero Runtime Dependencies**: Ultra-fast pipe throughput with zero third-party dependencies.

---

## 🚀 Installation

```bash
# Run on-demand with npx
npx ndjson-lens --help

# Or install globally
npm install -g ndjson-lens
```

---

## 🛠️ CLI Usage

### Pipe from Docker or Process
```bash
# Pipe Docker logs into ndjson-lens:
docker logs -f my-backend | ndjson-lens

# Pipe local Node app output:
node server.js | ndjson-lens
```

### Filter by Level
```bash
# Only stream error and warning events:
cat app.ndjson | ndjson-lens -l error,warn
```

### Search Specific Operations
```bash
# Filter logs matching regex:
cat production.log | ndjson-lens --grep "stripe_webhook"
```

---

## 💻 Programmatic TypeScript API

```typescript
import { formatLogEntry, NdjsonLensTransform } from 'ndjson-lens';
import { pipeline } from 'node:stream/promises';

const transform = new NdjsonLensTransform({
  allowedLevels: ['error', 'warn'],
  showDelta: true
});

await pipeline(process.stdin, transform, process.stdout);
```

---

## 🧪 Testing

```bash
npm test
```

---

## 📄 License

MIT © Essentials Toolkit Authors

