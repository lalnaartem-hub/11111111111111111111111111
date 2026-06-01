import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const v86Dir = join(publicDir, 'v86');
const biosDir = join(publicDir, 'bios');

const FILES = [
  {
    url: 'https://cdn.jsdelivr.net/npm/v86@0.5.357/build/v86.wasm',
    dest: join(v86Dir, 'v86.wasm'),
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/v86@0.5.357/build/v86-fallback.wasm',
    dest: join(v86Dir, 'v86-fallback.wasm'),
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/seabios.bin',
    dest: join(biosDir, 'seabios.bin'),
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/copy/v86@master/bios/vgabios.bin',
    dest: join(biosDir, 'vgabios.bin'),
  },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) {
      console.log('skip (exists):', dest);
      resolve();
      return;
    }
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          download(res.headers.location, dest).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`${url} => ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          writeFileSync(dest, Buffer.concat(chunks));
          console.log('saved:', dest);
          resolve();
        });
      })
      .on('error', reject);
  });
}

mkdirSync(v86Dir, { recursive: true });
mkdirSync(biosDir, { recursive: true });

for (const f of FILES) {
  await download(f.url, f.dest);
}
console.log('v86 assets ready');
