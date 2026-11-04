/**
 * Host half of "My Workbench" (the left-sidebar workbench panel).
 *
 * The workbench is a shell for small management modules. A module owns one
 * read route plus, at most, one write route under `API_PREFIX`; the Client half
 * renders the same modules as tabs. Adding a module means adding one Host
 * route here and one entry to `MODULES` in `client.js`.
 *
 * Modules shipped today:
 *   - `mcp`    reads the configured MCP server rows from the live Loader patch
 *              layer and flips their enablement through `pluginManager`.
 *   - `skills` lists one skill library folder and one skill's full body.
 *   - `usage`  folds daily token totals out of the session logs (`usage.js`).
 *
 * Every service besides `webServer` is read through `ctx.get()` so this plugin
 * stays active in a Host composition that does not mount one of them.
 */

import { readdir, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { summarizeUsage } from './usage.js';

const API_PREFIX = '/api/my-workbench';
const MCP_MODULE = '@deepseek-ai/dsh-mcp-client';

const inject = ['webServer'];

/** Human-readable text for a thrown value. */
function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

/** One JSON response; a second write after headers were sent is a no-op. */
function sendJson(res, status, value) {
  if (res.headersSent) return;
  const body = JSON.stringify(value);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

/** Read one JSON request body; an empty body is an empty object. */
function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    req.on('data', (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        fail(new Error('request body is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (text === '') {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch (error) {
        reject(new Error(`request body is not valid JSON: ${messageOf(error)}`));
      }
    });
    req.on('error', (error) => fail(error));
  });
}

/**
 * Display text for a raw config value. A YAML `!!js` scalar reaches the Loader
 * as an inert `{ __jsExpr }` marker, so it is shown as an expression instead of
 * as JSON.
 */
function plainValue(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && typeof value.__jsExpr === 'string') {
    return `<expression: ${value.__jsExpr}>`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

/** Every identity a Loader config entry may be addressed by. */
function identityKeys(value) {
  const keys = [];
  const push = (candidate) => {
    if (typeof candidate === 'string' && candidate !== '' && !keys.includes(candidate)) {
      keys.push(candidate);
    }
  };
  push(value?.id);
  push(value?.patchId);
  push(value?.options?.id);
  push(value?.entry?.id);
  push(value?.entry?.patchId);
  return keys;
}

/**
 * Live MCP server rows.
 *
 * Identity, enablement and fiber phase come from `pluginManager`; the endpoint
 * description comes from the Loader patch layer through `configEditor`, and the
 * tool count is derived from the registered tool names `mcp__<server>__<tool>`.
 */
async function listMcpServers(ctx) {
  const problems = [];
  const manager = ctx.get('pluginManager');
  if (manager === undefined || typeof manager.listPlugins !== 'function') {
    return {
      servers: [],
      problems: ['The pluginManager service is not available, so MCP rows cannot be read.'],
    };
  }

  let plugins = [];
  try {
    plugins = await manager.listPlugins();
  } catch (error) {
    return { servers: [], problems: [`Reading plugin rows failed: ${messageOf(error)}`] };
  }

  const rows = plugins.filter((entry) => entry?.moduleName === MCP_MODULE);

  const configs = new Map();
  const ownConfigs = new Map();
  const editor = ctx.get('configEditor');
  if (editor !== undefined && typeof editor.configuration === 'function') {
    try {
      for (const item of editor.configuration()) {
        const merged = { ...(item?.inherited ?? {}), ...(item?.override ?? {}) };
        for (const key of identityKeys(item)) configs.set(key, merged);
      }
    } catch (error) {
      problems.push(`Reading the patch layer failed: ${messageOf(error)}`);
    }
    try {
      if (typeof editor.entries === 'function') {
        for (const entry of editor.entries()) {
          const own = entry?.options?.config ?? entry?.config ?? null;
          if (own === null || typeof own !== 'object') continue;
          for (const key of identityKeys(entry)) ownConfigs.set(key, own);
        }
      }
    } catch (error) {
      problems.push(`Reading entry configs failed: ${messageOf(error)}`);
    }
  } else {
    problems.push('The configEditor service is not available, so endpoints are shown from row ids only.');
  }

  let toolNames = [];
  const tools = ctx.get('tools');
  if (tools !== undefined && typeof tools.schemas === 'function') {
    try {
      toolNames = tools.schemas().map((schema) => schema.name).filter((name) => typeof name === 'string');
    } catch (error) {
      problems.push(`Reading the tool registry failed: ${messageOf(error)}`);
    }
  }

  const servers = rows.map((row, index) => {
    const entryId = String(row.entryId ?? '');
    const patchId = row.patchId === undefined ? '' : String(row.patchId);
    const lookup = [entryId, patchId, `include:${patchId}`, `include:${entryId}`];
    let config;
    for (const key of lookup) {
      if (configs.has(key)) {
        config = configs.get(key);
        break;
      }
    }
    let own;
    for (const key of lookup) {
      if (ownConfigs.has(key)) {
        own = ownConfigs.get(key);
        break;
      }
    }
    if (own !== undefined) config = { ...(own ?? {}), ...(config ?? {}) };
    const cfg = config ?? {};
    // A server name decides which tools belong to the row, so prefer whichever
    // candidate the registered `mcp__<server>__<tool>` names actually agree with.
    const candidates = [];
    if (typeof cfg.serverName === 'string' && cfg.serverName !== '') candidates.push(cfg.serverName);
    const stripped = patchId.replace(/^mcp-/, '').replace(/-mcp$/, '');
    if (stripped !== '') candidates.push(stripped);
    let serverName = candidates.length > 0 ? candidates[candidates.length - 1] : `server-${String(index + 1)}`;
    let toolsForServer = [];
    for (const candidate of candidates) {
      const matches = toolNames.filter((name) => name.startsWith(`mcp__${candidate}__`));
      if (matches.length > toolsForServer.length) {
        serverName = candidate;
        toolsForServer = matches;
      }
    }
    const url = typeof cfg.url === 'string' ? cfg.url : '';
    const transport = typeof cfg.transport === 'string' && cfg.transport !== ''
      ? cfg.transport
      : url !== ''
        ? 'streamable-http'
        : 'stdio';
    const args = Array.isArray(cfg.args) ? cfg.args.map(plainValue) : [];
    const command = plainValue(cfg.command);
    const endpoint = transport === 'stdio'
      ? [command, ...args].filter((part) => part !== '').join(' ')
      : url;
    const env = cfg.env !== null && typeof cfg.env === 'object' && !Array.isArray(cfg.env)
      ? Object.keys(cfg.env)
      : [];

    return {
      entryId,
      patchId,
      serverName,
      transport,
      endpoint,
      envKeys: env,
      hasConfig: config !== undefined,
      toolCallTimeoutMs: typeof cfg.toolCallTimeoutMs === 'number' ? cfg.toolCallTimeoutMs : null,
      failOnStartupError: cfg.failOnStartupError === true,
      toolCount: toolsForServer.length,
      tools: toolsForServer.slice(0, 40),
      enabled: row.enabled === true,
      phase: typeof row.fiberPhase === 'string' ? row.fiberPhase : null,
    };
  });

  servers.sort((left, right) => left.serverName.localeCompare(right.serverName));
  return { servers, problems };
}

/** Flip one MCP row's enablement through the Plugin Manager's own path. */
async function setMcpEnabled(ctx, body) {
  const entryId = typeof body?.entryId === 'string' ? body.entryId : '';
  if (entryId === '') throw new Error('entryId is required');
  const enabled = body?.enabled === true;
  const manager = ctx.get('pluginManager');
  if (manager === undefined || typeof manager.setPluginEnabled !== 'function') {
    throw new Error('The pluginManager service is not available, so enablement cannot change.');
  }
  const { servers } = await listMcpServers(ctx);
  if (!servers.some((server) => server.entryId === entryId)) {
    throw new Error('That row is not an MCP server row.');
  }
  const result = await manager.setPluginEnabled(entryId, enabled);
  return { result };
}

/**
 * The directory whose project and user skill roots belong in this view. The
 * workbench panel owns no Session, so it falls back to the profile's default
 * working directory and lets the Client ask for another one.
 */
function defaultCwd(ctx) {
  const working = ctx.get('workingDirectory');
  const directory = working !== null && typeof working === 'object' ? working.defaultDirectory : undefined;
  return typeof directory === 'string' ? directory : '';
}

/**
 * Borrow the default Agent preset's scope for one read.
 *
 * Skill providers mounted by a preset's standing composition land in that
 * preset's layer, so the global layer alone shows only host-wide rows such as
 * the bundled packs. Borrowing the default preset's scope and releasing it makes
 * the read see the same catalog an Agent of this profile sees.
 *
 * @param ctx - plugin context used to reach `agentPresets`.
 * @param run - the read, called with the borrowed scope key (or `undefined`).
 */
async function withPresetScope(ctx, run) {
  const presets = ctx.get('agentPresets');
  let lease;
  if (presets !== undefined && typeof presets.resolve === 'function' && typeof presets.acquireScope === 'function') {
    try {
      const preset = await presets.resolve();
      lease = await presets.acquireScope(preset.id);
    } catch (error) {
      lease = undefined;
    }
  }
  try {
    return await run(lease === undefined ? undefined : lease.key);
  } finally {
    if (lease !== undefined && typeof lease[Symbol.asyncDispose] === 'function') {
      try {
        await lease[Symbol.asyncDispose]();
      } catch (error) {
        // Releasing a borrowed scope must not fail the read the caller asked for.
      }
    }
  }
}

/**
 * The single directory this workbench treats as the skill library
 * (`~/.agents/skills`). Skills mounted from anywhere else are out of scope.
 */
function skillsRoot() {
  return join(homedir(), '.agents', 'skills');
}

/** Test one skill location against one library prefix. */
function isInsideRoot(location, root) {
  if (typeof location !== 'string' || location === '') return false;
  const normalized = location.replace(/\\/g, '/').toLowerCase();
  const normalizedRoot = root.replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
  return normalized === normalizedRoot || normalized.startsWith(`${normalizedRoot}/`);
}

/**
 * Every path a skill may legitimately report for living in the library.
 *
 * A skill installed as a link — a junction into a package directory, for
 * instance — is found through its link but *reported* at its real location, so
 * both the folder path and the resolved target of each entry count.
 */
async function libraryPrefixes(root) {
  const prefixes = [root];
  try {
    prefixes.push(await realpath(root));
  } catch (error) {
    // An unresolvable root simply keeps the folder path alone.
  }
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    return prefixes;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = join(root, entry.name);
    prefixes.push(full);
    try {
      prefixes.push(await realpath(full));
    } catch (error) {
      // A dangling link contributes only its own path.
    }
  }
  return prefixes;
}

/** One skill library folder, optionally narrowed by a case-insensitive query. */
async function listSkills(ctx, query, cwd) {
  const skills = ctx.get('skills');
  if (skills === undefined || typeof skills.snapshot !== 'function') {
    return { skills: [], complete: false, root: skillsRoot(), scoped: false, problems: ['The skills service is not available.'] };
  }
  const problems = [];
  const directory = typeof cwd === 'string' && cwd !== '' ? cwd : defaultCwd(ctx);
  let scoped = false;
  let snapshot;
  try {
    snapshot = await withPresetScope(ctx, (scope) => {
      scoped = scope !== undefined;
      const view = directory === '' ? {} : { cwd: directory };
      if (scope !== undefined) view.scope = scope;
      return skills.snapshot(view);
    });
  } catch (error) {
    return {
      skills: [],
      complete: false,
      root: skillsRoot(),
      scoped,
      problems: [`Reading the skill catalog failed: ${messageOf(error)}`],
    };
  }
  const needle = (query ?? '').trim().toLowerCase();
  const items = (snapshot?.skills ?? []).map((skill) => ({
    name: String(skill.name ?? ''),
    description: String(skill.description ?? ''),
    whenToUse: typeof skill.whenToUse === 'string' ? skill.whenToUse : '',
    source: String(skill.source ?? ''),
    provider: String(skill.provider ?? ''),
    path: typeof skill.path === 'string' ? skill.path : '',
    modelInvocable: skill.invocation?.modelInvocable === true,
    userInvocable: skill.invocation?.userInvocable === true,
    resourceBase: skill.resourceBase?.kind === 'directory' ? skill.resourceBase.path : '',
  }));
  // Only this one folder is the workbench's skill library. Everything else -
  // bundled packs, package folders, project workspaces - is out of scope.
  const library = skillsRoot();
  const prefixes = await libraryPrefixes(library);
  const external = items.filter((skill) => {
    const location = skill.path !== '' ? skill.path : skill.resourceBase;
    return prefixes.some((prefix) => isInsideRoot(location, prefix));
  });
  const hiddenBundled = items.length - external.length;
  const filtered = needle === ''
    ? external
    : external.filter((skill) =>
      skill.name.toLowerCase().includes(needle) ||
      skill.description.toLowerCase().includes(needle) ||
      skill.source.toLowerCase().includes(needle));
  filtered.sort((left, right) => left.name.localeCompare(right.name));
  return {
    skills: filtered,
    hiddenBundled,
    root: library,
    complete: snapshot?.complete === true,
    scoped,
    problems,
  };
}

/** One skill's full definition, including its body. */
async function readSkill(ctx, name, cwd) {
  const skills = ctx.get('skills');
  if (skills === undefined || typeof skills.get !== 'function') {
    throw new Error('The skills service is not available.');
  }
  const directory = typeof cwd === 'string' && cwd !== '' ? cwd : defaultCwd(ctx);
  const skill = await withPresetScope(ctx, (scope) => {
    const view = directory === '' ? {} : { cwd: directory };
    if (scope !== undefined) view.scope = scope;
    return skills.get(name, view);
  });
  if (skill === undefined) throw new Error(`No skill named "${name}" is visible in this workspace.`);
  return {
    skill: {
      name: String(skill.name ?? name),
      description: String(skill.description ?? ''),
      whenToUse: typeof skill.whenToUse === 'string' ? skill.whenToUse : '',
      source: String(skill.source ?? ''),
      provider: String(skill.provider ?? ''),
      path: typeof skill.path === 'string' ? skill.path : '',
      modelInvocable: skill.invocation?.modelInvocable === true,
      userInvocable: skill.invocation?.userInvocable === true,
      resourceBase: skill.resourceBase?.kind === 'directory' ? skill.resourceBase.path : '',
      content: String(skill.content ?? ''),
    },
  };
}

/** Run one route body and answer with a JSON envelope either way. */
async function respond(res, job) {
  try {
    const value = await job();
    sendJson(res, 200, { ok: true, ...value });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: messageOf(error) });
  }
}

function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API_PREFIX}/mcp`,
    handler: (req, res) => {
      if (req.method === 'POST') {
        respond(res, async () => setMcpEnabled(ctx, await readBody(req)));
        return;
      }
      if (req.method === 'GET') {
        respond(res, () => listMcpServers(ctx));
        return;
      }
      res.writeHead(405, { allow: 'GET, POST' });
      res.end();
    },
  }), 'my-workbench: mcp route');

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API_PREFIX}/skills`,
    handler: (req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405, { allow: 'GET' });
        res.end();
        return;
      }
      respond(res, () => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        return listSkills(ctx, url.searchParams.get('q') ?? '', url.searchParams.get('cwd') ?? '');
      });
    },
  }), 'my-workbench: skills route');

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API_PREFIX}/skill`,
    handler: (req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405, { allow: 'GET' });
        res.end();
        return;
      }
      respond(res, () => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const name = url.searchParams.get('name') ?? '';
        if (name === '') throw new Error('The name query parameter is required.');
        return readSkill(ctx, name, url.searchParams.get('cwd') ?? '');
      });
    },
  }), 'my-workbench: skill route');

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: `${API_PREFIX}/usage`,
    handler: (req, res) => {
      if (req.method !== 'GET') {
        res.writeHead(405, { allow: 'GET' });
        res.end();
        return;
      }
      respond(res, () => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const days = Number(url.searchParams.get('days') ?? '7');
        return summarizeUsage({
          days: Number.isFinite(days) ? days : 7,
          model: url.searchParams.get('model') ?? '',
        });
      });
    },
  }), 'my-workbench: usage route');
}

export { apply, inject };
