/**
 * ndjson-lens: ANSI Formatter & Field Extractor
 */

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const LEVEL_COLORS = {
  error: COLORS.red + COLORS.bold,
  err: COLORS.red + COLORS.bold,
  fatal: COLORS.red + COLORS.bold,
  warn: COLORS.yellow,
  warning: COLORS.yellow,
  info: COLORS.cyan,
  debug: COLORS.gray,
  trace: COLORS.magenta
};

/**
 * Normalizes log level from numeric (Pino/Bunyan) or string representation
 * @param {string|number} level
 * @returns {string}
 */
export function normalizeLogLevel(level) {
  if (typeof level === 'number') {
    if (level >= 60) return 'fatal';
    if (level >= 50) return 'error';
    if (level >= 40) return 'warn';
    if (level >= 30) return 'info';
    if (level >= 20) return 'debug';
    return 'trace';
  }
  if (typeof level === 'string') {
    return level.toLowerCase();
  }
  return 'info';
}

/**
 * Formats a single parsed JSON log object into a human-readable ANSI string
 * @param {object} obj
 * @param {object} [options]
 * @param {number} [options.deltaMs]
 * @param {boolean} [options.showDelta=true]
 * @returns {string}
 */
export function formatLogEntry(obj, options = {}) {
  const level = normalizeLogLevel(obj.level || obj.lvl || obj.severity || 'info');
  const levelColor = LEVEL_COLORS[level] || COLORS.cyan;

  // Extract message
  const message = obj.msg || obj.message || obj.text || '';

  // Extract timestamp
  const rawTime = obj.time || obj.timestamp || obj.ts || Date.now();
  let timeStr = '';
  try {
    const d = new Date(rawTime);
    timeStr = isNaN(d.getTime()) ? String(rawTime) : d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch {
    timeStr = String(rawTime);
  }

  // Format latency delta
  let deltaStr = '';
  if (options.showDelta && options.deltaMs !== undefined) {
    if (options.deltaMs > 2000) {
      deltaStr = ` ${COLORS.red}+${(options.deltaMs / 1000).toFixed(2)}s ⚠️${COLORS.reset}`;
    } else if (options.deltaMs > 500) {
      deltaStr = ` ${COLORS.yellow}+${options.deltaMs}ms${COLORS.reset}`;
    } else {
      deltaStr = ` ${COLORS.gray}+${options.deltaMs}ms${COLORS.reset}`;
    }
  }

  // Format header line: [18:45:10.123] INFO (auth-service): User logged in +42ms
  const name = obj.name || obj.service || '';
  const nameStr = name ? ` ${COLORS.dim}(${name})${COLORS.reset}` : '';
  const levelBadge = `${levelColor}${level.toUpperCase().padEnd(5)}${COLORS.reset}`;

  let out = `${COLORS.gray}[${timeStr}]${COLORS.reset} ${levelBadge}${nameStr}: ${COLORS.bold}${message}${COLORS.reset}${deltaStr}\n`;

  // Filter out extracted fields from remaining payload
  const ignoreKeys = new Set(['level', 'lvl', 'severity', 'msg', 'message', 'text', 'time', 'timestamp', 'ts', 'name', 'service', 'v']);
  const payload = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!ignoreKeys.has(k)) {
      payload[k] = v;
    }
  }

  if (Object.keys(payload).length > 0) {
    const formattedJson = JSON.stringify(payload, null, 2)
      .split('\n')
      .map((l) => '  ' + COLORS.dim + l + COLORS.reset)
      .join('\n');
    out += formattedJson + '\n';
  }

  return out;
}

