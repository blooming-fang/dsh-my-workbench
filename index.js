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
 *   - `favorites` pins the plugins this profile runs into `favorites.json`
 *              beside this file, and installs them back through `pluginManager`
 *              so a new machine needs nothing but this workbench.
 *
 * Every service besides `webServer` is read through `ctx.get()` so this plugin
 * stays active in a Host composition that does not mount one of them.
 */

import { readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

/**
 * Read the profile's bundle list once, with the manager that produced it.
 *
 * `listBundles` answers one row per bundle this profile can manage — the shipped
 * ones, the on-demand catalog, and every third-party package the profile depends
 * on — each carrying its enablement, whether its files can be read, and the spec
 * `pnpm add` would take. A missing service is reported instead of thrown so the
 * panel can still render its other modules.
 *
 * @param ctx - plugin context used to reach `pluginManager`.
 */
async function readBundles(ctx) {
  const manager = ctx.get('pluginManager');
  if (manager === undefined || typeof manager.listBundles !== 'function') {
    return {
      manager: undefined,
      bundles: [],
      problems: ['The pluginManager service is not available, so external plugins cannot be listed.'],
    };
  }
  try {
    const bundles = await manager.listBundles();
    return { manager, bundles: Array.isArray(bundles) ? bundles : [], problems: [] };
  } catch (error) {
    return { manager, bundles: [], problems: [`Reading the plugin bundles failed: ${messageOf(error)}`] };
  }
}

/**
 * Text for a localised display value: a plain string, or the best of the
 * translations a package manifest may carry (Chinese first, then English, then
 * whichever language it happens to declare first).
 */
function displayText(value) {
  if (typeof value === 'string') return value.trim();
  if (value === null || typeof value !== 'object') return '';
  for (const language of ['zh', 'en']) {
    const chosen = value[language];
    if (typeof chosen === 'string' && chosen.trim() !== '') return chosen.trim();
  }
  for (const language of Object.keys(value)) {
    const chosen = value[language];
    if (typeof chosen === 'string' && chosen.trim() !== '') return chosen.trim();
  }
  return '';
}

/** The parts of a Plugin Manager change result the panel reports. */
function changeOf(result) {
  const value = result ?? {};
  return {
    application: typeof value.application === 'string' ? value.application : '',
    restartReason: typeof value.restartReason === 'string' ? value.restartReason : '',
    changed: value.changed === true,
    enabled: value.enabled === true,
    code: typeof value.error?.code === 'string' ? value.error.code : '',
    diagnostic: typeof value.error?.diagnostic === 'string' ? value.error.diagnostic : '',
  };
}

/** Failure codes the Plugin Manager may answer with, in the order they are looked for. */
const FAILURE_CODES = [
  'already-installed',
  'not-removable',
  'bundle-in-use',
  'incompatible-version',
  'unsupported-platform',
  'invalid-spec',
  'not-bundle',
  'stale-approval',
  'stop-profile',
  'ambiguous-install',
  'management-required',
  'unaddressable',
  'unknown-plugin',
  'operation-error',
];

/** The Plugin Manager's failure code for a thrown value, when it carries one. */
function failureCodeOf(error) {
  const seen = [error?.code, error?.data?.code, error?.details?.code, error?.cause?.code]
    .filter((candidate) => typeof candidate === 'string' && candidate !== '');
  for (const candidate of seen) {
    for (const code of FAILURE_CODES) {
      if (candidate === code || candidate.endsWith(`/${code}`)) return code;
    }
  }
  const text = messageOf(error);
  for (const code of FAILURE_CODES) {
    if (text.includes(code)) return code;
  }
  return '';
}

/**
 * The favourites file: the pins this plugin carries with it.
 *
 * The list is a snapshot, not a live query — it is written once by **Sync** and
 * then read verbatim, so a new machine that installs nothing but this workbench
 * still sees the same set of plugins. It lives next to `index.js` inside the
 * package, which is what makes it travel: the package is installed from git or
 * from a folder, so the file ships with the code.
 */
const FAVORITES_FILE = new URL('./favorites.json', import.meta.url);

/** This plugin's own package name, so a snapshot never pins the workbench itself. */
async function ownPackageName() {
  try {
    const manifest = JSON.parse(await readFile(new URL('./package.json', import.meta.url), 'utf8'));
    return typeof manifest?.name === 'string' ? manifest.name : '';
  } catch (error) {
    return '';
  }
}

/**
 * One snapshot row from a live bundle.
 *
 * A row is a package name plus the words that describe it — no version and no
 * install path. Installing a favourite means `pnpm add <name>`, so every pinned
 * plugin comes back at whatever the registry publishes as latest; pinning would
 * only make a new machine drag an old copy along.
 */
function favouriteOf(bundle) {
  return {
    name: String(bundle?.name ?? ''),
    title: displayText(bundle?.meta?.title),
    description: displayText(bundle?.meta?.description)
      || (typeof bundle?.description === 'string' ? bundle.description.trim() : ''),
  };
}

/** One stored row; anything but a package name is dropped. */
function normaliseFavourite(raw) {
  const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
  if (name === '') return undefined;
  return {
    name,
    title: typeof raw?.title === 'string' ? raw.title : '',
    description: typeof raw?.description === 'string' ? raw.description : '',
  };
}

/** The stored snapshot, or null when nothing was pinned yet. */
async function readFavourites() {
  let raw;
  try {
    raw = await readFile(FAVORITES_FILE, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return { snapshot: null, problem: '' };
    return { snapshot: null, problem: `Reading favorites.json failed: ${messageOf(error)}` };
  }
  try {
    const parsed = JSON.parse(raw);
    const plugins = (Array.isArray(parsed?.plugins) ? parsed.plugins : [])
      .map(normaliseFavourite)
      .filter((entry) => entry !== undefined);
    const excluded = (Array.isArray(parsed?.exclude) ? parsed.exclude : [])
      .filter((name) => typeof name === 'string')
      .map((name) => name.trim())
      .filter((name) => name !== '');
    return {
      snapshot: {
        capturedAt: typeof parsed?.capturedAt === 'string' ? parsed.capturedAt : '',
        plugins,
        excluded,
      },
      problem: '',
    };
  } catch (error) {
    return { snapshot: null, problem: `favorites.json is not valid JSON: ${messageOf(error)}` };
  }
}

/** Write the snapshot back, keeping the exclusion list in file order. */
async function writeFavourites(plugins, excluded) {
  const snapshot = {
    version: 1,
    capturedAt: new Date().toISOString(),
    plugins: plugins.map((entry) => ({ name: entry.name, title: entry.title, description: entry.description })),
    ...excluded.length === 0 ? {} : { exclude: excluded },
  };
  await writeFile(FAVORITES_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return snapshot;
}

/**
 * Pin the plugins this profile runs right now.
 *
 * Everything switched on in the profile manifest is captured except the rows
 * the DSH installation itself supplies — those arrive with any fresh Harness and
 * are not something a new machine has to install — and except this workbench,
 * which is the thing doing the installing.
 *
 * @param ctx - plugin context used to reach `pluginManager`.
 */
async function captureFavourites(ctx) {
  const { bundles, problems } = await readBundles(ctx);
  if (bundles.length === 0) {
    throw new Error(problems.length > 0 ? problems.join(' ') : 'This profile reports no plugin bundles.');
  }
  const own = await ownPackageName();
  const { snapshot: stored } = await readFavourites();
  const excluded = stored?.excluded ?? [];
  const plugins = bundles
    .filter((bundle) => bundle?.enabled === true)
    .filter((bundle) => bundle?.availability !== 'installation')
    .map((bundle) => favouriteOf(bundle))
    .filter((entry) => entry.name !== '' && entry.name !== own && !excluded.includes(entry.name));
  plugins.sort((left, right) => left.name.localeCompare(right.name));
  return await writeFavourites(plugins, excluded);
}

/**
 * Take one plugin out of the pin, and keep it out.
 *
 * Removing the row alone would last only until the next Sync, which re-reads
 * what the profile runs; the name therefore also joins the exclusion list that
 * Sync consults. Editing the file by hand remains the way back in.
 */
async function removeFavourite(ctx, name) {
  const { snapshot } = await readFavourites();
  const plugins = (snapshot?.plugins ?? []).filter((entry) => entry.name !== name);
  const excluded = snapshot?.excluded ?? [];
  if (!excluded.includes(name)) excluded.push(name);
  const written = await writeFavourites(plugins, excluded);
  return { status: 'removed', name, count: written.plugins.length, capturedAt: written.capturedAt };
}

/**
 * The pinned list, each row told what this profile already has.
 *
 * @param ctx - plugin context used to reach `pluginManager`.
 */
async function listFavourites(ctx) {
  const { snapshot, problem } = await readFavourites();
  const { bundles, problems } = await readBundles(ctx);
  const live = new Map(bundles.map((bundle) => [String(bundle?.name ?? ''), bundle]));
  const plugins = (snapshot?.plugins ?? []).map((entry) => {
    const bundle = live.get(entry.name);
    const installed = bundle?.installed === true;
    const availability = typeof bundle?.availability === 'string' ? bundle?.availability : '';
    const ready = installed && availability !== 'missing';
    return {
      name: entry.name,
      title: entry.title,
      description: entry.description,
      installSpec: entry.name,
      installed,
      enabled: bundle?.enabled === true,
      availability,
      currentVersion: typeof bundle?.version === 'string' ? bundle.version : '',
      action: ready ? 'installed' : 'install',
    };
  });
  return {
    capturedAt: snapshot?.capturedAt ?? '',
    excluded: snapshot?.excluded ?? [],
    filePath: fileURLToPath(FAVORITES_FILE),
    plugins,
    pending: plugins.filter((plugin) => plugin.action !== 'installed').length,
    problems: [...problems, ...(problem === '' ? [] : [problem])],
  };
}

/**
 * Install one pinned plugin from the spec a new machine can use.
 *
 * A dependency the profile already declares cannot be installed a second time,
 * which the manager reports as `already-installed`; that answer is passed back
 * as a result rather than an error, because asking to install something that is
 * installed is a reasonable thing to do. A declared package whose files can no
 * longer be read is removed first so the source installs it afresh — the same
 * order the manager's own update flow takes.
 *
 * @param ctx - plugin context used to reach `pluginManager`.
 * @param entry - one pinned row.
 */
async function installFavourite(ctx, entry) {
  const { manager, bundles } = await readBundles(ctx);
  if (manager === undefined || typeof manager.installBundle !== 'function') {
    throw new Error('The pluginManager service is not available, so nothing can be installed.');
  }
  const spec = entry.name;
  let repaired = false;
  const bundle = bundles.find((candidate) => String(candidate?.name ?? '') === entry.name);
  if (bundle?.installed === true && bundle?.availability === 'missing') {
    if (bundle?.removable !== true || typeof manager.removeBundle !== 'function') {
      throw new Error(`"${entry.name}" has unreadable files that this profile cannot remove, so it cannot be installed again.`);
    }
    const removal = changeOf(await manager.removeBundle(entry.name));
    if (removal.code !== '') {
      const detail = removal.diagnostic === '' ? '' : ` · ${removal.diagnostic}`;
      throw new Error(`Removing the unreadable copy of "${entry.name}" failed: ${removal.code}${detail}`);
    }
    repaired = true;
  }
  let change;
  try {
    change = changeOf(await manager.installBundle(spec, { enabled: true }));
  } catch (error) {
    if (failureCodeOf(error) === 'already-installed') {
      return { status: 'already-installed', name: entry.name, spec, repaired, change: changeOf(null) };
    }
    throw new Error(`Installing ${entry.name} (latest) failed: ${messageOf(error)}`);
  }
  if (change.code === 'already-installed') return { status: 'already-installed', name: entry.name, spec, repaired, change };
  if (change.code !== '') return { status: 'failed', name: entry.name, spec, repaired, change };
  return { status: 'installed', name: entry.name, spec, repaired, change };
}

/** Install every pinned plugin this profile is missing, one after another. */
async function installAllFavourites(ctx) {
  const { plugins } = await listFavourites(ctx);
  const results = [];
  for (const plugin of plugins) {
    if (plugin.action === 'installed') continue;
    try {
      const result = await installFavourite(ctx, plugin);
      results.push({ ok: result.status !== 'failed', name: plugin.name, status: result.status, spec: result.spec, detail: result.change?.diagnostic ?? '' });
    } catch (error) {
      results.push({ ok: false, name: plugin.name, status: 'failed', spec: plugin.installSpec, detail: messageOf(error) });
    }
  }
  const failed = results.filter((result) => result.ok !== true).length;
  return { results, installed: results.length - failed, failed };
}

/** One write on the favourites route: pin the current plugins, or install one or all of them. */
async function actOnFavourites(ctx, body) {
  const action = typeof body?.action === 'string' && body.action !== '' ? body.action : 'install';
  if (action === 'capture') {
    const snapshot = await captureFavourites(ctx);
    return { status: 'captured', capturedAt: snapshot.capturedAt, count: snapshot.plugins.length, plugins: snapshot.plugins.map((entry) => entry.name) };
  }
  if (action === 'remove') {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (name === '') throw new Error('name is required');
    return await removeFavourite(ctx, name);
  }
  if (action === 'install-all') return { status: 'installed-all', ...(await installAllFavourites(ctx)) };
  if (action === 'install') {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (name === '') throw new Error('name is required');
    const { snapshot } = await readFavourites();
    const entry = (snapshot?.plugins ?? []).find((candidate) => candidate.name === name);
    if (entry === undefined) throw new Error(`"${name}" is not in the favourites list. Run Sync first.`);
    return await installFavourite(ctx, entry);
  }
  throw new Error(`Unknown favourites action: ${action}`);
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
    path: `${API_PREFIX}/favorites`,
    handler: (req, res) => {
      if (req.method === 'POST') {
        respond(res, async () => actOnFavourites(ctx, await readBody(req)));
        return;
      }
      if (req.method === 'GET') {
        respond(res, () => listFavourites(ctx));
        return;
      }
      res.writeHead(405, { allow: 'GET, POST' });
      res.end();
    },
  }), 'my-workbench: favorites route');
}

export { apply, inject };
