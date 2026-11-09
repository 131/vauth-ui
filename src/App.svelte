<script>
  import {untrack} from 'svelte';
  let {
    t = (key) => key,
    brand = 'vauth',
    version,
    login, settings, workspaceActions, sshIntro, sshSource,
    header, footer, callback,
  } = $props();

  // Locale text is initialized once; attached controllers own the translated leaves.
  const initialTranslator = untrack(() => t);
  const translate = (key, ...args) => untrack(() => initialTranslator(key, ...args));
</script>

<header>{#if header}{@render header()}{:else}<span class="brand">{brand}<span id="version">{version ? ` / v${version}` : ''}</span>
</span>
<span class="header-tools">
<span class="badge" data-i18n="badge">{translate('badge')}</span>
<button id="settings-button" type="button" class="tool" title={translate('settings')} data-i18n-title="settings" aria-label={translate('settings')} data-i18n-aria-label="settings"></button>
</span>{/if}</header>
<main>
{@render callback?.()}
<section id="login">{@render login?.()}</section>
<section id="workspace" hidden>
<div class="welcome">
<div>
<p class="eyebrow" data-i18n="eyebrow">{translate('eyebrow')}</p>
<!-- svelte-ignore a11y_missing_content (the consumer controller supplies the greeting) -->
<h1 id="greeting"></h1>
<p id="account" class="muted"></p>
</div>
<div class="actions">{@render workspaceActions?.()}</div>
</div>
<nav aria-label={translate('sections')} data-i18n-aria-label="sections">
<button id="secrets-tab" class="tab active" data-i18n="tab.secrets">{translate('tab.secrets')}</button>
<button id="ssh-tab" class="tab" data-i18n="tab.ssh">{translate('tab.ssh')}</button>
<button id="kv-tab" class="tab" data-i18n="tab.kv">{translate('tab.kv')}</button>
<button id="wrap-tab" class="tab" data-i18n="tab.wrap">{translate('tab.wrap')}</button>
<button id="unwrap-tab" class="tab" data-i18n="tab.unwrap">{translate('tab.unwrap')}</button>
</nav>
<section id="secrets-panel">
<div class="section-head">
<div>
<h2>
<span data-i18n="secrets.title">{translate('secrets.title')}</span> <span id="count" class="badge"></span>
</h2>
<p class="muted">
<span data-i18n="secrets.help">{translate('secrets.help')}</span> <code>venv</code>.</p>
</div>
<div class="actions">
<button id="refresh" class="secondary" data-i18n="refresh">{translate('refresh')}</button>
<button id="add" data-i18n="add">{translate('add')}</button>
</div>
</div>
<label class="search">
<span data-i18n="search">{translate('search')}</span>
<input id="search" type="search" placeholder={translate('search.placeholder')} data-i18n-placeholder="search.placeholder">
</label>
<p id="environment-denied" class="muted" role="status" hidden data-i18n="browser.read.denied">{translate('browser.read.denied')}</p>
<div id="entries"></div>
</section>

<section id="ssh-panel" hidden>
<h2 data-i18n="ssh.title">{translate('ssh.title')}</h2>{#if sshIntro}{@render sshIntro()}{:else}<p class="muted" data-i18n="ssh.help">{translate('ssh.help')}</p>{/if}<p id="ssh-status" class="muted" role="status"></p>{@render sshSource?.()}<form id="ssh-form">
<label>
<span data-i18n="ssh.key">{translate('ssh.key')}</span>
<textarea id="ssh-key" rows="4" placeholder="ssh-ed25519 AAAA…" required></textarea>
</label>
<p class="muted" data-i18n="ssh.publish.help">{translate('ssh.publish.help')}</p>
<button type="submit" data-i18n="ssh.publish">{translate('ssh.publish')}</button>
</form>
</section>
<section id="kv-panel" hidden>
<div class="section-head">
<div>
<h2 data-i18n="kv.title">{translate('kv.title')}</h2>
<p class="muted" data-i18n="kv.help">{translate('kv.help')}</p>
</div>
<div class="actions">
<button id="kv-refresh" class="secondary" data-i18n="kv.refresh">{translate('kv.refresh')}</button>
<button id="kv-new" data-i18n="kv.new">{translate('kv.new')}</button>
</div>
</div>
<label class="kv-store">
<span data-i18n="kv.mount">{translate('kv.mount')}</span>
<select id="kv-mount"></select>
</label>
<div id="kv-breadcrumbs" class="breadcrumbs"></div>
<div class="kv-layout">
<div class="kv-directory">
<input id="kv-filter" type="search" placeholder={translate('kv.filter')} data-i18n-placeholder="kv.filter" aria-label={translate('kv.filter')} data-i18n-aria-label="kv.filter">
<div id="kv-folders"></div>
</div>
<div class="kv-detail">
<div class="section-head">
<strong id="kv-document-path"></strong>
<div class="actions">
<button id="kv-edit" class="secondary" hidden data-i18n="kv.edit">{translate('kv.edit')}</button>
<button id="kv-delete" class="secondary danger" hidden data-i18n="kv.delete">{translate('kv.delete')}</button>
</div>
</div>
<p id="kv-message" class="muted" role="status"></p>
<div id="kv-values"></div>
</div>
</div>
</section>
<section id="wrap-panel" class="message-panel" hidden>
<h2 data-i18n="wrap.title">{translate('wrap.title')}</h2>
<p class="muted" data-i18n="wrap.help">{translate('wrap.help')}</p>
<form id="wrap-form">
<label class="wrap-duration">
<span data-i18n="wrap.ttl">{translate('wrap.ttl')}</span>
<select id="wrap-ttl" required>
<option value="900" data-i18n="wrap.ttl.15m">{translate('wrap.ttl.15m')}</option>
<option value="21600" data-i18n="wrap.ttl.6h">{translate('wrap.ttl.6h')}</option>
<option value="259200" data-i18n="wrap.ttl.72h">{translate('wrap.ttl.72h')}</option>
</select>
</label>
<label class="message-text">
<span data-i18n="wrap.data">{translate('wrap.data')}</span>
<textarea id="wrap-data" rows="6" required autocomplete="off" spellcheck="false"></textarea>
</label>
<button id="wrap-submit" class="message-action" type="submit" data-i18n="wrap.submit">{translate('wrap.submit')}</button>
</form>
<div id="wrap-created">
<label>
<span data-i18n="wrap.token">{translate('wrap.token')}</span>
<input id="wrap-token" type="text" readonly disabled spellcheck="false" autocomplete="off" placeholder={translate('wrap.token.empty')} data-i18n-placeholder="wrap.token.empty">
</label>
<button id="wrap-copy" disabled type="button" class="tool" title={translate('wrap.copy')} data-i18n-title="wrap.copy" aria-label={translate('wrap.copy')} data-i18n-aria-label="wrap.copy"></button>
</div>
</section>
<section id="unwrap-panel" class="message-panel" hidden>
<h2 data-i18n="wrap.unwrap.title">{translate('wrap.unwrap.title')}</h2>
<p class="muted" data-i18n="wrap.unwrap.help">{translate('wrap.unwrap.help')}</p>
<form id="unwrap-form">
<label>
<span data-i18n="unwrap.token">{translate('unwrap.token')}</span>
<input id="unwrap-token" type="text" required autocomplete="off" spellcheck="false">
</label>
<button id="unwrap-submit" class="message-action" type="submit" data-i18n="wrap.unwrap">{translate('wrap.unwrap')}</button>
</form>
<div id="unwrap-result" hidden>
<label class="message-text">
<span data-i18n="wrap.result">{translate('wrap.result')}</span>
<textarea id="unwrap-data" rows="6" readonly spellcheck="false"></textarea>
</label>
<button id="unwrap-copy" type="button" class="tool" title={translate('wrap.copy.data')} data-i18n-title="wrap.copy.data" aria-label={translate('wrap.copy.data')} data-i18n-aria-label="wrap.copy.data"></button>
</div>
</section>
</section>
</main>
<footer>{#if footer}{@render footer()}{:else}<span>
<span data-i18n="footer">{translate('footer')}</span>
<span id="vault-place" hidden> · <span id="vault-addr"></span>
</span>
</span>{/if}</footer>
<dialog id="settings">{@render settings?.()}</dialog>
<dialog id="editor">
<form id="editor-form">
<div class="section-head">
<h2 id="editor-title" data-i18n="editor.add">{translate('editor.add')}</h2>
<button type="button" id="close-editor" class="icon" aria-label={translate('close')} data-i18n-aria-label="close">×</button>
</div>
<label>
<span data-i18n="editor.name">{translate('editor.name')}</span>
<input id="key" required pattern="[A-Za-z_][A-Za-z0-9_]*" placeholder="MY_API_TOKEN" autocomplete="off">
</label>
<label>
<span data-i18n="editor.value">{translate('editor.value')}</span>
<textarea id="value" required rows="5" autocomplete="off" spellcheck="false"></textarea>
</label>
<p class="muted" data-i18n="editor.help">{translate('editor.help')}</p>
<button type="submit" data-i18n="save">{translate('save')}</button>
</form>
</dialog>
<dialog id="kv-editor">
<form id="kv-editor-form">
<div class="section-head">
<h2 data-i18n="kv.document">{translate('kv.document')}</h2>
<button type="button" id="kv-editor-close" class="icon" aria-label={translate('close')} data-i18n-aria-label="close">×</button>
</div>
<label>
<span data-i18n="kv.path">{translate('kv.path')}</span>
<input id="kv-editor-path" required autocomplete="off" spellcheck="false">
</label>
<p id="kv-editor-warning" class="muted"></p>
<label>
<span data-i18n="kv.json">{translate('kv.json')}</span>
<textarea id="kv-editor-json" rows="12" required autocomplete="off" spellcheck="false"></textarea>
</label>
<p id="kv-editor-error" class="error" role="alert" hidden></p>
<div class="actions">
<button id="kv-editor-save" type="submit" data-i18n="save">{translate('save')}</button>
<button id="kv-editor-reload" type="button" class="secondary" hidden data-i18n="kv.reload">{translate('kv.reload')}</button>
<button id="kv-editor-cancel" type="button" class="secondary" data-i18n="cancel">{translate('cancel')}</button>
</div>
</form>
</dialog>
<dialog id="confirm">
<form method="dialog">
<p id="confirm-message"></p>
<div class="actions confirm-actions">
<button value="cancel" class="secondary" data-i18n="cancel">{translate('cancel')}</button>
<button value="ok" id="confirm-ok" data-i18n="confirm">{translate('confirm')}</button>
</div>
</form>
</dialog>
<div id="toasts" popover="manual" role="status" aria-live="polite"></div>
