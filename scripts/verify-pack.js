import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, renameSync, rmSync, mkdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve, join, dirname, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {compile} from 'svelte/compiler';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = mkdtempSync(join(root, '.pack-check-'));
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
try {
  // Establish a separate package scope so Node cannot resolve the checkout's self-reference.
  writeFileSync(join(temp, 'package.json'), JSON.stringify({name: 'synthetic-vauth-consumer', type: 'module'}));
  // Exercise the actual prepack lifecycle (build + component tests), not a dry run.
  execFileSync('npm', ['pack', '--pack-destination', temp], {cwd: root, stdio: 'inherit'});
  const archive = join(temp, `${manifest.name}-${manifest.version}.tgz`);
  const files = execFileSync('tar', ['-tzf', archive], {encoding: 'utf8'}).trim().split('\n').sort();
  assert.deepEqual(files, [
    'package/LICENSE', 'package/README.md', 'package/package.json',
    'package/specs/README.md', 'package/specs/VAULT.md', 'package/specs/TOKEN_WRAP.md',
    'package/src/App.svelte', 'package/src/index.js', 'package/src/style.css',
  ].sort());

  const modules = join(temp, 'node_modules');
  mkdirSync(modules);
  execFileSync('tar', ['-xzf', archive, '-C', modules]);
  const packedRoot = join(modules, 'vauth-ui');
  renameSync(join(modules, 'package'), packedRoot);
  // Check the documentation delivered to consumers, including cross-spec anchors.
  for (const file of files.filter(file => file.endsWith('.md'))) {
    const name = file.slice('package/'.length);
    const document = readFileSync(join(packedRoot, name), 'utf8');
    assert.equal(document, readFileSync(join(root, name), 'utf8'));
    if (['specs/VAULT.md', 'specs/TOKEN_WRAP.md'].includes(name))
      assert.ok(document.includes('(README.md#consumer-local-documentation)'), `${name}: missing consumer-local boundary link`);
    for (const [, href] of document.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^[a-z][a-z\d+.-]*:/i.test(href)) continue;
      const [path, fragment] = href.split('#');
      const target = path ? resolve(dirname(join(packedRoot, name)), path) : join(packedRoot, name);
      assert.ok(files.includes(`package/${relative(packedRoot, target).replaceAll('\\', '/')}`), `${name}: unpackaged link ${href}`);
      if (fragment) {
        const headings = [...readFileSync(target, 'utf8').matchAll(/^#{1,6} (.+)$/gm)]
          .map(([, text]) => text.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/ /g, '-'));
        assert.ok(headings.includes(fragment), `${name}: missing anchor ${href}`);
      }
    }
  }
  const require = createRequire(join(temp, 'entry.js'));
  assert.equal(require.resolve('vauth-ui'), join(packedRoot, 'src/index.js'));
  assert.equal(require.resolve('vauth-ui/style.css'), join(packedRoot, 'src/style.css'));
  const packed = JSON.parse(readFileSync(join(packedRoot, 'package.json'), 'utf8'));
  assert.equal(packed.version, manifest.version);
  assert.equal(packed.repository.url, 'git@github.com:131/vauth-ui.git');
  assert.equal(packed.peerDependencies.svelte, '^5.0.0');
  const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  assert.equal(lock.version, manifest.version);
  assert.equal(lock.packages[''].version, manifest.version);
  const source = readFileSync(join(packedRoot, 'src/App.svelte'), 'utf8');
  for (const generate of ['client', 'server']) {
    const result = compile(source, {filename: 'App.svelte', generate});
    assert.equal(result.warnings.length, 0);
  }

  // Compile a separate consumer of the extracted package, including its CSS export.
  writeFileSync(join(temp, 'Consumer.svelte'), `<script>import {App} from 'vauth-ui';</script>
{#snippet login()}<form id="synthetic-login"><button>Connect</button></form>{/snippet}
{#snippet settings()}<button id="synthetic-settings">Settings</button>{/snippet}
<App brand="packed consumer" {login} {settings} />\n`);
  writeFileSync(join(temp, 'entry.js'), "export {default as Consumer} from './Consumer.svelte';\nimport 'vauth-ui/style.css';\n");
  await build({
    configFile: false,
    root: temp,
    plugins: [svelte()],
    resolve: {conditions: ['browser']},
    build: {
      outDir: join(temp, 'dist'),
      lib: {entry: resolve(temp, 'entry.js'), formats: ['es'], fileName: 'consumer'},
      rollupOptions: {external: id => id === 'svelte' || id.startsWith('svelte/')},
    },
  });
  console.log(`Verified ${manifest.name}@${manifest.version}: exact packed files, documentation links, source/CSS exports, client/server compilation and standalone consumer build.`);
} finally {
  // Only remove the disposable directory created by this verification run.
  rmSync(temp, {recursive: true, force: true});
}
