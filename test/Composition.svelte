<script>
  import {App} from 'vauth-ui';

  let {mode = 'identity', customChrome = false} = $props();
  let brand = $state('test-vault');
  let version = $state('1.2.3');
  let locale = $state('initial');
  let t = $state((key) => `${locale}:${key}`);

  export function updateProps() {
    brand = 'changed-vault';
    version = '1.2.4';
    locale = 'replacement';
    t = (key) => `replacement:${key}`;
  }
</script>

{#snippet login()}
  <form id="login-form">
    {#if mode === 'identity'}<input id="login-role" autocomplete="username">{/if}
    <button id="connect" type="submit">Connect</button>
    {#if mode === 'desktop'}<button id="sso-login" type="button">SSO</button><button id="sso-cancel" hidden>Cancel</button>{/if}
    <p id="sso-wait" hidden>Waiting</p>
    <div id="login-error" hidden><span id="login-error-text"></span></div>
  </form>
{/snippet}
{#snippet settings()}
  <div class="settings-body">
    <button id="close-settings" type="button">Close</button>
    <label>Language<select id="language"><option value="en-us">English</option><option value="fr-fr">Français</option></select></label>
    <span id="current-version"></span>
    {#if mode === 'identity'}<input id="settings-role"><button id="settings-save">Save</button>
    {:else}<input id="update-enable" type="checkbox"><select id="channel"><option>stable</option></select><button id="check-update">Check</button>{/if}
  </div>
{/snippet}
{#snippet workspaceActions()}
  {#if mode === 'identity'}<a id="browse-vault" href="https://example.invalid">Vault</a><button id="logout">Logout</button>
  {:else}<button id="continue-ssh">Continue with SSH</button><button id="reconnect">Reconnect</button>{/if}
{/snippet}
{#snippet sshIntro()}<p id="custom-ssh-intro">Synthetic SSH introduction</p>{/snippet}
{#snippet sshSource()}{#if mode === 'desktop'}<div id="agent-keys"></div>{/if}{/snippet}
{#snippet callback()}<section id="callback" hidden><p>Callback completed</p></section>{/snippet}
{#snippet header()}
  <span id="custom-header" class="brand">Custom header <span id="version"></span></span>
  <button id="settings-button" type="button">Settings</button><button id="caption-close" type="button">Close</button>
{/snippet}
{#snippet footer()}<span id="custom-footer">Custom footer <span id="vault-place" hidden><span id="vault-addr"></span></span></span>{/snippet}

<App {t} {brand} {version} {login} {settings} {workspaceActions} {sshIntro} {sshSource} {callback}
  header={customChrome ? header : undefined} footer={customChrome ? footer : undefined} />
