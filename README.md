# dsh-my-workbench（我的工作台）

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的左侧栏工作台插件：
在左侧栏加一个入口，点开是一块管理面板，把「固定在用的插件」「连了哪些 MCP」「有哪些技能」
集中在一处查看。换电脑时只装这一个插件，收藏里的插件可以一键装回来。

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
| **收藏**（默认） | 固定下来的一份插件清单：包名、标题、说明、当前装的版本，每行一个「安装」，顶上两个按钮「同步当前插件」「全部安装」 | 插件目录的 `favorites.json`（同步时用 `pluginManager.listBundles()` 采集） |
| **MCP 服务** | 配置里的每一条 `dsh-mcp-client`：传输方式、启动命令或 URL、工具数、当前连接状态，并带一个开关可直接启用/停用该行 | `pluginManager` 服务 + Loader 补丁层 |
| **技能** | 只列 `~/.agents/skills` 这一个目录下的技能，支持搜索、来源标记、查看完整 `SKILL.md` | `skills` 服务（按默认 Agent 预设的作用域读取） |

想加新模块：Host 侧在 `index.js` 加一条路由，客户端在 `client.js` 的 `MODULES` 表里加一项即可。

## 收藏是一份快照，不是一次查询

列表就是插件目录里的 `favorites.json`，**点「同步当前插件」写一次，之后原样读**——所以它随插件本身走：

- 换电脑时只装这一个工作台，收藏列表就跟着代码回来了；
- 点「全部安装」，缺哪个装哪个，一次补齐；
- 平时改了插件，再点一次同步覆盖即可（旧的会被替换，这是「固定」的意思）。

**收录什么**：当前 profile 里已启用（`dsh.profile.bundles` 选中）的插件，去掉两类——
DSH 安装自带的 bundle（新机器上本来就有，不用再装），以及工作台自己。

**每条记什么**：只有**包名**，加上标题和说明。**不记版本、不记路径。**

安装就是 `pnpm add <包名>`，一律取 registry 上的**最新版本**——钉版本只会让新电脑拖回一份旧的。

**点「安装」的三种结果**：

| 情况 | 行为 |
|---|---|
| 已经装好 | 插件管理器回 `already-installed`，面板当成正常结果提示「已安装，无需重复安装」 |
| 依赖还在但文件读不到（`availability: missing`） | 先 `removeBundle()` 再按包名重装，成功时提示「已重新装好」 |
| 失败 | 红色提示，带 pnpm 给出的原因 |

## 安装

三种装法效果一样，都会把 `my-workbench` 这一行插进 profile：

- **从 npm**（发给别人用这个）：
  ```
  plugin_manager action=install_bundle target=dsh-my-workbench
  ```
  也可以在插件页 / 插件市场里搜 `dsh-my-workbench`。
- **本地目录**：
  ```
  plugin_manager action=install_bundle target=<本目录绝对路径>
  ```
- **手改 profile**：`dependencies` 加 `"dsh-my-workbench": "^1.0.0"`，`dsh.profile.bundles` 里追加 `"dsh-my-workbench"`。

以目录链接方式安装时，改完源码把插件「关 → 开」一下（或重启 Harness）就会加载新代码。

## 发布到 npm

```bash
npm run check        # node --check index.js && node --check client.js
npm pack --dry-run   # 看包里有什么：10 个文件、约 26 kB
npm publish          # prepublishOnly 会先跑一次 check
```

- 包名 `dsh-my-workbench` 在 npm 上还没被占。
- `engines.dsh` 写成 `>=0.2.0-rc.1 || >=0.2.1-rc.1 || >=0.2.2-rc.1`：semver 规定预发布版本只匹配「同一版本元组」的预发布区间，
  所以逐段列出，0.2.0-rc.1 / 0.2.1-x / 0.2.2-x 全系列都能装，0.1.7 会被拦下。
- 包里带上了 `favorites.json`，也就是**发布者自己的**插件清单。自用换机没问题；想让别的用户从空白开始，
  发布前把 `favorites.json` 改成 `{ "version": 1, "capturedAt": "", "plugins": [] }` 即可。
- 没有构建步骤：`index.js` 是 Host 半边（ESM），`client.js` 是浏览器端 `window.__ModuleLoader__` 格式，
  装完即可用，`files` 白名单保证只发布这 10 个文件。

## 几处细节

- 技能目录里的条目可能是 junction / 软链接（例如 ego lite 把 `ego-browser` 链接进来）。
  这类技能被发现时走链接，但上报的路径是解析后的真实位置，因此判定时会把每个目录项的
  realpath 一起纳入前缀比较，链接安装的技能同样会显示。

## 目录结构

```
index.js          Host 半边：/api/my-workbench 下的各条路由
client.js         客户端半边：左侧栏入口、面板、三个模块
favorites.json    收藏快照：当前在用的插件清单，随插件一起走
cordis.patch.yml  bundle 补丁行
locale/           插件管理页显示的标题与描述
icon.svg          插件图标
```

## 许可

MIT
