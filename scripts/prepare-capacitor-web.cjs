const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const outDir = path.join(root, 'dist');
const files = [
  'index.html',
  'gallery.html',
  'styles.css',
  'app.js',
  'api.js',
  'card-constants.js',
];
const dirs = ['assets'];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const src = path.join(root, file);
  const dest = path.join(outDir, file);
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

for (const dir of dirs) {
  copyDir(path.join(root, dir), path.join(outDir, dir));
}

console.log(`Prepared Capacitor web assets in: ${outDir}`);
