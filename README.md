# dsh-my-workbench

A left-sidebar workbench for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)
(DSH): one panel that reports token usage, manages MCP servers, and lists the
skills in a chosen folder. It is a DSH bundle — a Host half plus a web Client
half — so it installs through the Plugin Manager like any other package.

工作台插件：左侧栏入口 + 中央面板，包含「用量」「MCP 服务」「技能」三个模块。

## Modules

| Tab | What it shows | Source |
|---|---|---|
| **Usage** (default) | Per-day token totals over the last 7/30/90 days: uncached input, output, cache read, reasoning, both range totals, cache hit rate, message and session counts, plus a per-day table | `session.v*.jsonl.zstd` logs under `$DSH_HOME/sessions` |
| **MCP servers** | Every configured `dsh-mcp-client` row with its transport, endpoint, tool count, and live state, and a switch that enables or disables that row | `pluginManager` + the Loader patch layer |
| **Skills** | The skills found in `~/.agents/skills` only, with search, source badges, and the full `SKILL.md` body | `skills` service, read through the default Agent preset's scope |

Adding a module means one Host route in `index.js` and one entry in the
`MODULES` table in `client.js`.

## Install

From this checkout, in a DSH session:

```
plugin_manager action=install_bundle target=<absolute path to this folder>
```

The bundle's own `cordis.patch.yml` inserts the `my-workbench` row, so the
profile does not need a patch entry of its own. Editing a linked checkout plus
toggling the plugin off and on picks up the new code.

## Counting notes

- `inputTokens` from the provider excludes cache hits, so the Usage tab reports
  cache reads beside it rather than folding them in. `total = input + output +
  reasoning`; the with-cache total adds cache reads and writes back
  (the semantics match `@deepseek-ai/dsh-token-meter`).
- Session logs are a chain of independently flushed zstd frames. Some runtimes
  decode only the first frame in a single call, so `usage.js` decodes every
  frame separately and concatenates the results.
- Usage figures are derived from local session logs, cached per file by
  modification time and size in `$DSH_HOME/state/my-workbench/usage-cache.json`.
  The first look at a long window is folded in bounded slices and the panel
  keeps asking until nothing is pending.

## Layout

```
index.js          Host half: routes under /api/my-workbench
usage.js          Log scan, frame-aware zstd decode, per-day fold, cache
client.js         Client half: sidebar entry, panel, module tabs
cordis.patch.yml  Bundle patch row
locale/           Plugin Manager title and description
icon.svg          Plugin artwork
```

## Licence

MIT
