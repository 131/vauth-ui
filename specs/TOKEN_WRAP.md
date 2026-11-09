# One-time secret sharing

[Specification index and defining sources](README.md).
[Vault workspace](VAULT.md) owns tab order, general field actions, links and
session safety. This document owns the wrapping interaction and terminology.
The API below is a consumer-adapter contract, not functions exported or executed
by `vauth-ui`; authentication, transport and session-token persistence stay local.
Delivery variations belong in [consumer-local documentation](README.md#consumer-local-documentation),
not in this shared reference or a claim of identical controller behavior.

## Two tabs, one action each

The separate Send/Open tabs follow the secrets browser; their exact labels are
in [Language & terminology](#language--terminology). The interface and logical
API deal only in text and tokens, not user-entered JSON documents.

- Send: write any nonblank text secret and use the canonical wrapping action.
  Create a single-use Vault token, display it and automatically copy it. The
  user sends that token to the recipient. The lifetime dropdown offers
  **15 min** (default), **6 h** and **72 h**; Vault policies remain authoritative
  and can refuse the selected lifetime. There is no JSON format selector.
- Open: paste a received token and use the canonical unwrapping action. Display
  the original secret directly as read-only text with a copy icon. Do not show
  a JSON response, metadata or an additional reveal step. This action consumes
  the token; it cannot retrieve the secret again.
- Each form has one compact primary button. Token input/output are single-line
  fields. The secret to send and recovered secret use textareas; recovered text
  is read-only. The TTL dropdown precedes the send textarea. Textareas grow with
  the available width/height rather than requiring fixed-size manual resizing.
- Always reserve the generated-token area. Its empty read-only input is grayed
  out and disabled, as is its copy action. Successful wrapping fills/enables it
  without shifting the textarea or primary button.
- Output copy icons copy again without issuing or consuming another token.
  Display the issued token before attempting automatic copying; a clipboard
  failure must retain it for manual copying and keep the source text.

Anyone holding the token can retrieve the secret once before expiry. Vault
response wrapping is not local encryption or a permanent secret store: no KV
document is read/created and no ACL or authentication policy is changed. The
shareable wrapping token is distinct from the application's Vault session token.
Only the wrapping token is deliberate input/output of these forms and copy
actions; session credential handling is defined by the consumer, not these tabs.

## Drafts, errors, reset and stale replies

Wrapping never clears the secret draft, including on success or clipboard
failure. Failed requests retain input and a previously issued wrapping token.
A later successful wrap replaces the displayed token; copying is not another
wrap request. Keep an issued token usable when only copying failed, and report
that failure distinctly from token creation failure.

For a new nonblank unwrap attempt, the reference clears the previous recovered
secret even if retrieval fails. An older output is not the result of a failed
new request. Successful unwrap clears the submitted input token only if it was
not edited during the request. There is no automatic retry. Output retention
and repeat-submission controls are delivered by consumer adapters; their local
variations do not change the token's one-use semantics.

Reconnect and session clearing discard both forms and outputs; destruction of a
consumer UI also discards its in-memory form state. Replies from a previous
session must not repopulate a new one. Locale changes preserve drafts, output
and layout. Apply the [workspace session-safety contract](VAULT.md#links-session-safety-and-verification)
to secret text, wrapping tokens and drafts. Clearing the forms is not a promise
to erase a copied clipboard value; native/browser clipboard policies belong to
[consumer-local documentation](README.md#consumer-local-documentation).

Represent empty input, busy requests, token-created/copied, copy failure,
invalid/expired/used token, incompatible payload, permission/lifetime refusal
and network/HTTP failure explicitly. Keep user input on failure. An incompatible
unwrap response can fail after the token has already been consumed; a lost
response is not safe to retry. Unwrap failure must not renew, replace or clear
the signed-in user's session token. Error messages do not expose raw server
bodies or secret payloads.

## Language & terminology

The operator-provided **en-us wording is canonical**, not a fallback to render
in French or Chinese. fr-fr and zh-cn translate the intent naturally into French
and Simplified Chinese rather than copying English labels or mechanically
transliterating Vault operations.

| en-us | fr-fr | zh-cn |
| --- | --- | --- |
| Send (wrap) a secret | Envoyer (wrap) un secret | 发送 (wrap) 机密 |
| Open (unwrap) a secret | Ouvrir (unwrap) un secret | 打开 (unwrap) 机密 |
| Wrap your secret into a one-time-token | Créer (wrap) un token à usage unique pour votre secret | 为您的机密创建 (wrap) 一次性 token |
| Unwrap your one-time-token | Ouvrir (unwrap) votre token à usage unique | 打开 (unwrap) 您的一次性 token |
| Your one-time-token | Votre token à usage unique | 您的一次性 token |
| Token to open | Token à ouvrir | 要打开的 token |
| Your secret | Votre secret | 您的机密 |
| The secret | Le secret | 机密内容 |
| Valid for | Durée de validité | 有效期 |
| Copy secret | Copier le secret | 复制机密 |

When a control names the operation, its technical hint immediately follows the
localized action: **Send (wrap)** / **Envoyer (wrap)**, **Open (unwrap)** /
**Ouvrir (unwrap)** and **Create (wrap)** / **Créer (wrap)**. The Chinese verbs
are **发送 (wrap)**, **打开 (unwrap)** and **创建 (wrap)**. Apply this to tabs,
headings and buttons using those verbs, followed by the relevant object.
`Wrap`/`Unwrap` already name the operation and need no duplicate hint.
Instructions to actually send the copied token to a recipient are not another
wrap operation and do not acquire a misleading `(wrap)` suffix.

Use **secret**, not “message”, for the user's text throughout labels, help,
notifications and errors. In en-us, **one-time-token** is the canonical label;
“token” is acceptable in surrounding explanations where its purpose is clear.
In fr-fr, keep **token** unchanged and use **token à usage unique** when the
single-use meaning must be explicit. Translate surrounding actions and
explanations; do not copy English action sentences into French controls.
In zh-cn, retain **token**, use **一次性 token** for one-time-token, and localize
actions/help/errors into Simplified Chinese. Preserve `(wrap)` / `(unwrap)`
technical hints in translated tabs/headings and keep API identifiers unchanged.

Do not describe the wrapping token as an encrypted copy of the secret: it grants
one retrieval from Vault. Do not confuse it with the application's session token
or impose a consumer's credential exposure boundary on another consumer.

Each consumer owns its catalog integration. Every field, placeholder, copy
control, status and error has all three locales; canonical actions and their
French/Chinese equivalents are covered by consumer tests. This convention is
scoped to secret sharing, not renaming the rest of the workspace.

## Text-only API

- `wrap(text, ttlSeconds) -> token`: reject non-text/blank input and lifetimes
  outside `900`, `21600`, `259200` seconds before a request. Send
  `POST sys/wrapping/wrap` with the private envelope `{"value": text}` and
  `X-Vault-Wrap-TTL` expressing the selected lifetime. Preserve accepted text
  exactly, including whitespace, Unicode and JSON-like content; do not trim or
  parse the secret.
  Use the normal active-session authentication. Validate the returned
  `wrap_info.token` and positive `wrap_info.ttl`, returning only the token.
- `unwrap(token) -> text`: trim/reject blank tokens, then send exactly one
  `POST sys/wrapping/unwrap`, with the wrapping token only in `X-Vault-Token`.
  Do not put it in a JSON body, send the session token instead, renew the session,
  retry the one-use request or replace the application's session token. Extract
  only the string `data.value`; malformed/incompatible payloads fail explicitly
  after possible consumption. Invalid/expired/used tokens (including the
  existing 400/403 error cases) are unwrap errors, not session-expiry signals.
- JSON encoding/decoding and Vault metadata are private to the consumer's
  request adapter, not a user JSON mode. Preserve that adapter's destination
  trust, transport, timeout and redirect policy. HTTP errors expose no server
  response bodies. The library supplies forms, not a Vault client.

Protocol sources: HashiCorp's
[wrap](https://developer.hashicorp.com/vault/api-docs/system/wrapping-wrap) and
[unwrap](https://developer.hashicorp.com/vault/api-docs/system/wrapping-unwrap)
API documentation; the [defining consumer sources](README.md#defining-sources)
establish the restricted text-only contract above.

## Verification

Consumer checks use synthetic data: exact text/envelope/headers, all three TTLs,
invalid TTL/input, malformed/incompatible responses, network/HTTP failures,
one use/no retry/no session mutation, reserved token geometry, retained drafts,
automatic/repeated copying and clipboard failure, direct text output, locale
terminology, session reset and stale replies. Independent environment/KV
name-copy is covered by the [workspace contract](VAULT.md#read-only-fields-reveal-and-name-copy).
These checks do not prove a live transfer or authorize real Vault writes.
Library composition/pack checks are separate from consumer functional tests.
