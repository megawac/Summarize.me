#!/usr/bin/env bun
// Usage: bun run scripts/bun-tasks.js <task>

import fs from 'fs';
import path from 'path';
import less from 'less';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import csscomb from 'csscomb';
import { JSHINT } from 'jshint';
import chokidar from 'chokidar';
import liveServer from 'live-server';
import fg from 'fast-glob';
import { createRequire } from 'module';
import ts from 'typescript';

const ROOT = process.cwd();
const CSSCOMB_CONFIG_PATH = path.join(ROOT, 'less/.csscomb.json');
const CSSLINT_CONFIG_PATH = path.join(ROOT, 'less/.csslintrc');
const TSCONFIG_PATH = path.join(ROOT, 'tsconfig.json');
const JS_PATTERNS = ['js/**/*.js', '!js/vendor/**'];
const CSS_PATTERNS = ['css/**/*.css'];
const cssComb = new csscomb();
const require = createRequire(import.meta.url);
const { CSSLint } = require('csslint');
let csslintRuleset;

if (fs.existsSync(CSSCOMB_CONFIG_PATH)) {
  const config = JSON.parse(fs.readFileSync(CSSCOMB_CONFIG_PATH, 'utf8'));
  cssComb.configure(config);
}

if (fs.existsSync(CSSLINT_CONFIG_PATH)) {
  const config = JSON.parse(fs.readFileSync(CSSLINT_CONFIG_PATH, 'utf8'));
  csslintRuleset = {};
  Object.entries(config).forEach(([rule, value]) => {
    if (typeof value === 'boolean') {
      csslintRuleset[rule] = value ? 2 : 0;
    } else {
      csslintRuleset[rule] = value;
    }
  });
}

function toAbsolute(relativeOrAbsolute) {
  return path.isAbsolute(relativeOrAbsolute) ? relativeOrAbsolute : path.join(ROOT, relativeOrAbsolute);
}

function toRelative(absoluteOrRelative) {
  return path.isAbsolute(absoluteOrRelative) ? path.relative(ROOT, absoluteOrRelative) : absoluteOrRelative;
}

const formatHost = {
  getCanonicalFileName: (filePath) => filePath,
  getCurrentDirectory: () => ROOT,
  getNewLine: () => '\n'
};

function compileTypescript({ noEmit = false } = {}) {
  if (!fs.existsSync(TSCONFIG_PATH)) {
    return;
  }

  const configFile = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);
  if (configFile.error) {
    console.error(ts.formatDiagnostic(configFile.error, formatHost));
    process.exitCode = 1;
    return;
  }

  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(TSCONFIG_PATH));
  parsed.options.noEmit = noEmit;

  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const diagnostics = [...ts.getPreEmitDiagnostics(program)];

  if (!noEmit) {
    const emitResult = program.emit();
    diagnostics.push(...emitResult.diagnostics);
    if (emitResult.emitSkipped) {
      process.exitCode = 1;
    }
  }

  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
    process.exitCode = 1;
  }
}

async function compileLess(inputFile, outFile) {
  const entryPath = toAbsolute(inputFile);
  const content = await fs.promises.readFile(entryPath, 'utf8');
  const output = await less.render(content, {
    filename: entryPath,
    paths: [path.dirname(entryPath)],
    strictMath: true,
    ieCompat: true
  });
  await fs.promises.writeFile(toAbsolute(outFile), output.css, 'utf8');
  console.log('Wrote', outFile);
}

async function runAutoprefix(file) {
  const css = await fs.promises.readFile(path.join(ROOT, file), 'utf8');
  const result = await postcss([autoprefixer({ overrideBrowserslist: ['ie > 7', 'firefox > 3', 'chrome > 5', 'safari > 3', 'Opera > 10', 'bb > 10', 'iOS > 10'] })]).process(css, { from: file, to: file });
  await fs.promises.writeFile(path.join(ROOT, file), result.css, 'utf8');
  console.log('Autoprefixed', file);
}

async function runCsscomb(file) {
  const absPath = toAbsolute(file);
  const content = await fs.promises.readFile(absPath, 'utf8');
  const res = await cssComb.processString(content);
  await fs.promises.writeFile(absPath, res, 'utf8');
  console.log('Csscombed', file);
}

function runCsslint(file) {
  const abs = toAbsolute(file);
  if (!fs.existsSync(abs)) return;
  const rel = toRelative(abs);
  const text = fs.readFileSync(abs, 'utf8');
  const result = CSSLint.verify(text, csslintRuleset);
  if (result.messages && result.messages.length) {
    let hasError = false;
    console.warn(`CSSLint warnings for ${rel}`);
    result.messages.forEach((m) => {
      if (!m) return;
      const type = m.type || 'warning';
      console.warn(`${type} ${m.line}:${m.col} ${m.message}`);
      if (type === 'error') {
        hasError = true;
      }
    });
    if (hasError) {
      process.exitCode = 2;
    }
  } else {
    console.log('CSSLint passed for', rel);
  }
}

function expandFiles(patterns, extraIgnore = []) {
  const positives = [];
  const ignores = [...extraIgnore];
  patterns.forEach((pattern) => {
    if (!pattern) return;
    const isNegated = pattern.startsWith('!');
    const raw = isNegated ? pattern.slice(1) : pattern;
    const normalised = path.isAbsolute(raw) ? path.relative(ROOT, raw) : raw;
    if (isNegated) ignores.push(normalised);
    else positives.push(normalised);
  });
  if (!positives.length) return [];
  const matches = fg.sync(positives, {
    cwd: ROOT,
    ignore: ignores,
    absolute: true
  });
  return matches.map((f) => path.resolve(f));
}

function runJshint(patterns) {
  const configPath = path.join(ROOT, '.jshintrc');
  let options = {};
  if (fs.existsSync(configPath)) {
    options = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  let ok = true;
  const files = expandFiles(patterns);
  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const src = fs.readFileSync(file, 'utf8');
    JSHINT(src, options);
    const errors = JSHINT.errors;
    if (errors && errors.length) {
      ok = false;
      console.error('JSHint errors in', toRelative(file));
      errors.forEach(e => {
        if (!e) return;
        console.error(e.line + ':' + e.character + ' ' + e.reason);
      });
    }
  });
  if (!ok) process.exitCode = 2;
}

async function build() {
  compileTypescript();
  runJshint(JS_PATTERNS);
  await compileLess('less/bootstrap/bootstrap.less', 'css/bootstrap.css');
  await compileLess('less/summarize.less', 'css/summarize.css');
  await compileLess('less/printing.less', 'css/print.css');
  await runCsscomb('css/bootstrap.css');
  await runCsscomb('css/summarize.css');
  await runCsscomb('css/print.css');
  runCsslint('css/summarize.css');
  await runAutoprefix('css/summarize.css');
}

async function lint() {
  compileTypescript({ noEmit: true });
  runJshint(JS_PATTERNS);
  const cssFiles = expandFiles(CSS_PATTERNS);
  cssFiles.forEach(runCsslint);
}

function startServer() {
  const params = {
    port: 9000,
    host: '0.0.0.0',
    root: ROOT,
    open: '/index.html',
    file: 'index.html',
    wait: 1000
  };
  liveServer.start(params);
}

function watch() {
  const watcher = chokidar.watch([
    'less/**/*.less',
    'src/**/*.ts',
    'js/**/*.js',
    'index.html',
    'css/**/*.css',
    'resume.json',
    'tsconfig.json'
  ], { ignoreInitial: true });
  watcher.on('change', async (file) => {
    const rel = toRelative(file);
    console.log('Changed:', rel);
    if (rel.endsWith('.less')) {
      try { await build(); } catch (e) { console.error(e); }
    } else if (rel.endsWith('.ts') || rel === 'tsconfig.json') {
      compileTypescript();
      runJshint(JS_PATTERNS);
    } else if (rel.endsWith('.js')) {
      runJshint([rel]);
    } else if (rel.endsWith('.css')) {
      runCsslint(rel);
    } else if (rel.endsWith('.json')) {
      try { await build(); } catch (e) { console.error(e); }
    }
  });
  startServer();
  console.log('Watching for changes...');
}

async function main() {
  const task = process.argv[2] || 'build';
  if (task === 'build') await build();
  else if (task === 'test') runJshint(JS_PATTERNS);
  else if (task === 'lint') await lint();
  else if (task === 'server') watch();
  else if (task === 'watch') watch();
  else console.log('Unknown task', task);
}

main();
