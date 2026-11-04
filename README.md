# dsh-my-workbench（我的工作台）

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的左侧栏工作台插件：
在左侧栏加一个入口，点开是一块管理面板，把「用了多少 token」「连了哪些 MCP」「有哪些技能」
集中在一处查看。

插件是标准的 DSH bundle（Host 半边 + Web Client 半边），装法与其它插件一致，走插件管理器即可。

## 仓库

两处同源，保持同步：

- GitHub：<https://github.com/blooming-fang/dsh-my-workbench>
- Gitee（镜像）：<https://gitee.com/fang-wensheng/dsh-my-workbench>

本仓库配了两个远程源（`origin` → GitHub，`gitee` → Gitee），并带一个 `git pushall` 别名，
一次推两处：

```
git pushall      # 等价于 git push origin main && git push gitee main
```


## 三个模块

| 标签页 | 显示什么 | 数据来源 |
|---|---|---|
| **用量**（默认） | 近 7 / 30 / 90 天按天统计的 token：未命中缓存的输入、输出、缓存读、推理，两个区间合计（不含缓存 / 含缓存）、缓存命中率、消息数、会话数，以及按天明细表；可按模型筛选 | `$DSH_HOME/sessions` 下的 `session.v*.jsonl.zstd` 会话日志 |
| **MCP 服务** | 配置里的每一条 `dsh-mcp-client`：传输方式、启动命令或 URL、工具数、当前连接状态，并带一个开关可直接启用/停用该行 | `pluginManager` 服务 + Loader 补丁层 |
| **技能** | 只列 `~/.agents/skills` 这一个目录下的技能，支持搜索、来源标记、查看完整 `SKILL.md` | `skills` 服务（按默认 Agent 预设的作用域读取） |

想加新模块：Host 侧在 `index.js` 加一条路由，客户端在 `client.js` 的 `MODULES` 表里加一项即可。

## 安装

在 DSH 会话里执行（`target` 填本目录的绝对路径）：

```
plugin_manager action=install_bundle target=<本目录绝对路径>
```

插件自带的 `cordis.patch.yml` 会插入 `my-workbench` 这一行，profile 不需要再单独写补丁。
以目录链接方式安装时，改完源码把插件「关 → 开」一下就会加载新代码。

## 统计口径

- 用量里的「输入」只计**未命中缓存**的提示 token，缓存读单独一列（与
  `@deepseek-ai/dsh-token-meter` 的口径一致：`inputTokens` 不含 cache read）。
  `合计 = 输入 + 输出 + 推理`；`含缓存合计 = 合计 + 缓存读 + 缓存写`。
- 会话日志是一串**独立 flush 的 zstd 帧**拼接而成，部分运行时单次解码只读第一帧
  （表现为只有会话头、用量全 0），所以 `usage.js` 按帧魔数切分、逐帧解码后再拼接。
- 用量数据取自本地会话日志，按文件修改时间 + 大小做增量缓存，落在
  `$DSH_HOME/state/my-workbench/usage-cache.json`（纯派生数据，删掉只是重算一次）。
  首次查看长区间会分批折叠并显示「正在扫描历史会话日志…」，扫完即秒开。
- 技能目录里的条目可能是 junction / 软链接（例如 ego lite 把 `ego-browser` 链接进来）。
  这类技能被发现时走链接，但上报的路径是解析后的真实位置，因此判定时会把每个目录项的
  realpath 一起纳入前缀比较，链接安装的技能同样会显示。

## 目录结构

```
index.js          Host 半边：/api/my-workbench 下的各条路由
usage.js          会话日志扫描、按帧解码 zstd、按天（及按模型）折叠、增量缓存
client.js         客户端半边：左侧栏入口、面板、三个模块
cordis.patch.yml  bundle 补丁行
locale/           插件管理页显示的标题与描述
icon.svg          插件图标
```

## 许可

MIT
