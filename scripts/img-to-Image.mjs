// scripts/img-to-Image.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['app', 'components', 'lib'];

function ensureImageImport(src) {
  if (/from ['"]next\/image['"]/.test(src)) return src;
  if (!/<Image\b/.test(src)) return src;
  const lines = src.split('\n');
  const firstImportIdx = lines.findIndex((l) => /^import\s/.test(l));
  const imp = `import Image from 'next/image';`;
  if (firstImportIdx >= 0) {
    lines.splice(firstImportIdx + 1, 0, imp);
    return lines.join('\n');
  }
  return `${imp}\n${src}`;
}

function transformFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('<img')) return;

  // Quick conversion: <img src="..." alt="..."/> -> <Image src="..." alt="..." width={1} height={1}/>
  // You should adjust width/height properly afterwards.
  let changed = false;
  src = src.replace(/<img([^>]*?)\/?>/g, (m, attrs) => {
    if (!/alt=/.test(attrs)) {
      // force alt to encourage correct a11y
      attrs = `${attrs} alt=""`;
    }
    if (!/width=/.test(attrs)) attrs = `${attrs} width={1}`;
    if (!/height=/.test(attrs)) attrs = `${attrs} height={1}`;
    changed = true;
    return `<Image${attrs} />`;
  });

  if (changed) {
    src = ensureImageImport(src);
    fs.writeFileSync(file, src, 'utf8');
    console.log('updated:', file);
  }
}

function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.isFile() && p.endsWith('.tsx')) transformFile(p);
  }
}

for (const r of ROOTS) if (fs.existsSync(r)) walk(r);
