import {afterEach, describe, expect, it} from 'vitest';
import {flushSync, mount, unmount} from 'svelte';
import {App} from 'vauth-ui';
import Composition from './Composition.svelte';
import {readFileSync} from 'node:fs';
const css = readFileSync('src/style.css', 'utf8');
const source = readFileSync('src/App.svelte', 'utf8');

// Frozen compatibility contract: controllers attach after the Svelte mount.
const ids = `version settings-button login workspace greeting account
secrets-tab ssh-tab kv-tab wrap-tab unwrap-tab secrets-panel count refresh add search environment-denied entries
ssh-panel ssh-status ssh-form ssh-key kv-panel kv-refresh kv-new kv-mount kv-breadcrumbs kv-filter kv-folders
kv-document-path kv-edit kv-delete kv-message kv-values wrap-panel wrap-form wrap-ttl wrap-data wrap-submit
wrap-created wrap-token wrap-copy unwrap-panel unwrap-form unwrap-token unwrap-submit unwrap-result unwrap-data
unwrap-copy vault-place vault-addr settings editor editor-form editor-title close-editor key value
kv-editor kv-editor-form kv-editor-close kv-editor-path kv-editor-warning kv-editor-json kv-editor-error
kv-editor-save kv-editor-reload kv-editor-cancel confirm confirm-message confirm-ok toasts`.split(/\s+/);
let instance;
const $ = id => document.getElementById(id);
function render(component = App, props = {}) {
  instance = mount(component, {target: document.body, props});
  flushSync();
  return instance;
}
afterEach(async () => {
  if (instance) await unmount(instance);
  instance = null;
  document.body.replaceChildren();
});

it('mounts the real shared workspace once with every stable DOM ID', () => {
  render();
  expect(document.querySelector('.brand').textContent).toBe('vauth');
  expect($('version').textContent).toBe('');
  const actual = [...document.querySelectorAll('[id]')].map(node => node.id);
  expect(actual.sort()).toEqual([...ids].sort());
  expect(new Set(actual).size).toBe(actual.length);
  expect($('login').hidden).toBe(false);
  expect($('workspace').hidden).toBe(true);
  for (const name of ['secrets', 'ssh', 'kv', 'wrap', 'unwrap']) {
    expect($(name + '-panel').hidden).toBe(name !== 'secrets');
  }
  expect($('secrets-tab').classList.contains('active')).toBe(true);
  expect($('entries').children.length).toBe(0);
  expect($('kv-folders').children.length).toBe(0);
  expect($('kv-values').children.length).toBe(0);
  expect(document.querySelectorAll('header, main, footer').length).toBe(3);
});

it('retains safe form, dialog and clipboard initial states', () => {
  render();
  expect($('key').pattern).toBe('[A-Za-z_][A-Za-z0-9_]*');
  expect($('key').required).toBe(true);
  expect($('value').required).toBe(true);
  expect($('wrap-form').contains($('wrap-data'))).toBe(true);
  expect([...$('wrap-ttl').options].map(option => option.value)).toEqual(['900', '21600', '259200']);
  expect($('wrap-token').readOnly).toBe(true);
  expect($('wrap-token').disabled).toBe(true);
  expect($('wrap-copy').disabled).toBe(true);
  expect($('unwrap-result').hidden).toBe(true);
  expect($('unwrap-data').readOnly).toBe(true);
  for (const id of ['settings', 'editor', 'kv-editor', 'confirm']) expect($(id).tagName).toBe('DIALOG');
  expect($('confirm').querySelector('form').method).toBe('dialog');
  expect($('confirm-ok').value).toBe('ok');
  expect($('confirm').querySelector('[value="cancel"]')).not.toBeNull();
  expect($('toasts').getAttribute('popover')).toBe('manual');
  expect($('toasts').getAttribute('aria-live')).toBe('polite');
});

it('initializes locale text and attributes without marking structural containers', () => {
  render(App, {t: key => `translated:${key}`, brand: 'synthetic', version: '0.1.0'});
  expect($('version').textContent).toBe(' / v0.1.0');
  expect($('secrets-tab').textContent).toBe('translated:tab.secrets');
  expect($('search').placeholder).toBe('translated:search.placeholder');
  expect($('settings-button').title).toBe('translated:settings');
  expect($('settings-button').getAttribute('aria-label')).toBe('translated:settings');
  expect($('kv-filter').getAttribute('data-i18n-aria-label')).toBe('kv.filter');
  for (const node of document.querySelectorAll('[data-i18n]')) expect(node.children.length).toBe(0);
});

describe.each(['identity', 'desktop'])('%s synthetic composition', mode => {
  it('renders consumer snippets in the common shell without ID collisions', () => {
    render(Composition, {mode});
    expect($('login').contains($('login-form'))).toBe(true);
    expect($('settings').contains($('language'))).toBe(true);
    expect($('settings').contains($('current-version'))).toBe(true);
    expect($('callback').parentElement.tagName).toBe('MAIN');
    expect($('login').contains($('callback'))).toBe(false);
    expect($('workspace').contains($('callback'))).toBe(false);
    expect($('custom-ssh-intro')).not.toBeNull();
    expect(document.querySelector('[data-i18n="ssh.help"]')).toBeNull();
    expect(Boolean($('agent-keys'))).toBe(mode === 'desktop');
    const actual = [...document.querySelectorAll('[id]')].map(node => node.id);
    expect(new Set(actual).size).toBe(actual.length);
    for (const id of ids) expect($(id), id).not.toBeNull();
  });
});

it('supports full header/footer overrides without duplicating controller IDs', () => {
  render(Composition, {mode: 'desktop', customChrome: true});
  expect($('custom-header').closest('header')).not.toBeNull();
  expect($('custom-footer').closest('footer')).not.toBeNull();
  expect($('caption-close')).not.toBeNull();
  for (const id of ['version', 'settings-button', 'vault-place', 'vault-addr']) {
    expect(document.querySelectorAll(`#${id}`).length).toBe(1);
  }
});

it('lets controllers own visibility, translated leaves, fields and listeners after mounting', () => {
  const app = render(Composition);
  const entries = $('entries'), editor = $('editor-title');
  const row = document.createElement('div'); row.className = 'entry'; row.textContent = 'synthetic secret';
  entries.append(row);
  $('key').value = 'MY_TEST_TOKEN'; $('value').value = 'synthetic-value';
  $('login').hidden = true; $('workspace').hidden = false;
  $('secrets-tab').textContent = 'Secrets translated by controller';
  $('search').placeholder = 'Controller search';
  $('settings-button').title = 'Controller settings';
  editor.textContent = 'Editing synthetic value';
  let clicks = 0;
  $('refresh').addEventListener('click', () => { clicks++; });
  app.updateProps(); flushSync();
  expect(document.querySelector('.brand').textContent).toContain('changed-vault');
  expect($('version').textContent).toBe(' / v1.2.4');
  expect($('entries')).toBe(entries);
  expect(entries.firstElementChild).toBe(row);
  expect($('editor-title')).toBe(editor);
  expect(editor.textContent).toBe('Editing synthetic value');
  expect($('secrets-tab').textContent).toBe('Secrets translated by controller');
  expect($('search').placeholder).toBe('Controller search');
  expect($('settings-button').title).toBe('Controller settings');
  expect($('key').value).toBe('MY_TEST_TOKEN');
  expect($('value').value).toBe('synthetic-value');
  expect($('workspace').hidden).toBe(false);
  expect($('login').hidden).toBe(true);
  $('refresh').click(); expect(clicks).toBe(1);
  expect($('wrap-tab').textContent).toBe('initial:tab.wrap');
});

it('keeps shared CSS hidden behavior and theme offsets platform neutral', () => {
  expect(css).toMatch(/\[hidden\]\s*\{\s*display:none!important/);
  expect(css).toContain('var(--vauth-toast-top, 3rem)');
  expect(css).not.toMatch(/wails|Windows|native caption|#caption-|#update-|#login-role|#agent-keys/);
  expect(css).toContain('var(--vauth-accent)');
  expect(css).toContain('prefers-reduced-motion');
  expect(source).not.toContain('@html');
});
