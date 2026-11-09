import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync} from 'node:fs';

// ppackage 2.8 runs this hook before rewriting package.json; use its target version.
const manifest = JSON.parse(readFileSync('package.json', 'utf8'));
const version = process.env.npm_package_version ?? manifest.version;
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
lock.version = version;
lock.packages[''].version = version;
writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');
// ppackage stages its version markers, but does not know about npm's lockfile.
execFileSync('git', ['add', '--', 'package-lock.json'], {stdio: 'inherit'});
