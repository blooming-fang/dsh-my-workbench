window.__ModuleLoader__.load({
  id: 'dsh-my-workbench',
  factory(require) {
    var React = require('react');
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useCallback = React.useCallback;
    var useMemo = React.useMemo;

    /** Locale namespace and main-panel key: one identity addresses the sidebar entry and the panel. */
    var NS = 'dsh-my-workbench';
    var PANEL_ID = 'my-workbench';
    var API = '/api/my-workbench';

    var ZH = {
      'panel.label': '我的工作台',
      'page.title': '我的工作台',
      'page.subtitle': '在一处查看 Harness 的外置插件、MCP 服务与技能。',
      'tab.mcp': 'MCP 服务',
      'tab.skills': '技能',
      'tab.favorites': '收藏',
      'common.refresh': '刷新',
      'common.retry': '重试',
      'common.loading': '正在载入…',
      'common.empty': '没有匹配的条目',
      'common.back': '返回列表',
      'common.search': '搜索',
      'mcp.search': '按名称、地址或备注筛选',
      'mcp.summary': '个服务',
      'mcp.enabledCount': '已启用',
      'mcp.tools': '工具',
      'mcp.noEndpoint': '未在补丁层中找到端点信息',
      'mcp.env': '环境变量',
      'mcp.timeout': '调用超时',
      'mcp.strict': '启动失败即报错',
      'mcp.restart': '重启生效',
      'mcp.toggleOn': '启用',
      'mcp.toggleOff': '停用',
      'mcp.loadFailed': '读取 MCP 服务失败',
      'mcp.none': '当前配置里没有 MCP 服务。在 profile 的 cordis.patch.yml 中插入 dsh-mcp-client 行即可出现。',
      'mcp.changed': '设置已保存',
      'phase.active': '已连接',
      'phase.failed': '启动失败',
      'phase.pending': '连接中',
      'phase.loading': '连接中',
      'phase.unknown': '状态未知',
      'state.disabled': '已停用',
      'state.enabled': '运行中',
      'application.applied': '已生效',
      'application.restart-required': '需要重启 Harness 后生效',
      'application.overridden': '被更高优先级配置覆盖',
      'application.failed': '应用失败',
      'application.cancelled': '已取消',
      'skills.search': '按名称、来源或描述筛选',
      'skills.summary': '个技能',
      'skills.incomplete': '技能目录尚未完整发现，结果可能不全。',
      'skills.loadFailed': '读取技能失败',
      'skills.view': '查看',
      'skills.none': '该目录下还没有技能。',
      'skills.body': '技能内容',
      'skills.root': '技能目录',
      'skills.hiddenBundled': '已隐藏该目录以外的技能',
      'skills.onlyBundled': '此预设没有加载该目录下的技能。',
      'skills.modelOnly': '模型可调用',
      'skills.userOnly': '仅用户调用',
      'skills.both': '模型与用户均可调用',
      'skills.path': '路径',
      'skills.provider': '来源',
      'skills.whenToUse': '适用场景',
      'source.project-dsh': '项目',
      'source.project-agents': '项目 (agents)',
      'source.user-dsh': '用户',
      'source.user-agents': '用户 (agents)',
      'source.runtime': '运行时',
      'source.bundled': '内置',
      'source.custom': '自定义',
      'fav.search': '按名称或说明筛选',
      'fav.summary': '个插件',
      'fav.loadFailed': '读取收藏失败',
      'fav.none': '收藏还是空的。点「同步当前插件」，把当前已启用的插件固定成这份收藏。',
      'fav.capture': '同步当前插件',
      'fav.capturing': '正在同步…',
      'fav.captured': '已收藏 {{n}} 个插件',
      'fav.captureHint': '「同步」把当前 profile 里已启用的插件（不含 DSH 自带的行）写进插件目录的 favorites.json。收藏只记包名，安装时一律取 registry 上的最新版本；换电脑时只需安装这个工作台，收藏就跟着回来，再一键装齐。',
      'fav.install': '安装',
      'fav.installing': '安装中…',
      'fav.installed': '安装完成',
      'fav.alreadyInstalled': '已安装，无需重复安装',
      'fav.repaired': '已重新装好',
      'fav.failed': '安装失败',
      'fav.installAll': '全部安装',
      'fav.installingAll': '正在安装…',
      'fav.allDone': '全部安装结束：成功 {{ok}} 个，失败 {{bad}} 个',
      'fav.stateInstalled': '已安装',
      'fav.stateMissing': '文件缺失',
      'fav.stateAbsent': '未安装',
      'fav.source': '安装源',
      'fav.capturedAt': '收藏于 {{at}}',
      'fav.file': '文件',
      'fav.pending': '待装 {{n}} 个',
    };

    var EN = {
      'panel.label': 'My Workbench',
      'page.title': 'My Workbench',
      'page.subtitle': 'This Harness’s external plugins, MCP servers, and skills in one place.',
      'tab.mcp': 'MCP servers',
      'tab.skills': 'Skills',
      'tab.favorites': 'Favorites',
      'common.refresh': 'Refresh',
      'common.retry': 'Retry',
      'common.loading': 'Loading…',
      'common.empty': 'Nothing matches',
      'common.back': 'Back to the list',
      'common.search': 'Search',
      'mcp.search': 'Filter by name, endpoint, or note',
      'mcp.summary': 'servers',
      'mcp.enabledCount': 'enabled',
      'mcp.tools': 'tools',
      'mcp.noEndpoint': 'No endpoint was found in the patch layer',
      'mcp.env': 'Environment',
      'mcp.timeout': 'Call timeout',
      'mcp.strict': 'Fails on startup error',
      'mcp.restart': 'Restart required',
      'mcp.toggleOn': 'Enable',
      'mcp.toggleOff': 'Disable',
      'mcp.loadFailed': 'Reading MCP servers failed',
      'mcp.none': 'This profile configures no MCP server yet. Insert a dsh-mcp-client row in the profile’s cordis.patch.yml.',
      'mcp.changed': 'Setting saved',
      'phase.active': 'Connected',
      'phase.failed': 'Startup failed',
      'phase.pending': 'Connecting',
      'phase.loading': 'Connecting',
      'phase.unknown': 'Unknown state',
      'state.disabled': 'Disabled',
      'state.enabled': 'Running',
      'application.applied': 'Applied',
      'application.restart-required': 'Takes effect after a Harness restart',
      'application.overridden': 'Overridden by a higher-priority layer',
      'application.failed': 'Could not be applied',
      'application.cancelled': 'Cancelled',
      'skills.search': 'Filter by name, source, or description',
      'skills.summary': 'skills',
      'skills.incomplete': 'Skill discovery is incomplete, so this list may be partial.',
      'skills.loadFailed': 'Reading skills failed',
      'skills.view': 'View',
      'skills.none': 'No skill in that folder yet.',
      'skills.body': 'Skill content',
      'skills.root': 'Skill folder',
      'skills.hiddenBundled': 'Skills outside that folder are hidden',
      'skills.onlyBundled': 'This preset does not mount any skill from that folder.',
      'skills.modelOnly': 'Model-invocable',
      'skills.userOnly': 'User-invocable',
      'skills.both': 'Model and user invocable',
      'skills.path': 'Path',
      'skills.provider': 'Provider',
      'skills.whenToUse': 'When to use',
      'source.project-dsh': 'Project',
      'source.project-agents': 'Project (agents)',
      'source.user-dsh': 'User',
      'source.user-agents': 'User (agents)',
      'source.runtime': 'Runtime',
      'source.bundled': 'Bundled',
      'source.custom': 'Custom',
      'fav.search': 'Filter by name or description',
      'fav.summary': 'plugins',
      'fav.loadFailed': 'Reading favourites failed',
      'fav.none': 'Nothing is pinned yet. Use Sync to fix the plugins this profile runs into this list.',
      'fav.capture': 'Sync current plugins',
      'fav.capturing': 'Syncing…',
      'fav.captured': 'Pinned {{n}} plugins',
      'fav.captureHint': 'Sync writes the plugins this profile has enabled (the rows DSH itself ships are left out) into favorites.json inside this plugin. A pin records only the package name, and installing takes whatever the registry publishes as latest; a new machine only needs this workbench: the list comes with it, and one click installs them back.',
      'fav.install': 'Install',
      'fav.installing': 'Installing…',
      'fav.installed': 'Installed',
      'fav.alreadyInstalled': 'Already installed',
      'fav.repaired': 'Reinstalled over the unreadable copy',
      'fav.failed': 'Install failed',
      'fav.installAll': 'Install all',
      'fav.installingAll': 'Installing…',
      'fav.allDone': 'Install all finished: {{ok}} installed, {{bad}} failed',
      'fav.stateInstalled': 'Installed',
      'fav.stateMissing': 'Files missing',
      'fav.stateAbsent': 'Not installed',
      'fav.source': 'Install source',
      'fav.capturedAt': 'Pinned {{at}}',
      'fav.file': 'File',
      'fav.pending': '{{n}} to install',
    };

    /** Text for a thrown value. */
    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    /** One Host call on the workbench API; every failure becomes a thrown Error with a readable message. */
    async function api(path, options) {
      var settings = options || {};
      var response = await fetch(API + path, {
        method: settings.method || 'GET',
        credentials: 'same-origin',
        headers: settings.body === undefined ? undefined : { 'content-type': 'application/json' },
        body: settings.body,
      });
      var data = null;
      try {
        data = await response.json();
      } catch (error) {
        data = null;
      }
      if (!response.ok || data === null || data.ok !== true) {
        var detail = data && (data.error || data.message);
        throw new Error(detail || ('HTTP ' + String(response.status)));
      }
      return data;
    }

    var CSS = [
      // Two surface steps of this panel: `--wb-surface` is the raised card tone
      // and `--wb-well` is the recessed tone used inside a card. They are bound
      // to host tokens so the panel follows every theme, and they are separate
      // variables because a theme may render bg-base and bg-layer-1 identically,
      // which would make a card vanish into the page.
      '.wb-root{--wb-surface:var(--dsw-alias-bg-layer-2);--wb-well:var(--dsw-alias-bg-base);box-sizing:border-box;height:100%;overflow:auto;scrollbar-gutter:stable;padding:28px clamp(24px,4vw,48px) 0;color:var(--dsw-alias-label-primary)}',
      '.wb-inner{display:flex;flex-direction:column;gap:18px;width:100%;max-width:1000px;margin:0 auto;padding-bottom:56px}',
      '.wb-header h1{margin:0;font-size:22px;font-weight:600;letter-spacing:.01em}',
      '.wb-header p{margin:6px 0 0;font-size:13px;line-height:1.65;color:var(--dsw-alias-label-secondary);max-width:70ch}',
      '.wb-tabs{display:inline-flex;gap:4px;padding:4px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface);align-self:flex-start}',
      '.wb-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:1.2;padding:8px 16px;border-radius:9px;cursor:pointer}',
      '.wb-tab:hover{color:var(--dsw-alias-label-primary)}',
      '.wb-tab[aria-selected="true"]{background:var(--wb-well);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1)}',
      '.wb-tab:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.wb-body{display:flex;flex-direction:column;gap:14px}',
      '.wb-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px}',
      '.wb-bar .wb-count{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.wb-spacer{flex:1 1 auto}',
      '.wb-input{min-height:34px;min-width:220px;padding:0 12px;border-radius:9px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface);color:inherit;font:inherit;font-size:13px}',
      '.wb-input:focus{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:-1px}',
      '.wb-cwd{margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.wb-btn{appearance:none;font:inherit;font-size:13px;padding:7px 14px;border-radius:9px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface);color:var(--dsw-alias-label-primary)}',
      '.wb-btn:hover{border-color:var(--dsw-alias-border-l2)}',
      '.wb-btn:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.wb-btn[disabled]{opacity:.55;cursor:default}',
      '.wb-btn.wb-primary{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}',
      '.wb-card{display:flex;flex-direction:column;gap:10px;padding:14px 16px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface)}',
      '.wb-card-head{display:flex;align-items:flex-start;gap:14px}',
      '.wb-card-title{display:flex;flex-wrap:wrap;align-items:center;gap:8px;min-width:0}',
      '.wb-name{font-size:14px;font-weight:600}',
      '.wb-sub{font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.wb-side{display:flex;align-items:center;gap:10px;margin-left:auto;flex:none}',
      '.wb-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;line-height:1;padding:4px 8px;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.wb-badge.is-success{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}',
      '.wb-badge.is-error{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}',
      '.wb-badge.is-warn{color:var(--dsw-alias-state-warn-primary);border-color:var(--dsw-alias-state-warn-primary)}',
      '.wb-badge.is-idle{color:var(--dsw-alias-state-idle-primary)}',
      '.wb-dot{width:6px;height:6px;border-radius:999px;background:currentColor}',
      '.wb-endpoint{display:block;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.6;padding:8px 10px;border-radius:8px;background:var(--wb-well);color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere;white-space:pre-wrap}',
      '.wb-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:var(--dsw-alias-label-secondary)}',
      '.wb-meta code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px}',
      '.wb-switch{appearance:none;flex:none;width:38px;height:22px;padding:2px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--wb-well);cursor:pointer;display:inline-flex;align-items:center;transition:background .15s ease}',
      '.wb-switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary);border-color:transparent;justify-content:flex-end}',
      '.wb-switch[disabled]{opacity:.5;cursor:default}',
      '.wb-switch:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.wb-knob{width:16px;height:16px;border-radius:999px;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25)}',
      '.wb-note{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary)}',
      '.wb-note.is-error{color:var(--dsw-alias-state-error-primary)}',
      '.wb-note.is-warn{color:var(--dsw-alias-state-warn-primary)}',
      '.wb-note.is-success{color:var(--dsw-alias-state-success-primary)}',
      '.wb-list{display:flex;flex-direction:column;gap:8px}',
      '.wb-row{display:flex;align-items:flex-start;gap:12px;width:100%;text-align:left;padding:12px 14px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface);cursor:pointer;font:inherit;color:inherit}',
      '.wb-row:hover{border-color:var(--dsw-alias-border-l2)}',
      '.wb-row:focus-visible{outline:1px solid var(--dsw-alias-brand-primary);outline-offset:2px}',
      '.wb-row.wb-static{cursor:default}',
      '.wb-row.wb-static:hover{border-color:var(--dsw-alias-border-l1)}',
      '.wb-row-main{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1 1 auto}',
      '.wb-row-desc{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.wb-row-action{flex:none;white-space:nowrap}',
      '.wb-pre{margin:0;max-height:340px;overflow:auto;padding:12px 14px;border-radius:10px;background:var(--wb-well);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary)}',
      '.wb-detail{display:flex;flex-direction:column;gap:12px;padding:16px 18px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface)}',
      '.wb-detail h2{margin:0;font-size:16px;font-weight:600}',
      '.wb-section-label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}',
      '.wb-empty{padding:28px 16px;text-align:center;font-size:13px;color:var(--dsw-alias-label-secondary);border:1px dashed var(--dsw-alias-border-l1);border-radius:12px}',
    ].join('\n');

    /** A labeled on/off control. */
    function Switch(props) {
      return h('button', {
        type: 'button',
        role: 'switch',
        'aria-checked': props.checked,
        'aria-label': props.label,
        title: props.label,
        className: 'wb-switch',
        disabled: props.disabled,
        onClick: function () { props.onChange(!props.checked); },
      }, h('span', { className: 'wb-knob' }));
    }

    /** A pill carrying one status. */
    function Badge(props) {
      return h('span', {
        className: 'wb-badge' + (props.tone ? ' is-' + props.tone : ''),
      }, props.dot ? h('span', { className: 'wb-dot' }) : null, props.children);
    }

    /** Status tone and text for one MCP row. */
    function phaseOf(server, t) {
      if (!server.enabled) return { tone: 'idle', text: t('state.disabled') };
      var phase = server.phase || '';
      if (phase === 'active') return { tone: 'success', text: t('phase.active') };
      if (phase === 'failed') return { tone: 'error', text: t('phase.failed') };
      if (phase === 'pending' || phase === 'loading') return { tone: 'warn', text: t('phase.pending') };
      return { tone: 'idle', text: t('phase.unknown') };
    }

    /** Display text for one skill source, falling back to the raw source id. */
    function sourceLabelOf(source, t) {
      var key = 'source.' + source;
      var label = t(key);
      if (typeof label === 'string' && label !== key) return label;
      return source === '' ? t('source.custom') : source;
    }

    /** One sentence for a Plugin Manager change result. */
    function changeText(result, wanted, t) {
      var value = result || {};
      var application = typeof value.application === 'string' ? value.application : 'applied';
      var text = t('application.' + application);
      if (application === 'failed' && value.error) {
        var reason = value.error.diagnostic || value.error.code || '';
        if (reason) text = text + '：' + reason;
      }
      var wantedText = wanted ? t('mcp.toggleOn') : t('mcp.toggleOff');
      return t('mcp.changed') + ' · ' + wantedText + ' · ' + text;
    }

    /** MCP server module: one card per configured server with its endpoint and live state. */
    function McpModule(props) {
      var t = props.t;
      var stateHook = useState({ phase: 'loading' });
      var state = stateHook[0];
      var setState = stateHook[1];
      var queryHook = useState('');
      var query = queryHook[0];
      var setQuery = queryHook[1];
      var busyHook = useState('');
      var busy = busyHook[0];
      var setBusy = busyHook[1];
      var noticeHook = useState(null);
      var notice = noticeHook[0];
      var setNotice = noticeHook[1];

      var load = useCallback(async function () {
        setState({ phase: 'loading' });
        try {
          var data = await api('/mcp');
          setState({ phase: 'ready', servers: data.servers || [], problems: data.problems || [] });
        } catch (error) {
          setState({ phase: 'error', error: messageOf(error) });
        }
      }, []);

      useEffect(function () { load(); }, [load]);

      var toggle = useCallback(async function (server, next) {
        setBusy(server.entryId);
        setNotice(null);
        try {
          var data = await api('/mcp', {
            method: 'POST',
            body: JSON.stringify({ entryId: server.entryId, enabled: next }),
          });
          setNotice({ tone: 'success', text: changeText(data.result, next, t) });
          await load();
        } catch (error) {
          setNotice({ tone: 'error', text: messageOf(error) });
        } finally {
          setBusy('');
        }
      }, [load, t]);

      var servers = state.servers || [];
      var enabledCount = servers.filter(function (server) { return server.enabled; }).length;
      var shown = useMemo(function () {
        var needle = query.trim().toLowerCase();
        if (needle === '') return servers;
        return servers.filter(function (server) {
          return server.serverName.toLowerCase().indexOf(needle) >= 0 ||
            (server.endpoint || '').toLowerCase().indexOf(needle) >= 0 ||
            (server.title || '').toLowerCase().indexOf(needle) >= 0 ||
            (server.patchId || '').toLowerCase().indexOf(needle) >= 0;
        });
      }, [servers, query]);

      var header = h('div', { className: 'wb-bar', key: 'bar' },
        h('span', { className: 'wb-count' },
          String(servers.length) + ' ' + t('mcp.summary') + ' · ' + String(enabledCount) + ' ' + t('mcp.enabledCount')),
        h('span', { className: 'wb-spacer' }),
        h('input', {
          className: 'wb-input',
          type: 'search',
          value: query,
          placeholder: t('mcp.search'),
          'aria-label': t('mcp.search'),
          onChange: function (event) { setQuery(event.target.value); },
        }),
        h('button', {
          type: 'button',
          className: 'wb-btn',
          disabled: state.phase === 'loading',
          onClick: function () { load(); },
        }, t('common.refresh')),
      );

      var body;
      if (state.phase === 'loading') {
        body = h('p', { className: 'wb-note', key: 'loading' }, t('common.loading'));
      } else if (state.phase === 'error') {
        body = h('div', { key: 'error' },
          h('p', { className: 'wb-note is-error' }, t('mcp.loadFailed') + '：' + state.error),
          h('button', { type: 'button', className: 'wb-btn', onClick: function () { load(); } }, t('common.retry')));
      } else if (servers.length === 0) {
        body = h('div', { className: 'wb-empty', key: 'empty' }, t('mcp.none'));
      } else if (shown.length === 0) {
        body = h('div', { className: 'wb-empty', key: 'empty' }, t('common.empty'));
      } else {
        body = h('div', { className: 'wb-list', key: 'list' },
          shown.map(function (server) {
            var phase = phaseOf(server, t);
            var details = [];
            details.push(h('span', { key: 'tools' }, t('mcp.tools') + '：' + String(server.toolCount)));
            if (server.envKeys.length > 0) {
              details.push(h('span', { key: 'env' }, t('mcp.env') + '：' + server.envKeys.join('、')));
            }
            if (server.toolCallTimeoutMs !== null) {
              details.push(h('span', { key: 'timeout' }, t('mcp.timeout') + '：' + String(server.toolCallTimeoutMs) + ' ms'));
            }
            if (server.failOnStartupError) {
              details.push(h('span', { key: 'strict' }, t('mcp.strict')));
            }
            return h('article', { className: 'wb-card', key: server.entryId },
              h('div', { className: 'wb-card-head' },
                h('div', { className: 'wb-card-title' },
                  h('span', { className: 'wb-name' }, server.title || server.serverName),
                  server.title ? h('span', { className: 'wb-sub' }, server.serverName) : null,
                  h(Badge, null, server.transport),
                  server.patchId ? h(Badge, null, server.patchId) : null),
                h('div', { className: 'wb-side' },
                  h(Badge, { tone: phase.tone, dot: true }, phase.text),
                  h(Switch, {
                    checked: server.enabled,
                    disabled: busy === server.entryId,
                    label: (server.enabled ? t('mcp.toggleOff') : t('mcp.toggleOn')) + ' ' + server.serverName,
                    onChange: function (next) { toggle(server, next); },
                  }))),
              h('code', { className: 'wb-endpoint' }, server.endpoint || t('mcp.noEndpoint')),
              h('div', { className: 'wb-meta' }, details));
          }));
      }

      return h('div', { className: 'wb-body' },
        header,
        state.phase === 'ready' && (state.problems || []).length > 0
          ? h('div', { key: 'problems' }, state.problems.map(function (problem, index) {
            return h('p', { className: 'wb-note is-warn', key: String(index) }, problem);
          }))
          : null,
        notice ? h('p', { className: 'wb-note is-' + notice.tone, role: 'status' }, notice.text) : null,
        body);
    }

    /** Skills module: the merged catalog plus one skill's full body on demand. */
    function SkillsModule(props) {
      var t = props.t;
      var stateHook = useState({ phase: 'loading' });
      var state = stateHook[0];
      var setState = stateHook[1];
      var queryHook = useState('');
      var query = queryHook[0];
      var setQuery = queryHook[1];
      var detailHook = useState(null);
      var detail = detailHook[0];
      var setDetail = detailHook[1];

      var load = useCallback(async function () {
        setState({ phase: 'loading' });
        try {
          var data = await api('/skills');
          setState({
            phase: 'ready',
            skills: data.skills || [],
            hiddenBundled: typeof data.hiddenBundled === 'number' ? data.hiddenBundled : 0,
            complete: data.complete === true,
            root: data.root || '',
          });
        } catch (error) {
          setState({ phase: 'error', error: messageOf(error) });
        }
      }, []);

      useEffect(function () { load(); }, [load]);

      var root = typeof state.root === 'string' ? state.root : '';

      var open = useCallback(async function (name) {
        setDetail({ phase: 'loading', name: name });
        try {
          var data = await api('/skill?name=' + encodeURIComponent(name));
          setDetail({ phase: 'ready', skill: data.skill });
        } catch (error) {
          setDetail({ phase: 'error', name: name, error: messageOf(error) });
        }
      }, []);

      var skills = state.skills || [];
      var shown = useMemo(function () {
        var needle = query.trim().toLowerCase();
        if (needle === '') return skills;
        return skills.filter(function (skill) {
          return skill.name.toLowerCase().indexOf(needle) >= 0 ||
            skill.description.toLowerCase().indexOf(needle) >= 0 ||
            skill.source.toLowerCase().indexOf(needle) >= 0;
        });
      }, [skills, query]);

      if (detail !== null) {
        var headerText = detail.phase === 'ready' ? detail.skill.name : detail.name;
        return h('div', { className: 'wb-body' },
          h('div', { className: 'wb-bar' },
            h('button', {
              type: 'button',
              className: 'wb-btn',
              onClick: function () { setDetail(null); },
            }, '← ' + t('common.back'))),
          h('div', { className: 'wb-detail' },
            h('h2', null, headerText),
            detail.phase === 'loading' ? h('p', { className: 'wb-note' }, t('common.loading')) : null,
            detail.phase === 'error' ? h('p', { className: 'wb-note is-error' }, detail.error) : null,
            detail.phase === 'ready' ? h('div', { className: 'wb-meta' },
              h(Badge, null, sourceLabelOf(detail.skill.source, t)),
              h(Badge, null, detail.skill.modelInvocable
                ? (detail.skill.userInvocable ? t('skills.both') : t('skills.modelOnly'))
                : t('skills.userOnly'))) : null,
            detail.phase === 'ready' && detail.skill.description !== ''
              ? h('p', { className: 'wb-note' }, detail.skill.description)
              : null,
            detail.phase === 'ready' && detail.skill.whenToUse !== ''
              ? h('div', null,
                h('div', { className: 'wb-section-label' }, t('skills.whenToUse')),
                h('p', { className: 'wb-note' }, detail.skill.whenToUse))
              : null,
            detail.phase === 'ready' && detail.skill.path !== ''
              ? h('div', null,
                h('div', { className: 'wb-section-label' }, t('skills.path')),
                h('code', { className: 'wb-endpoint' }, detail.skill.path))
              : null,
            detail.phase === 'ready'
              ? h('div', null,
                h('div', { className: 'wb-section-label' }, t('skills.body')),
                h('pre', { className: 'wb-pre' }, detail.skill.content))
              : null));
      }

      var header = h('div', { className: 'wb-bar', key: 'bar' },
        h('span', { className: 'wb-count' }, String(skills.length) + ' ' + t('skills.summary')),
        h('span', { className: 'wb-spacer' }),
        h('input', {
          className: 'wb-input',
          type: 'search',
          value: query,
          placeholder: t('skills.search'),
          'aria-label': t('skills.search'),
          onChange: function (event) { setQuery(event.target.value); },
        }),
        h('button', {
          type: 'button',
          className: 'wb-btn',
          disabled: state.phase === 'loading',
          onClick: function () { load(); },
        }, t('common.refresh')),
      );

      var body;
      if (state.phase === 'loading') {
        body = h('p', { className: 'wb-note', key: 'loading' }, t('common.loading'));
      } else if (state.phase === 'error') {
        body = h('div', { key: 'error' },
          h('p', { className: 'wb-note is-error' }, t('skills.loadFailed') + '：' + state.error),
          h('button', { type: 'button', className: 'wb-btn', onClick: function () { load(); } }, t('common.retry')));
      } else if (shown.length === 0) {
        body = h('div', { className: 'wb-empty', key: 'empty' }, skills.length === 0
          ? (state.hiddenBundled > 0 ? t('skills.onlyBundled') : t('skills.none'))
          : t('common.empty'));
      } else {
        body = h('div', { className: 'wb-list', key: 'list' },
          shown.map(function (skill) {
            return h('button', {
              type: 'button',
              className: 'wb-row',
              key: skill.name,
              onClick: function () { open(skill.name); },
            },
            h('div', { className: 'wb-row-main' },
              h('div', { className: 'wb-card-title' },
                h('span', { className: 'wb-name' }, skill.name),
                h(Badge, null, sourceLabelOf(skill.source, t)),
                skill.modelInvocable ? null : h(Badge, { tone: 'idle' }, t('skills.userOnly'))),
              h('span', { className: 'wb-row-desc' }, skill.description)),
            h('span', { className: 'wb-sub wb-row-action' }, t('skills.view')));
          }));
      }

      return h('div', { className: 'wb-body' },
        header,
        root !== ''
          ? h('p', { className: 'wb-note wb-cwd', title: root }, t('skills.root') + '：' + root)
          : null,
        typeof state.hiddenBundled === 'number' && state.hiddenBundled > 0
          ? h('p', { className: 'wb-note' }, t('skills.hiddenBundled') + ' · ' + String(state.hiddenBundled))
          : null,
        state.phase === 'ready' && state.complete !== true
          ? h('p', { className: 'wb-note is-warn', role: 'status' }, t('skills.incomplete'))
          : null,
        body);
    }

    /** One line describing what an install click did. */
    function installText(result, t) {
      var value = result || {};
      var change = value.change || {};
      var head = value.status === 'already-installed' ? t('fav.alreadyInstalled') : t('fav.installed');
      if (value.status === 'failed') head = t('fav.failed');
      var parts = [head, String(value.name || value.spec || '')];
      if (typeof change.application === 'string' && change.application !== '') {
        parts.push(t('application.' + change.application));
      }
      if (value.repaired === true) parts.push(t('fav.repaired'));
      if (typeof change.diagnostic === 'string' && change.diagnostic !== '') parts.push(change.diagnostic);
      return parts.join(' · ');
    }

    /** Fill one counted sentence: the only placeholders used here are {{n}}, {{ok}} and {{bad}}. */
    function fill(template, values) {
      var text = template;
      Object.keys(values).forEach(function (key) {
        text = text.split('{{' + key + '}}').join(String(values[key]));
      });
      return text;
    }

    /** "2026-11-11T03:04:05.000Z" -> the browser's own date and time. */
    function stampText(iso) {
      if (typeof iso !== 'string' || iso === '') return '';
      var when = new Date(iso);
      if (isNaN(when.getTime())) return iso;
      return when.toLocaleString();
    }

    /**
     * Favourites module: a pinned list of the plugins this profile runs, each
     * installable from the spec a new machine can actually resolve.
     */
    function FavoritesModule(props) {
      var t = props.t;
      var stateHook = useState({ phase: 'loading' });
      var state = stateHook[0];
      var setState = stateHook[1];
      var queryHook = useState('');
      var query = queryHook[0];
      var setQuery = queryHook[1];
      var busyHook = useState('');
      var busy = busyHook[0];
      var setBusy = busyHook[1];
      var noticeHook = useState(null);
      var notice = noticeHook[0];
      var setNotice = noticeHook[1];

      var load = useCallback(async function () {
        setState({ phase: 'loading' });
        try {
          var data = await api('/favorites');
          setState({
            phase: 'ready',
            plugins: data.plugins || [],
            capturedAt: data.capturedAt || '',
            filePath: data.filePath || '',
            pending: typeof data.pending === 'number' ? data.pending : 0,
            problems: data.problems || [],
          });
        } catch (error) {
          setState({ phase: 'error', error: messageOf(error) });
        }
      }, []);

      useEffect(function () { load(); }, [load]);

      var capture = useCallback(async function () {
        setBusy('#capture');
        setNotice(null);
        try {
          var data = await api('/favorites', { method: 'POST', body: JSON.stringify({ action: 'capture' }) });
          setNotice({ tone: 'success', text: fill(t('fav.captured'), { n: data.count }) });
          await load();
        } catch (error) {
          setNotice({ tone: 'error', text: messageOf(error) });
        } finally {
          setBusy('');
        }
      }, [load, t]);

      var install = useCallback(async function (plugin) {
        setBusy(plugin.name);
        setNotice(null);
        try {
          var data = await api('/favorites', {
            method: 'POST',
            body: JSON.stringify({ action: 'install', name: plugin.name }),
          });
          setNotice({ tone: data.status === 'failed' ? 'error' : 'success', text: installText(data, t) });
          await load();
        } catch (error) {
          setNotice({ tone: 'error', text: messageOf(error) });
        } finally {
          setBusy('');
        }
      }, [load, t]);

      var installAll = useCallback(async function () {
        setBusy('#all');
        setNotice(null);
        try {
          var data = await api('/favorites', { method: 'POST', body: JSON.stringify({ action: 'install-all' }) });
          setNotice({
            tone: data.failed > 0 ? 'error' : 'success',
            text: fill(t('fav.allDone'), { ok: data.installed, bad: data.failed }) +
              (data.failed > 0
                ? ' · ' + (data.results || []).filter(function (entry) { return entry.ok !== true; })
                  .map(function (entry) { return entry.name + (entry.detail ? '：' + entry.detail : ''); })
                  .join(' / ')
                : ''),
          });
          await load();
        } catch (error) {
          setNotice({ tone: 'error', text: messageOf(error) });
        } finally {
          setBusy('');
        }
      }, [load, t]);

      var plugins = state.plugins || [];
      var pending = state.pending || 0;
      var shown = useMemo(function () {
        var needle = query.trim().toLowerCase();
        if (needle === '') return plugins;
        return plugins.filter(function (plugin) {
          return plugin.name.toLowerCase().indexOf(needle) >= 0 ||
            (plugin.title || '').toLowerCase().indexOf(needle) >= 0 ||
            (plugin.description || '').toLowerCase().indexOf(needle) >= 0 ||
            (plugin.installSpec || '').toLowerCase().indexOf(needle) >= 0;
        });
      }, [plugins, query]);

      var header = h('div', { className: 'wb-bar', key: 'bar' },
        h('span', { className: 'wb-count' },
          String(plugins.length) + ' ' + t('fav.summary') +
            (state.capturedAt ? ' · ' + fill(t('fav.capturedAt'), { at: stampText(state.capturedAt) }) : '') +
            (pending > 0 ? ' · ' + fill(t('fav.pending'), { n: pending }) : '')),
        h('span', { className: 'wb-spacer' }),
        h('input', {
          className: 'wb-input',
          type: 'search',
          value: query,
          placeholder: t('fav.search'),
          'aria-label': t('fav.search'),
          onChange: function (event) { setQuery(event.target.value); },
        }),
        h('button', {
          type: 'button',
          className: 'wb-btn',
          disabled: busy !== '',
          title: t('fav.captureHint'),
          onClick: function () { capture(); },
        }, busy === '#capture' ? t('fav.capturing') : t('fav.capture')),
        h('button', {
          type: 'button',
          className: 'wb-btn wb-primary',
          disabled: busy !== '' || pending === 0,
          onClick: function () { installAll(); },
        }, busy === '#all' ? t('fav.installingAll') : t('fav.installAll')),
        h('button', {
          type: 'button',
          className: 'wb-btn',
          disabled: state.phase === 'loading' || busy !== '',
          onClick: function () { load(); },
        }, t('common.refresh')));

      var body;
      if (state.phase === 'loading') {
        body = h('p', { className: 'wb-note', key: 'loading' }, t('common.loading'));
      } else if (state.phase === 'error') {
        body = h('div', { key: 'error' },
          h('p', { className: 'wb-note is-error' }, t('fav.loadFailed') + '：' + state.error),
          h('button', { type: 'button', className: 'wb-btn', onClick: function () { load(); } }, t('common.retry')));
      } else if (shown.length === 0) {
        body = h('div', { className: 'wb-empty', key: 'empty' },
          plugins.length === 0 ? t('fav.none') : t('common.empty'));
      } else {
        body = h('div', { className: 'wb-list', key: 'list' }, shown.map(function (plugin) {
          var ready = plugin.action === 'installed';
          var tone = ready ? 'success' : (plugin.availability === 'missing' ? 'error' : 'idle');
          var stateText = ready ? t('fav.stateInstalled')
            : (plugin.availability === 'missing' ? t('fav.stateMissing') : t('fav.stateAbsent'));
          return h('div', { className: 'wb-row wb-static', key: plugin.name },
            h('div', { className: 'wb-row-main' },
              h('div', { className: 'wb-card-title' },
                h('span', { className: 'wb-name' }, plugin.title || plugin.name),
                plugin.title !== '' && plugin.title !== plugin.name
                  ? h('span', { className: 'wb-sub' }, plugin.name)
                  : null,
                plugin.currentVersion !== '' ? h(Badge, null, plugin.currentVersion) : null,
                h(Badge, { tone: tone, dot: true }, stateText)),
              plugin.description !== ''
                ? h('span', { className: 'wb-row-desc' }, plugin.description)
                : null,
              h('span', { className: 'wb-sub' }, t('fav.source') + '：' + plugin.installSpec)),
            h('div', { className: 'wb-side' },
              h('button', {
                type: 'button',
                className: 'wb-btn' + (ready ? '' : ' wb-primary'),
                disabled: busy !== '' || ready,
                title: plugin.installSpec,
                onClick: function () { install(plugin); },
              }, busy === plugin.name ? t('fav.installing') : (ready ? t('fav.stateInstalled') : t('fav.install')))));
        }));
      }

      return h('div', { className: 'wb-body' },
        header,
        notice
          ? h('p', { className: 'wb-note is-' + notice.tone, role: 'status' }, notice.text)
          : null,
        state.phase === 'ready' && (state.problems || []).length > 0
          ? h('div', { key: 'problems' }, state.problems.map(function (problem, index) {
            return h('p', { className: 'wb-note is-warn', key: String(index) }, problem);
          }))
          : null,
        body,
        state.phase === 'ready' && state.filePath !== ''
          ? h('p', { className: 'wb-note wb-cwd', key: 'file', title: state.filePath }, t('fav.file') + '：' + state.filePath)
          : null,
        h('p', { className: 'wb-note', key: 'hint' }, t('fav.captureHint')));
    }

    /**
     * One workbench tab, in bar order; the first entry is the default view.
     * Adding a module means adding an entry here and a Host route.
     */
    var MODULES = [
      { id: 'favorites', label: 'tab.favorites', component: FavoritesModule },
      { id: 'mcp', label: 'tab.mcp', component: McpModule },
      { id: 'skills', label: 'tab.skills', component: SkillsModule },
    ];

    /** The panel: header, module tabs, and the active module. */
    function Workbench(props) {
      var t = props.t;
      var selectedHook = useState(MODULES[0].id);
      var selected = selectedHook[0];
      var setSelected = selectedHook[1];
      var active = MODULES[0];
      for (var index = 0; index < MODULES.length; index += 1) {
        if (MODULES[index].id === selected) active = MODULES[index];
      }
      return h('div', { className: 'wb-root' },
        h('style', { dangerouslySetInnerHTML: { __html: CSS } }),
        h('div', { className: 'wb-inner' },
          h('header', { className: 'wb-header' },
            h('h1', null, t('page.title')),
            h('p', null, t('page.subtitle'))),
          h('nav', { className: 'wb-tabs', role: 'tablist', 'aria-label': t('page.title') },
            MODULES.map(function (module) {
              return h('button', {
                key: module.id,
                type: 'button',
                role: 'tab',
                id: 'wb-tab-' + module.id,
                className: 'wb-tab',
                'aria-selected': module.id === active.id,
                'aria-controls': 'wb-panel-' + module.id,
                onClick: function () { setSelected(module.id); },
              }, t(module.label));
            })),
          h('section', {
            className: 'wb-body',
            role: 'tabpanel',
            id: 'wb-panel-' + active.id,
            'aria-labelledby': 'wb-tab-' + active.id,
          }, h(active.component, { t: t }))));
    }

    /** Sidebar icon: a four-pane workbench glyph drawn in the host's inherited color. */
    function WorkbenchIcon(props) {
      var size = typeof props.size === 'number' && props.size > 0 ? props.size : 18;
      return h('svg', {
        viewBox: '0 0 24 24',
        width: size,
        height: size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.7,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: false,
        style: { display: 'block' },
      },
      h('rect', { x: 3, y: 3, width: 7.5, height: 7.5, rx: 2 }),
      h('rect', { x: 13.5, y: 3, width: 7.5, height: 7.5, rx: 2 }),
      h('rect', { x: 3, y: 13.5, width: 7.5, height: 7.5, rx: 2 }),
      h('path', { d: 'M13.5 17.25h7.5' }),
      h('path', { d: 'M17.25 13.5v7.5' }));
    }

    var inject = ['slots', 'locale'];

    function apply(ctx) {
      ctx.effect(function () {
        return ctx.locale.register(NS, { zh: ZH, en: EN });
      }, 'my-workbench: dictionaries');

      var bound = ctx.locale.bind(NS);
      var t = function (key) {
        var value = bound(key);
        return typeof value === 'string' ? value : key;
      };

      ctx.slots.inject('main', function () {
        return ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
          locale: NS,
          inject: function () { return {}; },
        }, function (props) {
          return h(Workbench, { t: typeof props.t === 'function' ? props.t : t });
        });
      });

      ctx.slots.inject('sidebar.panellist', function () {
        return ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 20,
          label: function () { return t('panel.label'); },
          locale: NS,
        }, WorkbenchIcon);
      });
    }

    return { inject: inject, apply: apply };
  },
});
