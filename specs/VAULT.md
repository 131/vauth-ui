# Personal Vault workspace

[Specification index and defining sources](README.md).

## Ownership and delivery

This is the shared functional reference for the personal Vault workspace, not
an administrative policy UI. `vauth-ui` owns this UX contract and provides the
Svelte shell, forms, dialogs, notification host and styles. The consumers attach
controllers after mount and supply data, permissions, actions and lifecycle.

The library does not implement authentication, Vault/RPC transport, capability
lookups, session renewal, session-token persistence or clipboard operations.
Those are adapter responsibilities. The behaviors below preserve the source
specifications as a functional reference, not an assertion of identical adapter
behavior or executable library features. Local disclosure, entry
flows, refresh strategies and validation mechanics belong in the
[consumer-local documentation](README.md#consumer-local-documentation); library
integration is defined by the [technical composition contract](../README.md#composition).

## Navigation

The signed-in workspace has exactly five tabs, in this order, using the
operator-selected canonical en-us labels, including “Environnement”:

1. **Vauth Secured Environnement (venv)**: personal variables and immutable
   Vault identity metadata in one list.
2. **SSH Keys**: the current user's public-key publication.
3. **Secrets browser**: embedded navigation and editing of accessible KV stores.
4. **Send (wrap) a secret**: text-to-token sharing.
5. **Open (unwrap) a secret**: token-to-text retrieval.

The environment is the normal default; consumer-local sign-in/enrollment flows
may select another entry tab without changing the tab order. Navigation wraps
at narrow widths; KV work stays embedded, independent of external authentication
or release links.

Controls are catalog-backed in en-us, fr-fr and zh-cn. Secret-sharing wording is
defined only in [Language & terminology](TOKEN_WRAP.md#language--terminology);
that convention does not rename other previously selected workspace labels.
The complete wrapping interaction and API are in [TOKEN_WRAP.md](TOKEN_WRAP.md).

## Personal environment and immutable identity

### Sources, precedence and search

- Merge the personal KV v2 `.vauth_database` dictionary and connected Vault
  entity metadata into one list. The consumer resolves the authenticated
  user's personal document; its configuration is local.
- Identity metadata wins on duplicate names. Show each name once, including
  all available profile metadata, with a read-only badge on identity rows.
- Exclude protected names from the editable dictionary. The established
  reserved names are `VAUTH_USER_LOGIN`, `VAUTH_USER_NAME` and `VAUTH_USER_MAIL`;
  every name in the current identity profile is also protected. A personal
  collision does not make identity editable or change the displayed identity.
- Search the entire merged list by variable name, case-insensitively. Counts
  describe the visible filtered merged list, not just personal variables.
  Distinguish an empty list from no search match.
- Keep compact, aligned rows, read-only display fields, icon tools, fixed
  right-hand actions and a scrolling list. Read-only display styling does not
  remove personal-variable CRUD; identity metadata itself is immutable.

### Personal writes and refresh

Add and Edit use dialogs with explicit Save/Cancel, not inline editing; Delete
requires confirmation. New variable names are trimmed, uppercased and validated
as environment names (`[A-Z_][A-Z0-9_]*`); duplicate or reserved names fail
explicitly. Existing variable names are not renamed by the edit dialog.
Environment text is distinct from the typed raw KV editor below.

Writes replace the personal dictionary using its read version for KV v2
compare-and-set (CAS), or zero for initial creation. Keep an unsaved edit on a
failed write or conflict; do not silently overwrite a newer version. Environment
writes cannot overwrite/remove identity metadata or create a personal override
for a protected name. Validation belongs at the consumer's write boundary,
not just in hidden buttons; its implementation is consumer-local.

Refresh reloads environment data without losing search; profile freshness is
delivered by the consumer adapter. An unavailable personal read is not a failed
sign-in or a reason to block other tabs. Preserve available
identity rows, report the environment error and disable Add until the database
has loaded. A missing personal document can be an empty dictionary with version
zero; access denial is not the same state.

This view shows the personal-variable and identity sources used by venv. It does
not resolve project macros or launch a shell.

## Read-only fields, reveal and name-copy

Personal secrets and KV document values are masked by default in both consumers.
Use a fixed placeholder: neither the actual value nor its length appears in the
masked input. Reveal/hide, selection of revealed text and explicit value-copy
remain available. Clicking a field without an active text selection can toggle
its visibility. Masking describes the display, not encryption or absence of the
fetched value from the consumer's memory.

Identity metadata remains immutable, selectable and copyable. Its default
visibility follows the [consumer-local disclosure policy](README.md#consumer-local-documentation),
not a shared masking requirement. Personal secrets and KV values retain their
default masking independently of that policy.

An environment/KV name is a keyboard-accessible copy button. Activating it copies
only the name, without revealing or copying the value. Value-copy is a separate
labeled action and copies the actual value even if its field is masked. Icon
controls have accessible names; report copy success/failure without discarding
the displayed value. Clipboard implementation and platform policy are local.

## Accessible KV browser

### Discovery, routes and navigation

“KV store only” means every accessible engine of type `kv`, not a mount named
`kv/` or a configured allowlist. Discover through `sys/internal/ui/mounts`, not
administrative mount enumeration. Keep full mount paths and KV versions, offer a
mount selector and support KV v1/v2. Discovery failures and unsupported-version
states are explicit; discovery/filtering mechanics remain consumer-local.

Build routes from the selected discovered mount and a logical relative path:

| Operation | KV v1 | KV v2 |
| --- | --- | --- |
| List folder | `<mount>/<folder>` | `<mount>/metadata/<folder>` |
| Read document (GET) | `<mount>/<path>` | `<mount>/data/<path>` |
| Save document (POST) | `<mount>/<path>` | `<mount>/data/<path>` |
| Delete document (DELETE) | `<mount>/<path>` | `<mount>/data/<path>` |

Current adapters list folders using `GET` with `list=true`. The mount may
contain multiple path segments. Request-boundary validation rejects
traversal, arbitrary/API routes, encoded escapes and crossings into another or
non-KV mount; UI filtering alone is insufficient. Consumers implement these
guards; the library does not construct or authorize requests.

Start at the selected mount's root. List only the current folder, distinguish
folders/documents, and provide clickable breadcrumbs, parent navigation and
refresh. A local name filter applies only to that folder. Selecting a folder
lists it; selecting a document reads it. Display the mount, current path and
selected document clearly. Fetch lazily, without recursive crawling or global
search. Mount changes clear the previous selection.

### Values, permissions and editing

Documents are not environment entries: preserve their key names, case, nested
structure and JSON value types. Do not uppercase keys or flatten objects.
Strings display as text; other values display/copy their JSON representation.
Use the [masked field and independent name-copy behavior](#read-only-fields-reveal-and-name-copy).

Query `sys/capabilities-self` for the exact target API path, including the
metadata route for listing and the data route for KV v2 documents. Root-level
rights or denial do not establish descendant rights. Evaluate permissions when
selecting a document or preparing a new target. Offer create/update/delete only
for the corresponding capabilities; an unreadable document is not an empty
readable document. Vault remains authoritative for every actual operation.

Create/Edit opens the modal whole-document JSON object editor with explicit
Save/Cancel. Validate the entire document before submitting: the top level is
an object, not null, an array or a scalar. Preserve strings, objects, arrays,
booleans, numbers and null values within it. Adding/changing/removing a field
saves the resulting whole document, not an accidental stringified substitute.

For a new target, the path is editable and its exact capabilities are evaluated;
an existing document keeps its path. KV v2 uses CAS zero for creation and the
version originally read for editing. A conflict retains the unsaved draft and
offers Reload; warn before replacing it. Do not silently retry or merge by
overwriting newer data. KV v1 has no equivalent CAS; show that limitation before
saving rather than claiming conflict protection.

Deletion requires confirmation identifying the mount/document and its deletion
semantics. KV v2 deletes the current version softly; no permanent destroy,
metadata purge, restore or version-history workflow is offered. KV v1 deletion
removes the document permanently; the reference makes its irreversible nature
explicit in confirmation. Dialog delivery remains consumer-owned.

On a denied operation, keep an edit draft, report the error and refresh affected
permissions. Do not grant permissions, change policies, alter mount settings,
bypass ACLs or switch to an administrator token.

The environment view and raw KV editor can address the same `.vauth_database`.
The reference invalidates/reloads affected views after writes; environment
writes still protect identity. Cache and refresh delivery are consumer-local.

### Functional states and freshness

Distinguish loading, no accessible KV mounts, empty folder, no filter match,
no selected document, missing document, access denied, unsupported version,
request failure and conflict. Never present an old document's values under a
new selection or treat a failed request as a successful empty result.

Folder navigation, mount changes and refresh clear revealed values. An older
selection's response cannot replace a newer selection. Reconnect/session changes
clear browser data and permissions and rediscover mounts for the current
session. Warn before abandoning an unsaved edit; successful writes/deletes
refresh the affected folder/document and notify the user. Busy operations,
errors and notices must remain usable with the editor/confirmation dialogs open.

## Public-key publication and first enrollment

SSH Keys reads the connected user's authorized public keys and accepts manual
public-key entry. Publishing one public key replaces `public_keys` on that
user's `auth/<ssh path>/role/<login>` after confirmation, not on another user's
role. Validate public-key input; never accept private-key material. The request
uses the current session's rights and reports publication errors explicitly.
The reference checks capabilities on the exact role; consumer adapters deliver
permission evaluation and Vault remains authoritative.

First enrollment does not require a previously authorized SSH key or a successful
personal `.vauth_database` read. After sign-in, publication remains reachable
independently of personal KV. Manual entry remains available independently of
key-source integrations. Authentication and key-source integration belong in
consumer-local docs. Publication does not silently change authentication methods.

Show loading, no authorized public keys, validation/permission failures and
successful publication, then refresh the displayed authorization state. The
current user's authenticated identity, not an arbitrary role editor, determines
the target. Mount configuration and other users' roles are outside this UI.

## Links, session safety and verification

Use the active consumer session and its authentication-specific freshness
behavior. Expiry/revocation and session clearing discard displayed secret data
and drafts; late replies cannot repopulate a replacement session. Shared fields
and controllers must not persist secret values, wrapping tokens or edit drafts
to settings, storage, logs or handoffs. Session-token persistence and exposure
are consumer-specific, not a library policy.

KV operations remain embedded: they do not open remote Vault content, create
child tokens or pass credentials in navigation URLs. A native Vault UI link, if
provided by a consumer, is a plain URL with independent sign-in, not a session-
or wrapping-token link. Authentication and release links are separate local
integrations. HTTP errors do not display raw server diagnostics or secret
payloads; destination trust and redirect handling remain adapter-owned.

Consumer verification covers merged precedence/protected names/search/counts,
CAS CRUD and independent name-copy under the consumer's disclosure policy; KV discovery/routes,
exact-path ACLs, v1/v2 types/deletion/conflicts/drafts/navigation, failures and
stale replies; and first manual enrollment without personal KV. Use synthetic
data and screenshots. A live write or replacement of a real public key needs
separate targeted authorization; automated checks do not prove real enrollment.
Wrapping-specific verification is in [TOKEN_WRAP.md](TOKEN_WRAP.md#verification).
Library tests verify composition and packaging, not live Vault or native runtime.
