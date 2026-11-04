/**
 * Daily token usage folded out of this profile's durable session logs.
 *
 * Every compressed `assistant/message` event carries the provider's usage
 * report (`inputTokens`, `outputTokens`, `cacheReadTokens`, …) plus the event
 * `time`, which is the only per-day record the Harness keeps. Token-meter
 * semantics are reused: `inputTokens` counts uncached input only, so cache
 * reads are reported beside it rather than folded in.
 *
 * The fold is cached per session file, keyed by mtime and size, so a refreshed
 * view only re-reads logs that actually changed. A first look at a long window
 * is bounded by a time budget and reports how much is still pending, letting
 * the caller continue from the partially filled cache instead of blocking.
 */

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import * as zlib from 'node:zlib';

const zstdDecompress = typeof zlib.zstdDecompress === 'function' ? promisify(zlib.zstdDecompress) : undefined;
const zstdDecompressSync = typeof zlib.zstdDecompressSync === 'function' ? zlib.zstdDecompressSync : undefined;

/** One session directory holds several generations; the highest wins. */
const SESSION_FILE = /^session(?:\.v(\d+))?\.jsonl(\.zstd)?$/;
const DAY_MS = 86_400_000;
const YIELD_EVERY_LINES = 20_000;
const MAX_PROBLEMS = 4;
const CACHE_VERSION = 1;

const DAY_FIELDS = ['input', 'output', 'cacheRead', 'cacheWrite', 'reasoning', 'messages'];

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

/** The Harness home that owns `sessions/`. */
function dshHome() {
  const configured = process.env.DSH_HOME;
  if (typeof configured === 'string' && configured !== '') return configured;
  return join(homedir(), '.dsh');
}

/** This plugin's own state file: a derived cache, never a source of truth. */
function cachePath() {
  return join(dshHome(), 'state', 'my-workbench', 'usage-cache.json');
}

/** Local calendar day of one epoch timestamp, as `YYYY-MM-DD`. */
function dayKey(timeMs) {
  const date = new Date(timeMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Local midnight of one epoch timestamp. */
function startOfDay(timeMs) {
  const date = new Date(timeMs);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function positive(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/** One empty day bucket. */
function emptyDay() {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, messages: 0 };
}

/**
 * Every session log, newest modification first, reduced to one file per
 * session: the highest format generation present in that directory.
 */
async function sessionLogs() {
  const root = join(dshHome(), 'sessions');
  const found = [];
  let workspaces;
  try {
    workspaces = await readdir(root, { withFileTypes: true });
  } catch (error) {
    return { logs: found, problem: `Reading ${root} failed: ${messageOf(error)}` };
  }
  for (const workspace of workspaces) {
    if (!workspace.isDirectory()) continue;
    const workspaceDir = join(root, workspace.name);
    let sessions;
    try {
      sessions = await readdir(workspaceDir, { withFileTypes: true });
    } catch (error) {
      continue;
    }
    for (const session of sessions) {
      if (!session.isDirectory()) continue;
      const sessionDir = join(workspaceDir, session.name);
      let entries;
      try {
        entries = await readdir(sessionDir, { withFileTypes: true });
      } catch (error) {
        continue;
      }
      let best;
      let bestVersion = -1;
      for (const entry of entries) {
        if (!entry.isFile()) continue;
        const match = SESSION_FILE.exec(entry.name);
        if (match === null) continue;
        const version = match[1] === undefined ? 0 : Number(match[1]);
        if (version <= bestVersion) continue;
        bestVersion = version;
        best = { file: join(sessionDir, entry.name), compressed: match[2] === '.zstd' };
      }
      if (best === undefined) continue;
      let info;
      try {
        info = await stat(best.file);
      } catch (error) {
        continue;
      }
      found.push({
        file: best.file,
        compressed: best.compressed,
        mtimeMs: info.mtimeMs,
        size: info.size,
        session: session.name.replace(/^session-/, ''),
      });
    }
  }
  found.sort((left, right) => right.mtimeMs - left.mtimeMs);
  return { logs: found, problem: undefined };
}

/** Little-endian bytes of the zstd frame magic number. */
const ZSTD_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd]);

/** Offsets of every zstd frame header in one compressed buffer. */
function frameOffsets(bytes) {
  const offsets = [];
  let at = bytes.indexOf(ZSTD_MAGIC, 0);
  while (at >= 0) {
    offsets.push(at);
    at = bytes.indexOf(ZSTD_MAGIC, at + 4);
  }
  return offsets;
}

/** Decode one compressed slice with whichever decoder this runtime offers. */
async function decodeSlice(slice) {
  if (zstdDecompressSync !== undefined) return Buffer.from(zstdDecompressSync(slice));
  if (zstdDecompress === undefined) throw new Error('this runtime cannot decompress zstd session logs');
  return Buffer.from(await zstdDecompress(slice));
}

/**
 * Decode a session log, which is a chain of independently flushed frames.
 *
 * A single-shot decode only reads the first frame in some runtimes, which would
 * silently report the session header and no usage at all, so every frame is
 * decoded on its own and the results are concatenated. A magic number inside a
 * compressed block would look like a frame start, so a slice that fails to
 * decode is extended to the next candidate boundary and retried.
 */
async function decodeZstd(bytes) {
  if (bytes.length === 0) return Buffer.alloc(0);
  const offsets = frameOffsets(bytes);
  const starts = offsets.length === 0 || offsets[0] !== 0 ? [0, ...offsets] : offsets;
  const parts = [];
  let index = 0;
  while (index < starts.length) {
    let attempt = index + 1;
    let end = attempt < starts.length ? starts[attempt] : bytes.length;
    let decoded;
    while (decoded === undefined) {
      try {
        decoded = await decodeSlice(bytes.subarray(starts[index], end));
      } catch (error) {
        if (attempt >= starts.length) throw error;
        attempt += 1;
        end = attempt < starts.length ? starts[attempt] : bytes.length;
      }
    }
    parts.push(decoded);
    index = attempt;
  }
  return Buffer.concat(parts);
}

/** Read one log as text, decompressing when the store compressed it. */
async function readLogText(log) {
  const bytes = await readFile(log.file);
  if (!log.compressed) return bytes.toString('utf8');
  return (await decodeZstd(bytes)).toString('utf8');
}

/**
 * Fold one log into per-day totals.
 *
 * Only lines that can carry a usage report are parsed: a session log is mostly
 * stream chunks, and matching the event name first keeps a 100 MB log cheap.
 */
async function foldLog(log, cutoffMs) {
  const text = await readLogText(log);
  const days = new Map();
  const length = text.length;
  let start = 0;
  let lines = 0;
  while (start < length) {
    let end = text.indexOf('\n', start);
    if (end === -1) end = length;
    const line = text.slice(start, end);
    start = end + 1;
    lines += 1;
    if (lines % YIELD_EVERY_LINES === 0) await new Promise((resolve) => setImmediate(resolve));
    if (line.length < 24 || !line.includes('assistant/message')) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch (error) {
      continue;
    }
    if (event === null || typeof event !== 'object' || event.type !== 'assistant/message') continue;
    const usage = event.data === undefined ? undefined : event.data.usage;
    if (usage === null || typeof usage !== 'object') continue;
    const time = typeof event.time === 'number' ? event.time : undefined;
    if (time === undefined || time < cutoffMs) continue;
    const key = dayKey(time);
    const day = days.get(key) ?? emptyDay();
    day.input += positive(usage.inputTokens);
    day.output += positive(usage.outputTokens);
    day.cacheRead += positive(usage.cacheReadTokens);
    day.cacheWrite += positive(usage.cacheWriteTokens);
    day.reasoning += positive(usage.reasoningTokens);
    day.messages += 1;
    days.set(key, day);
  }
  return days;
}

/** The persisted fold cache: `{ version, files: { [path]: { mtimeMs, size, days } } }`. */
async function readCache() {
  try {
    const parsed = JSON.parse(await readFile(cachePath(), 'utf8'));
    if (parsed !== null && typeof parsed === 'object' && parsed.version === CACHE_VERSION && typeof parsed.files === 'object' && parsed.files !== null) {
      return parsed;
    }
  } catch (error) {
    // A missing or unreadable cache is simply an empty one.
  }
  return { version: CACHE_VERSION, files: {} };
}

let cacheWriter = Promise.resolve();
async function writeCache(cache) {
  cacheWriter = cacheWriter.then(async () => {
    try {
      const target = cachePath();
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, JSON.stringify(cache), 'utf8');
    } catch (error) {
      // The cache is derived data: losing a write only costs a re-read.
    }
  });
  return cacheWriter;
}

function clampDays(value) {
  const days = Number(value);
  if (!Number.isFinite(days)) return 7;
  return Math.min(365, Math.max(1, Math.round(days)));
}

/**
 * The two comparable totals of one bucket.
 *
 * `total` counts what the model wrote and the uncached prompt it read;
 * `totalWithCache` adds the cached prompt back, which is where the bulk of the
 * traffic sits on a long session.
 */
function totalsOf(bucket) {
  const total = bucket.input + bucket.output + bucket.reasoning;
  return { total, totalWithCache: total + bucket.cacheRead + bucket.cacheWrite };
}

/**
 * Summarize the last `days` calendar days of token usage.
 *
 * @param days - window length in days, today included.
 * @param budgetMs - how long one call may spend folding uncached logs.
 * @returns per-day totals, window totals, and what is still pending.
 */
export async function summarizeUsage({ days = 7, budgetMs = 4000 } = {}) {
  const problems = [];
  const windowDays = clampDays(days);
  const todayStart = startOfDay(Date.now());
  const firstDay = todayStart - (windowDays - 1) * DAY_MS;
  const fromDate = dayKey(firstDay);
  const todayDate = dayKey(todayStart);

  const { logs, problem } = await sessionLogs();
  if (problem !== undefined) problems.push(problem);

  const cache = await readCache();
  const inWindow = [];
  const pending = [];
  for (const log of logs) {
    // A log cannot hold an event newer than its own last write.
    if (log.mtimeMs < firstDay) continue;
    inWindow.push(log);
    const known = cache.files[log.file];
    if (known !== undefined && known.mtimeMs === log.mtimeMs && known.size === log.size) continue;
    pending.push(log);
  }

  const started = Date.now();
  let folded = 0;
  let unavailable = false;
  for (const log of pending) {
    if (Date.now() - started > budgetMs) break;
    if (log.compressed && zstdDecompressSync === undefined && zstdDecompress === undefined) {
      if (!unavailable) {
        problems.push('This runtime cannot decompress zstd session logs, so compressed logs are skipped.');
        unavailable = true;
      }
      continue;
    }
    try {
      const foldedDays = await foldLog(log, firstDay);
      cache.files[log.file] = {
        mtimeMs: log.mtimeMs,
        size: log.size,
        days: Object.fromEntries(foldedDays),
      };
      folded += 1;
    } catch (error) {
      if (problems.length < MAX_PROBLEMS) problems.push(`${log.session}: ${messageOf(error)}`);
    }
  }
  if (folded > 0) await writeCache(cache);

  const buckets = new Map();
  const daySessions = new Map();
  const windowSessions = new Set();
  for (const log of inWindow) {
    const record = cache.files[log.file];
    if (record === undefined) continue;
    for (const [date, day] of Object.entries(record.days)) {
      if (date < fromDate || date > todayDate) continue;
      const bucket = buckets.get(date) ?? emptyDay();
      for (const field of DAY_FIELDS) bucket[field] += positive(day[field]);
      buckets.set(date, bucket);
      windowSessions.add(log.session);
      const sessions = daySessions.get(date) ?? new Set();
      sessions.add(log.session);
      daySessions.set(date, sessions);
    }
  }

  const byDay = [];
  for (let offset = 0; offset < windowDays; offset += 1) {
    const date = dayKey(firstDay + offset * DAY_MS);
    const bucket = buckets.get(date) ?? emptyDay();
    const sessions = daySessions.get(date);
    byDay.push({ date, ...bucket, ...totalsOf(bucket), sessions: sessions === undefined ? 0 : sessions.size });
  }

  const totals = emptyDay();
  for (const day of byDay) {
    for (const field of DAY_FIELDS) totals[field] += day[field];
  }
  const promptTokens = totals.input + totals.cacheRead;
  const today = byDay[byDay.length - 1];

  return {
    range: { days: windowDays, from: fromDate, to: todayDate },
    days: byDay,
    today,
    totals: {
      ...totals,
      ...totalsOf(totals),
      promptTokens,
      hitRate: promptTokens > 0 ? totals.cacheRead / promptTokens : 0,
      sessions: windowSessions.size,
    },
    scan: {
      logs: inWindow.length,
      folded,
      pending: Math.max(0, pending.length - folded),
      remainingBytes: pending.slice(folded).reduce((sum, log) => sum + log.size, 0),
      budgetMs,
    },
    problems,
  };
}
