/**
 * ndjson-lens: CLI Interface
 */

import { parseArgs } from 'node:util';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { NdjsonLensTransform } from './stream.js';

export async function runCli(argv = process.argv.slice(2)) {
  const options = {
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false },
    level: { type: 'string', short: 'l' },
    grep: { type: 'string', short: 'g' },
    'no-delta': { type: 'boolean', default: false },
    file: { type: 'string', short: 'f' }
  };

  let parsed;
  try {
    parsed = parseArgs({ args: argv, options, allowPositionals: true });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    printHelp();
    return 0;
  }

  if (values.version) {
    console.log('ndjson-lens v1.0.0');
    return 0;
  }

  const targetFile = values.file || positionals[0];
  const allowedLevels = values.level ? values.level.split(',').map((s) => s.trim()) : undefined;
  const grepRegex = values.grep ? new RegExp(values.grep, 'i') : undefined;

  const transform = new NdjsonLensTransform({
    allowedLevels,
    grepRegex,
    showDelta: !values['no-delta']
  });

  if (targetFile) {
    const inputStream = createReadStream(targetFile);
    await pipeline(inputStream, transform, process.stdout);
    return 0;
  }

  // Stdin pipe
  if (!process.stdin.isTTY) {
    await pipeline(process.stdin, transform, process.stdout);
    return 0;
  }

  printHelp();
  return 0;
}

function printHelp() {
  console.log(`
ndjson-lens - Streaming Structured Log Beautifier & Latency Profiler

USAGE:
  $ cat server.log | ndjson-lens [flags]
  $ docker logs -f my-container | ndjson-lens [flags]
  $ ndjson-lens app.ndjson [flags]

FLAGS:
  -l, --level <levels>   Filter by log level (e.g. "error", "error,warn")
  -g, --grep <pattern>   Filter lines matching regex pattern
      --no-delta         Disable inter-log latency calculation
  -f, --file <path>      Read from file instead of stdin
  -v, --version          Show version
  -h, --help             Show help

EXAMPLES:
  # Pretty-print Docker logs with time deltas:
  $ docker logs -f api-gateway | ndjson-lens

  # Filter only error and warning logs from a file:
  $ ndjson-lens app.log -l error,warn

  # Search for database query logs:
  $ cat app.log | ndjson-lens --grep "SELECT"
`);
}

