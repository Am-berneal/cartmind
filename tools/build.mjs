// Assembles index.html: shell template + every screen in src/views as <template> tags.
// Usage: node tools/build.mjs   (run via `npm run build`)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const shell = readFileSync(join(ROOT, 'src/index.template.html'), 'utf8');
const viewsDir = join(ROOT, 'src/views');
const views = readdirSync(viewsDir).filter(f => f.endsWith('.html')).sort();

const templates = views.map(f => {
  const id = basename(f, '.html');
  const html = readFileSync(join(viewsDir, f), 'utf8').trim();
  return `<template id="view-${id}">\n${html}\n</template>`;
}).join('\n');

const out = shell.replace('<!--VIEWS-->', templates);
writeFileSync(join(ROOT, 'index.html'), out);
console.log(`✓ index.html built with ${views.length} views: ${views.map(v => basename(v, '.html')).join(', ')}`);
