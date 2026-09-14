import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const input = path.join(dist, 'index.html');
const output = path.join(root, '夜班训练22-离线版.html');

let html = readFileSync(input, 'utf8');

const localFile = (reference) => {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  const relative = cleanReference.replace(/^\//, '');
  const file = path.resolve(dist, relative);
  if (file !== dist && !file.startsWith(`${dist}${path.sep}`)) {
    throw new Error(`Refusing to read outside dist: ${reference}`);
  }
  return file;
};

html = html.replace(/<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi, (_, before, src, after) => {
  const code = readFileSync(localFile(src), 'utf8')
    .replace(/navigator\.serviceWorker\.register\([^;]+;?/g, '');
  return `<script type="module"${before.replace(/\s*crossorigin\b/gi, '')}${after.replace(/\s*crossorigin\b/gi, '')}>${code}</script>`;
});

html = html.replace(/<link\b([^>]*?)\bhref=["']([^"']+)["'][^>]*>/gi, (tag, attrs, href) => {
  if (/rel=["'](?:manifest|apple-touch-icon)["']/i.test(tag)) return '';
  if (!/\.css(?:[?#]|$)/i.test(href)) return tag;
  const css = readFileSync(localFile(href), 'utf8');
  return `<style>${css}</style>`;
});

html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, '<title>夜班训练22-离线版</title>');
html = html.replace(/(?:href|src)=["'][^"']*(?:\/assets\/|manifest\.webmanifest|\/sw\.js)[^"']*["']/gi, '');

writeFileSync(output, html);
console.log(`Generated single-file app: ${output}`);
