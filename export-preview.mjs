import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const assets = await readdir('dist/assets');
const js = await readFile(path.join('dist/assets', assets.find(f => f.endsWith('.js'))), 'utf8');
let css = await readFile(path.join('dist/assets', assets.find(f => f.endsWith('.css'))), 'utf8');
for (const font of assets.filter(f=>f.endsWith('.ttf'))) {
 const bytes=await readFile(path.join('dist/assets',font));
 css=css.replaceAll('./'+font,'data:font/ttf;base64,'+bytes.toString('base64'));
}
const favicon = 'data:image/svg+xml,' + encodeURIComponent(await readFile('public/agora-icon.svg', 'utf8'));
const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#181815"><link rel="icon" type="image/svg+xml" href="${favicon}"><title>Agora | A space for better arguments</title><style>${css.replaceAll('</style', '<\\/style')}</style></head><body><div id="root"></div><script>window.__AGORA_STATIC_PREVIEW__=true;</script><script type="module">${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
await writeFile('../agora-preview.html', html);
console.log('Standalone preview generated with embedded fonts and no live AI connection.');
