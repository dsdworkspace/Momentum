import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';

await build({ entryPoints: ['src/app.js'], outfile: 'app.js', bundle: true, format: 'iife', target: 'es2020' });

await rm('www', { recursive: true, force: true });
await mkdir('www', { recursive: true });
for (const file of ['index.html', 'app.js', 'manifest.webmanifest', 'sw.js', 'icons']) {
  await cp(file, `www/${file}`, { recursive: true });
}
const androidHtml = (await readFile('www/index.html', 'utf8')).replace(
  /<!-- WEB-FONTS-START:[\s\S]*?<!-- WEB-FONTS-END -->\s*/,
  '',
);
await writeFile('www/index.html', androidHtml);
console.log('Copied the offline app into www/.');
