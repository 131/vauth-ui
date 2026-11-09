# Functional specifications

`vauth-ui` owns the shared functional Vault UX and its Svelte shell, screens and
styles. Consumer adapters deliver the behavior; authentication, transport,
session renewal and session-token persistence remain consumer-owned.

- [Vault workspace](VAULT.md): navigation, personal environment and immutable
  identity, field actions, accessible KV documents, public-key publication and
  session freshness.
- [One-time secret sharing](TOKEN_WRAP.md): text-only wrap/unwrap, lifetime,
  drafts, errors, copying and canonical en-us/fr-fr/zh-cn terminology.
- [Composition, DOM API and theme](../README.md#composition): technical library
  integration, separate from the functional contract.

## Consumer-local documentation

[vauth-desktop](https://github.com/131/vauth-desktop#readme) owns native
integrations, login/session implementation, configuration, clipboard policy,
window/tray lifecycle and updates.
[Identity](https://git.elipsdev.net/ips/domyks/ivscs/identity/-/blob/master/README.md)
owns browser login/session implementation, browser configuration, storage,
origin/callback security and deployment. These are not shared specifications.

## Defining sources

The functional reference comes from committed vauth-desktop
[WORKSPACE.md](https://github.com/131/vauth-desktop/blob/0a4ff5f6a86a1035e3c447f284f4311624faddc1/specs/WORKSPACE.md),
[VAULT.md](https://github.com/131/vauth-desktop/blob/0a4ff5f6a86a1035e3c447f284f4311624faddc1/specs/VAULT.md) and
[TOKEN_WRAP.md](https://github.com/131/vauth-desktop/blob/0a4ff5f6a86a1035e3c447f284f4311624faddc1/specs/TOKEN_WRAP.md),
and the committed
[Identity README](https://git.elipsdev.net/ips/domyks/ivscs/identity/-/blob/a261630eb93bf3e35c8e6d224085b6fa4bc7f2cc/README.md).
Delivery observations are checked against desktop
[ui/app.js](https://github.com/131/vauth-desktop/blob/0a4ff5f6a86a1035e3c447f284f4311624faddc1/ui/app.js)
and browser
[www/app.js](https://git.elipsdev.net/ips/domyks/ivscs/identity/-/blob/a261630eb93bf3e35c8e6d224085b6fa4bc7f2cc/www/app.js).
These immutable references preserve the original intent; the specifications in
this directory are the canonical shared contract, not consumer-local copies.
