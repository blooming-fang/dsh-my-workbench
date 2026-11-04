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
      'page.subtitle': '在一处查看 Harness 的 MCP 服务、技能与每日 token 用量。',
      'tab.mcp': 'MCP 服务',
      'tab.skills': '技能',
      'tab.usage': '用量',
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
      'usage.range': '区间合计',
      'usage.today': '今日',
      'usage.input': '输入',
      'usage.output': '输出',
      'usage.cacheRead': '缓存读',
      'usage.reasoning': '推理',
      'usage.messages': '消息',
      'usage.sessions': '会话',
      'usage.date': '日期',
      'usage.total': '合计',
      'usage.totalIncl': '含缓存合计',
      'usage.hitRate': '缓存命中率',
      'usage.loadFailed': '读取用量失败',
      'usage.scanning': '正在扫描历史会话日志',
      'usage.pendingFiles': '剩余日志',
      'usage.window': '近 {{n}} 天',
      'usage.note': '口径：输入只计未命中缓存的提示 token，缓存读单列；合计 = 输入 + 输出 + 推理；含缓存合计 = 合计 + 缓存读 + 缓存写；会话数按当天有记录的会话去重。',
      'usage.limit': '统计来自本地会话日志，仅统计本机保存的会话。',
    };

    var EN = {
      'panel.label': 'My Workbench',
      'page.title': 'My Workbench',
      'page.subtitle': 'This Harness’s MCP servers, skills, and daily token usage in one place.',
      'tab.mcp': 'MCP servers',
      'tab.skills': 'Skills',
      'tab.usage': 'Usage',
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
      'usage.range': 'Range total',
      'usage.today': 'Today',
      'usage.input': 'Input',
      'usage.output': 'Output',
      'usage.cacheRead': 'Cache read',
      'usage.reasoning': 'Reasoning',
      'usage.messages': 'Messages',
      'usage.sessions': 'Sessions',
      'usage.date': 'Date',
      'usage.total': 'Total',
      'usage.totalIncl': 'With cache',
      'usage.hitRate': 'Cache hit rate',
      'usage.loadFailed': 'Reading usage failed',
      'usage.scanning': 'Scanning session logs',
      'usage.pendingFiles': 'logs left',
      'usage.window': 'Last {{n}} days',
      'usage.note': 'Counting: input excludes cache hits, which are reported separately; total = input + output + reasoning; with-cache total adds cache reads and writes back; sessions are deduplicated per day.',
      'usage.limit': 'Figures come from local session logs, so only sessions kept on this machine are counted.',
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
      '.wb-row-main{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1 1 auto}',
      '.wb-row-desc{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.wb-row-action{flex:none;white-space:nowrap}',
      '.wb-pre{margin:0;max-height:340px;overflow:auto;padding:12px 14px;border-radius:10px;background:var(--wb-well);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.6;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary)}',
      '.wb-detail{display:flex;flex-direction:column;gap:12px;padding:16px 18px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface)}',
      '.wb-detail h2{margin:0;font-size:16px;font-weight:600}',
      '.wb-section-label{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-secondary)}',
      '.wb-empty{padding:28px 16px;text-align:center;font-size:13px;color:var(--dsw-alias-label-secondary);border:1px dashed var(--dsw-alias-border-l1);border-radius:12px}',
      '.wb-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}',
      '.wb-stat{display:flex;flex-direction:column;gap:4px;padding:13px 15px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface)}',
      '.wb-stat-value{font-size:20px;font-weight:600;font-variant-numeric:tabular-nums;letter-spacing:-.01em}',
      '.wb-stat-label{font-size:11px;color:var(--dsw-alias-label-secondary)}',
      '.wb-chart{display:flex;align-items:flex-end;gap:3px;height:150px;padding:12px;border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface)}',
      '.wb-chart-col{flex:1 1 0;min-width:2px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}',
      '.wb-chart-bar{width:100%;min-height:2px;border-radius:3px 3px 0 0;background:var(--dsw-alias-brand-primary);opacity:.85}',
      '.wb-chart-col:hover .wb-chart-bar{opacity:1}',
      '.wb-chart-label{font-size:10px;line-height:1;color:var(--dsw-alias-label-secondary);white-space:nowrap}',
      '.wb-table-wrap{border-radius:12px;border:1px solid var(--dsw-alias-border-l1);background:var(--wb-surface);overflow:hidden}',
      '.wb-table{width:100%;border-collapse:collapse;font-size:12px}',
      '.wb-table th{padding:9px 12px;text-align:right;font-weight:600;color:var(--dsw-alias-label-secondary);border-bottom:1px solid var(--dsw-alias-border-l1);background:transparent;white-space:nowrap}',
      '.wb-table td{padding:8px 12px;text-align:right;border-bottom:1px solid var(--dsw-alias-border-l1);font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}',
      '.wb-table th:first-child,.wb-table td:first-child{text-align:left}',
      '.wb-table tr:last-child td{border-bottom:0}',
      '.wb-btn[aria-pressed="true"]{background:var(--wb-well);font-weight:600;box-shadow:inset 0 0 0 1px var(--dsw-alias-border-l1)}',
      '.wb-range{display:inline-flex;gap:6px}',
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

    /** Compact token count: 1.24M, 31.4K, 907. */
    function formatTokens(value) {
      var count = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      if (count >= 1e9) return (count / 1e9).toFixed(2) + 'B';
      if (count >= 1e6) return (count / 1e6).toFixed(2) + 'M';
      if (count >= 1e4) return (count / 1e3).toFixed(1) + 'K';
      if (count >= 1e3) return (count / 1e3).toFixed(2) + 'K';
      return String(Math.round(count));
    }

    function formatPercent(value) {
      var ratio = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      return (ratio * 100).toFixed(1) + '%';
    }

    /** `2026-11-04` -> `11-04`. */
    function shortDay(date) {
      return typeof date === 'string' && date.length >= 10 ? date.slice(5) : String(date);
    }

    /** Total tokens of one bucket: uncached input, output, and reasoning. */
    function bucketTotal(day) {
      if (day === null || typeof day !== 'object') return 0;
      if (typeof day.total === 'number') return day.total;
      return (day.input || 0) + (day.output || 0) + (day.reasoning || 0);
    }

    /** The same total with the cached prompt read back in. */
    function bucketTotalWithCache(day) {
      if (day === null || typeof day !== 'object') return 0;
      if (typeof day.totalWithCache === 'number') return day.totalWithCache;
      return bucketTotal(day) + (day.cacheRead || 0) + (day.cacheWrite || 0);
    }

    /** One headline figure. */
    function Stat(props) {
      return h('div', { className: 'wb-stat' },
        h('span', { className: 'wb-stat-value' }, props.value),
        h('span', { className: 'wb-stat-label' }, props.label));
    }

    var USAGE_RANGES = [7, 30, 90];

    /** Daily token usage folded from the local session logs. */
    function UsageModule(props) {
      var t = props.t;
      var rangeHook = useState(7);
      var range = rangeHook[0];
      var setRange = rangeHook[1];
      var stateHook = useState({ phase: 'loading' });
      var state = stateHook[0];
      var setState = stateHook[1];
      var attempts = React.useRef(0);

      var load = useCallback(async function () {
        try {
          var data = await api('/usage?days=' + String(range));
          setState({ phase: 'ready', data: data });
        } catch (error) {
          setState({ phase: 'error', error: messageOf(error) });
        }
      }, [range]);

      useEffect(function () {
        attempts.current = 0;
        setState({ phase: 'loading' });
        load();
      }, [load]);

      var data = state.phase === 'ready' ? state.data : null;
      var pending = data !== null && data.scan !== undefined ? data.scan.pending : 0;

      // A long window is folded in bounded slices; keep asking until it is done.
      useEffect(function () {
        if (pending <= 0 || attempts.current >= 30) return undefined;
        attempts.current += 1;
        var timer = setTimeout(function () { load(); }, 500);
        return function () { clearTimeout(timer); };
      }, [pending, state, load]);

      var rangeLabel = function (days) { return t('usage.window').replace('{{n}}', String(days)); };

      var bar = h('div', { className: 'wb-bar', key: 'bar' },
        h('div', { className: 'wb-range' }, USAGE_RANGES.map(function (days) {
          return h('button', {
            key: String(days),
            type: 'button',
            className: 'wb-btn',
            'aria-pressed': range === days,
            onClick: function () { setRange(days); },
          }, rangeLabel(days));
        })),
        h('span', { className: 'wb-spacer' }),
        h('button', {
          type: 'button',
          className: 'wb-btn',
          disabled: state.phase === 'loading',
          onClick: function () { load(); },
        }, t('common.refresh')));

      var cards = null;
      var chart = null;
      var table = null;
      if (data !== null) {
        cards = h('div', { className: 'wb-cards', key: 'cards' },
          h(Stat, { label: t('usage.today'), value: formatTokens(bucketTotal(data.today)) }),
          h(Stat, { label: rangeLabel(data.range.days) + ' · ' + t('usage.total'), value: formatTokens(bucketTotal(data.totals)) }),
          h(Stat, { label: rangeLabel(data.range.days) + ' · ' + t('usage.totalIncl'), value: formatTokens(bucketTotalWithCache(data.totals)) }),
          h(Stat, { label: t('usage.hitRate'), value: formatPercent(data.totals.hitRate) }),
          h(Stat, { label: t('usage.sessions'), value: String(data.totals.sessions) }));

        var peak = 0;
        data.days.forEach(function (day) {
          var value = bucketTotal(day);
          if (value > peak) peak = value;
        });
        var step = Math.max(1, Math.ceil(data.days.length / 12));
        chart = h('div', { className: 'wb-chart', key: 'chart' }, data.days.map(function (day, index) {
          var value = bucketTotal(day);
          var height = peak > 0 ? Math.max(2, Math.round((value / peak) * 100)) : 2;
          var title = [
            day.date,
            t('usage.total') + ' ' + formatTokens(value),
            t('usage.totalIncl') + ' ' + formatTokens(bucketTotalWithCache(day)),
            t('usage.input') + ' ' + formatTokens(day.input),
            t('usage.output') + ' ' + formatTokens(day.output),
            t('usage.cacheRead') + ' ' + formatTokens(day.cacheRead),
            t('usage.sessions') + ' ' + String(day.sessions),
          ].join(' · ');
          return h('div', { className: 'wb-chart-col', key: day.date, title: title },
            h('div', { className: 'wb-chart-bar', style: { height: height + '%' } }),
            h('span', { className: 'wb-chart-label' }, index % step === 0 ? shortDay(day.date) : ''));
        }));

        var rows = data.days.slice().reverse();
        table = h('div', { className: 'wb-table-wrap', key: 'table' },
          h('table', { className: 'wb-table' },
            h('thead', null,
              h('tr', null,
                h('th', null, t('usage.date')),
                h('th', null, t('usage.input')),
                h('th', null, t('usage.output')),
                h('th', null, t('usage.cacheRead')),
                h('th', null, t('usage.reasoning')),
                h('th', null, t('usage.total')),
                h('th', null, t('usage.totalIncl')),
                h('th', null, t('usage.hitRate')),
                h('th', null, t('usage.messages')),
                h('th', null, t('usage.sessions')))),
            h('tbody', null, rows.map(function (day) {
              var promptTokens = (day.input || 0) + (day.cacheRead || 0);
              var hit = promptTokens > 0 ? day.cacheRead / promptTokens : 0;
              return h('tr', { key: day.date },
                h('td', null, day.date),
                h('td', null, formatTokens(day.input)),
                h('td', null, formatTokens(day.output)),
                h('td', null, formatTokens(day.cacheRead)),
                h('td', null, formatTokens(day.reasoning)),
                h('td', null, formatTokens(bucketTotal(day))),
                h('td', null, formatTokens(bucketTotalWithCache(day))),
                h('td', null, formatPercent(hit)),
                h('td', null, String(day.messages)),
                h('td', null, String(day.sessions)));
            }))));
      }

      var body = null;
      if (state.phase === 'loading' && data === null) {
        body = h('p', { className: 'wb-note', key: 'loading' }, t('common.loading'));
      } else if (state.phase === 'error') {
        body = h('div', { key: 'error' },
          h('p', { className: 'wb-note is-error' }, t('usage.loadFailed') + '：' + state.error),
          h('button', { type: 'button', className: 'wb-btn', onClick: function () { load(); } }, t('common.retry')));
      } else if (data !== null && pending <= 0 && (data.totals.messages || 0) === 0) {
        body = h('div', { className: 'wb-empty', key: 'empty' }, t('skills.none'));
      }

      return h('div', { className: 'wb-body' },
        bar,
        pending > 0
          ? h('p', { className: 'wb-note', role: 'status' }, t('usage.scanning') + '… ' + t('usage.pendingFiles') + ' ' + String(pending))
          : null,
        body,
        cards,
        chart,
        table,
        data !== null && (data.problems || []).length > 0
          ? h('div', { key: 'problems' }, data.problems.map(function (problem, index) {
            return h('p', { className: 'wb-note is-warn', key: String(index) }, problem);
          }))
          : null,
        h('p', { className: 'wb-note', key: 'note' }, t('usage.note')),
        h('p', { className: 'wb-note', key: 'limit' }, t('usage.limit')));
    }

    /**
     * One workbench tab, in bar order; the first entry is the default view.
     * Adding a module means adding an entry here and a Host route.
     */
    var MODULES = [
      { id: 'usage', label: 'tab.usage', component: UsageModule },
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
