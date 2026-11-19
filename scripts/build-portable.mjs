import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const outPortablePath = path.join(distDir, 'ChickenTD-Standalone.html');

let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Remove manifest & external icon links that aren't needed in a single local .html file
html = html.replace(/<link[^>]*rel="(?:manifest|icon|apple-touch-icon)"[^>]*>\s*/gi, '');

// Inline local CSS bundle(s)
html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="(\.\/assets\/[^"]+\.css)"[^>]*>/gi,
  (_match, relCss) => {
    const cssPath = path.join(distDir, relCss);
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    return `<style>\n${cssContent}\n</style>`;
  }
);

// Inline local JS bundle(s) safely at the end of body
html = html.replace(
  /<script[^>]*type="module"[^>]*src="(\.\/assets\/[^"]+\.js)"[^>]*><\/script>/gi,
  (_match, relJs) => {
    const jsPath = path.join(distDir, relJs);
    const jsContent = fs.readFileSync(jsPath, 'utf8').replace(/<\/script/gi, '<\\/script');
    return `<!-- INLINED_SCRIPT_PLACEHOLDER:${Buffer.from(jsContent, 'utf8').toString('base64')} -->`;
  }
);

// Move inlined module script right before </body> so DOM elements exist synchronously too
let scriptBlock = '';
html = html.replace(/<!-- INLINED_SCRIPT_PLACEHOLDER:([A-Za-z0-9+/=]+) -->/g, (_m, b64) => {
  const decoded = Buffer.from(b64, 'base64').toString('utf8');
  scriptBlock += `<script type="module">\n${decoded}\n</script>\n`;
  return '';
});

html = html.replace('</body>', `${scriptBlock}</body>`);

fs.writeFileSync(outPortablePath, html, 'utf8');
const kb = (fs.statSync(outPortablePath).size / 1024).toFixed(1);
console.log(`Built standalone offline app: dist/ChickenTD-Standalone.html (${kb} kB)`);
