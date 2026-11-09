// @vitest-environment node
import {expect, it} from 'vitest';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {join, resolve} from 'node:path';

it('synchronizes and stages the target lock version before ppackage rewrites the manifest', () => {
  const temp = mkdtempSync(resolve('.pack-check-version-'));
  try {
    execFileSync('git', ['init', '-q', temp]);
    writeFileSync(join(temp, 'package.json'), JSON.stringify({version: '0.0.0'}));
    const dependencies = {svelte: {version: '5.57.3', integrity: 'synthetic-integrity'}};
    writeFileSync(join(temp, 'package-lock.json'), JSON.stringify({
      version: '0.0.0', lockfileVersion: 3,
      packages: {'': {name: 'vauth-ui', version: '0.0.0'}, ...dependencies},
    }));
    execFileSync(process.execPath, [resolve('scripts/sync-version.js')], {
      cwd: temp, env: {...process.env, npm_package_version: '0.1.0'},
    });
    const lock = JSON.parse(readFileSync(join(temp, 'package-lock.json'), 'utf8'));
    expect(lock.version).toBe('0.1.0');
    expect(lock.packages[''].version).toBe('0.1.0');
    expect(lock.packages.svelte).toEqual(dependencies.svelte);
    expect(JSON.parse(readFileSync(join(temp, 'package.json'), 'utf8')).version).toBe('0.0.0');
    const staged = execFileSync('git', ['show', ':package-lock.json'], {cwd: temp, encoding: 'utf8'});
    expect(JSON.parse(staged).version).toBe('0.1.0');
  } finally {
    rmSync(temp, {recursive: true, force: true});
  }
});
