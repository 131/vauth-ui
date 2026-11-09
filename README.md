# vauth-ui

An alternative to Vault UI

A shared **Svelte 5 personal Vault workspace**, not an administrative policy UI.
It presents personal environment secrets, SSH public-key publication, KV documents,
and one-use wrap/unwrap messages. The same real Svelte markup serves
**vauth-desktop** and the **Identity web companion**.

## Composition

```svelte
<script>
  import {App} from 'vauth-ui';
  import 'vauth-ui/style.css';

  // Use your existing locale translator. This is a plain function, not a store.
  const t = (key, ...args) => messages[key] ?? key;
</script>

{#snippet login()}
  <div class="login-card">
    <form id="login-form">
      <label>Role <input id="login-role" autocomplete="username"></label>
      <button id="connect" type="submit">Connect</button>
    </form>
  </div>
{/snippet}

{#snippet settings()}
  <div class="settings-body">
    <div class="section-head">
      <h2>Settings</h2>
      <button id="close-settings" class="icon" type="button">×</button>
    </div>
    <label class="setting">Language
      <select id="language"><option value="en-us">English</option></select>
    </label>
    <span id="current-version"></span>
  </div>
{/snippet}

{#snippet workspaceActions()}
  <button id="logout" class="secondary" type="button">Sign out</button>
{/snippet}

{#snippet callback()}
  <section id="callback" hidden><p>Authentication completed.</p></section>
{/snippet}

<App {t} brand="identity" {login} {settings} {workspaceActions} {callback} />
```

This is a composition example, not a complete login controller. Include all
consumer-specific IDs and locale hooks needed by your own controllers.

Mount your composing component **before** attaching existing controllers:

```js
import {flushSync, mount} from 'svelte';
import Consumer from './Consumer.svelte';

const ui = flushSync(() => mount(Consumer, {target: document.body}));
// Now attach the application's existing auth, Vault and DOM controllers.
```

The stylesheet is an opt-in, global full-page layout. Mount into `document.body`,
or make your own mount container a full-height flex column. Mount one `App` per
page: the stable IDs are intentionally global. Do not hydrate controller-mutated
markup or remount during an active session.

### Props and snippets

| Prop | Contract |
| --- | --- |
| `t` | `(key, ...args) => string`; defaults to returning the key; initialized once at mount |
| `brand` | String, default `vauth` |
| `version` | Optional string; the default header displays ` / v{version}` |
| `login` | Contents of `section#login`; consumer owns its login form, states and IDs |
| `settings` | Contents of `dialog#settings`; consumer owns language controls, close button and platform settings |
| `workspaceActions` | Contents of the welcome `.actions` group |
| `sshIntro` | Replaces the default translated `ssh.help` paragraph |
| `sshSource` | Additional content after `#ssh-status`, before the shared publication form |
| `header` | Replaces contents of the shared `<header>` |
| `footer` | Replaces contents of the shared `<footer>` |
| `callback` | Optional content in `<main>`, outside both login and workspace |

Snippets take no arguments and are rendered with Svelte `{@render ...}`. Empty
optional snippets need no platform flags. Header/footer replacements must supply
`#version`/`#settings-button` and `#vault-place`/`#vault-addr` respectively when the
consumer controller expects those IDs. Settings snippets supply
`#close-settings`, `#language`, `#current-version` and any platform-specific IDs.

For example, desktop composes native caption controls in `header`, SSH agent
entries in `sshSource`, and update settings in `settings`. Identity composes OIDC
login, browser settings, workspace actions and a callback section. The library
does not detect either platform or implement its runtime.

## DOM ownership and locale updates

Svelte creates the shared shell and forms. After mount, the consumer controllers
own visibility, active tabs, field values, dialog state, dynamic entries,
breadcrumbs, document values, greetings, editor titles and toasts. No shared
markup uses `@html`. No shared component handles authentication, tokens,
clipboard operations, Vault requests, permissions or persistence.

Shared `data-i18n` markers are **text-only leaves**, never structural containers.
The existing Identity translator can replace their `textContent` without losing
inputs, forms, snippets or controls. `data-i18n-title`,
`data-i18n-aria-label` and `data-i18n-placeholder` markers remain on controls.
The shared component captures `t` once using `untrack`: later replacement of `t`
is deliberately not a locale update. Use the existing DOM translator for later
locale changes; dynamic controller-rendered rows use the controller's translator.
Brand/version updates do not overwrite controller-owned translated leaves.

Keep snippet identities stable once controllers are attached. Replacing a
snippet creates a new subtree and requires reattaching its controller; it is not
an in-session settings or authentication update API. Snippets should likewise
avoid reactive text updates that compete with DOM-owned locale leaves.

### Stable shared IDs

The contract follows Identity's common IDs (also matching the existing desktop
shared controls). Login/settings/platform-only IDs are supplied by consumers.

- Shell: `login`, `workspace`, `version`, `settings-button`, `greeting`, `account`,
  `vault-place`, `vault-addr`, `settings`.
- Navigation: `secrets-tab`, `ssh-tab`, `kv-tab`, `wrap-tab`, `unwrap-tab`, with
  matching `secrets-panel`, `ssh-panel`, `kv-panel`, `wrap-panel`, `unwrap-panel`.
- Environment: `count`, `refresh`, `add`, `search`, `environment-denied`, `entries`.
- SSH: `ssh-status`, `ssh-form`, `ssh-key`.
- KV: `kv-refresh`, `kv-new`, `kv-mount`, `kv-breadcrumbs`, `kv-filter`, `kv-folders`,
  `kv-document-path`, `kv-edit`, `kv-delete`, `kv-message`, `kv-values`.
- Wrap: `wrap-form`, `wrap-ttl`, `wrap-data`, `wrap-submit`, `wrap-created`,
  `wrap-token`, `wrap-copy`. TTL values: `900`, `21600`, `259200` seconds.
- Unwrap: `unwrap-form`, `unwrap-token`, `unwrap-submit`, `unwrap-result`,
  `unwrap-data`, `unwrap-copy`.
- Environment editor: `editor`, `editor-form`, `editor-title`, `close-editor`,
  `key`, `value`.
- KV editor: `kv-editor`, `kv-editor-form`, `kv-editor-close`, `kv-editor-path`,
  `kv-editor-warning`, `kv-editor-json`, `kv-editor-error`, `kv-editor-save`,
  `kv-editor-reload`, `kv-editor-cancel`.
- Confirmation: `confirm`, `confirm-message`, `confirm-ok`; native dialog form
  return values `cancel` and `ok`.
- Notifications: `toasts`, a manual popover with a polite live region.

Workspace and all panels except environment start hidden. Generated wrap tokens
start read-only/disabled, copy starts disabled and unwrap results start hidden.
The stylesheet preserves `[hidden]` even for flex layouts. Controllers enable,
show and populate these elements; the library adds no competing event listeners.

## Theme

Override the shared CSS variables in your own stylesheet, loaded after the shared
stylesheet. Keep platform-only styling in the consumer.

```css
:root {
  --vauth-brand: #254c75;
  --vauth-accent: #315f91;
  --vauth-text: #24342f;
  --vauth-background: #f7f9f6;
  --vauth-surface: #fff;
  --vauth-line: #e1e7df;
  --vauth-font: system-ui, sans-serif;
  --vauth-toast-top: 3rem;
}
```

`--vauth-toast-top` defaults to `3rem`, clear of the standard header. A desktop
consumer may set `42px` to suit its own caption. Native caption hit-testing,
agent-list layout and update-specific styling stay in desktop, not library CSS.

## Development and packaging

Node 22 with npm; dev dependencies are exact-pinned, Svelte peer compatibility
remains `^5.0.0`. Consumers compile the `.svelte` source using their Svelte tooling.
The public exports are `src/index.js` (named `App`) and `style.css`
(`src/style.css`). The development Vite bundle is a build check, not the package
entry point. CSS is opt-in and marked side-effectful for consumer bundlers.

```sh
npm ci
npm run check
npm run test:pack
```

Synthetic tests exercise default DOM IDs, browser/desktop snippet composition,
full header/footer overrides, locale markers, initial forms/dialogs, controller
mutation and persistence through brand/version changes. Pack verification runs
actual `npm pack` and its prepack lifecycle, checks the exact artifact contents,
resolves both package exports, compiles client/server source, and builds a
separate consuming component with CSS from the extracted tarball. No real
accounts, credentials, Vault mutations or native runtime are used.

## Release workflow

The unpublished scaffold starts at `0.0.0`. For an authorized first release,
commit functional changes and ensure a clean checkout including untracked files,
then run `ppackage version minor` to prepare `0.1.0`. Do not manually bump the
manifest or create parallel release tags. The `version` hook uses ppackage's
`npm_package_version` target (its hook runs before the manifest rewrite), updates
both lockfile version markers and stages the lockfile for the release commit.
This ordering is covered by a synthetic Git test.

Review the version commit/tag and push the branch and exact tag only when
publication is authorized. The tag-triggered GitHub workflow checks tag/version
agreement, runs clean-install tests and pack verification, then attaches the npm
tarball and `SHA256SUMS` to a GitHub release. No npm registry credentials are
required: the two consumers can install the versioned release tarball and verify
its checksum. The workflow uses a `production` environment and the scoped
GitHub Actions token; no credential is stored here. Verify the CI result, release
assets and checksum before updating either consumer. Branch/PR CI performs the
same pack checks without publishing. An npm registry publication, if desired,
is a separately authorized `npm publish` of the verified tarball.

## License and credits

ISC. Shared markup and presentation are extracted from vauth-desktop and the
Identity web companion. The original **Copyright (c) 2026, François Leurent**
and full ISC permission and disclaimer are preserved in `LICENSE` and included
in the npm archive. Project attribution uses fleurent; the original legal notice
is retained verbatim.
