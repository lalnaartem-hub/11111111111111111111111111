/**
 * Kali wallpapers: local SVG (always works) + optional HTTP download.
 */
import { mkdir, copyFile, access, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import https from 'node:https';
import http from 'node:http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public', 'wallpapers');
const cloneDir = join(root, '.cache', 'kali-wallpapers');

const LOCAL_WALLPAPERS = [
  {
    file: 'kali-neon-16x9.svg',
    svg: kaliNeonSvg(),
  },
  {
    file: 'kali-dark-16x9.svg',
    svg: kaliDarkSvg(),
  },
  {
    file: 'kali-abstract-sky-16x9.svg',
    svg: kaliSkySvg(),
  },
  {
    file: 'kali-cubes-16x9.svg',
    svg: kaliCubesSvg('#367bf0', '#5e4b8b'),
  },
  {
    file: 'kali-cubes-purple-16x9.svg',
    svg: kaliCubesSvg('#9b59b6', '#367bf0'),
  },
];

const REMOTE = [
  ['kali-neon-16x9.png', 'legacy/backgrounds/kali-16x9/kali-neon-16x9.png'],
  ['kali-dark-16x9.png', 'legacy/backgrounds/kali-16x9/kali-dark-16x9.png'],
  ['kali-abstract-sky-16x9.png', 'legacy/backgrounds/kali-16x9/kali-abstract-sky-16x9.png'],
  ['kali-cubes-16x9.jpg', '2026/wallpapers/kali-cubes-16x9.jpg'],
  ['kali-cubes-purple-16x9.jpg', '2026/wallpapers/kali-cubes-purple-16x9.jpg'],
];

const REFS = ['kali', 'kali/2025.1.2', 'kali/2026.1.0', 'kali/master'];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function kaliNeonSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d1117"/>
      <stop offset="45%" style="stop-color:#1a2332"/>
      <stop offset="75%" style="stop-color:#367bf0"/>
      <stop offset="100%" style="stop-color:#5e4b8b"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="12" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <circle cx="1550" cy="280" r="180" fill="#367bf0" opacity="0.25" filter="url(#glow)"/>
  <text x="960" y="560" text-anchor="middle" font-family="Segoe UI,Ubuntu,sans-serif" font-size="120" font-weight="700" fill="#367bf0" opacity="0.9" filter="url(#glow)">KALI</text>
  <text x="960" y="640" text-anchor="middle" font-family="Segoe UI,Ubuntu,sans-serif" font-size="36" fill="#98989d">Linux</text>
</svg>`;
}

function kaliDarkSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="r" cx="70%" cy="20%"><stop offset="0%" stop-color="#367bf0" stop-opacity="0.5"/><stop offset="100%" stop-color="#367bf0" stop-opacity="0"/></radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0d1117"/><stop offset="100%" stop-color="#000"/></linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <rect width="1920" height="1080" fill="url(#r)"/>
  <text x="120" y="980" font-family="Ubuntu,sans-serif" font-size="48" fill="#367bf0" opacity="0.35">KALI LINUX</text>
</svg>`;
}

function kaliSkySvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a1628"/>
      <stop offset="50%" stop-color="#162447"/>
      <stop offset="100%" stop-color="#367bf0"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#sky)"/>
  <ellipse cx="400" cy="200" rx="300" ry="80" fill="#fff" opacity="0.06"/>
  <ellipse cx="1200" cy="350" rx="500" ry="120" fill="#fff" opacity="0.04"/>
</svg>`;
}

function kaliCubesSvg(c1, c2) {
  const cubes = [];
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 10; col++) {
      const x = col * 200 + (row % 2) * 100;
      const y = row * 120 + 100;
      const op = 0.15 + ((row + col) % 5) * 0.08;
      cubes.push(
        `<rect x="${x}" y="${y}" width="140" height="140" rx="8" fill="${c1}" opacity="${op}" transform="rotate(${15 + col * 3} ${x + 70} ${y + 70})"/>`
      );
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d1117"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
  <rect width="1920" height="1080" fill="url(#g)"/>
  ${cubes.join('\n  ')}
  <text x="960" y="900" text-anchor="middle" font-size="64" font-weight="bold" fill="${c1}" opacity="0.5">KALI</text>
</svg>`;
}

async function writeLocalWallpapers() {
  let n = 0;
  for (const { file, svg } of LOCAL_WALLPAPERS) {
    const dst = join(outDir, file);
    await writeFile(dst, svg, 'utf8');
    console.log('OK (local)', file);
    n++;
  }
  return n;
}

function fetchUrl(url, timeoutMs = 25000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      {
        headers: { 'User-Agent': 'BrowserOS-Wallpaper/1.0' },
        timeout: timeoutMs,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location, timeoutMs).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

async function tryDownloadRemote(destName, relPath) {
  const dst = join(outDir, destName);
  if (await exists(dst)) {
    console.log('Skip (exists)', destName);
    return true;
  }

  const bases = [
    'https://gitlab.com/api/v4/projects/kalilinux%2Fpackages%2Fkali-wallpapers/repository/files',
    'https://gitlab.com/kalilinux/packages/kali-wallpapers/-/raw',
  ];

  for (const ref of REFS) {
    const enc = encodeURIComponent(relPath);
    const urls = [
      `${bases[0]}/${enc}/raw?ref=${encodeURIComponent(ref.split('/').pop() || 'kali')}`,
      `${bases[1]}/${ref}/${relPath}`,
    ];
    for (const url of urls) {
      try {
        const buf = await fetchUrl(url);
        if (buf.length < 2048) continue;
        await writeFile(dst, buf);
        console.log('OK (net)', destName);
        return true;
      } catch {
        /* try next */
      }
    }
  }

  if (typeof globalThis.fetch === 'function') {
    for (const ref of REFS) {
      const url = `https://gitlab.com/kalilinux/packages/kali-wallpapers/-/raw/${ref}/${relPath}`;
      try {
        const res = await fetch(url, {
          redirect: 'follow',
          headers: { 'User-Agent': 'BrowserOS-Wallpaper/1.0' },
        });
        if (!res.ok) continue;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 2048) continue;
        await writeFile(dst, buf);
        console.log('OK (fetch)', destName);
        return true;
      } catch {
        /* next */
      }
    }
  }
  return false;
}

async function gitClone() {
  try {
    execSync('git --version', { stdio: 'ignore', shell: true });
  } catch {
    return false;
  }
  if (await exists(join(cloneDir, '.git'))) return true;
  try {
    console.log('Git clone kali-wallpapers...');
    execSync(
      `git clone --depth 1 --branch kali https://gitlab.com/kalilinux/packages/kali-wallpapers.git "${cloneDir}"`,
      { stdio: 'inherit',
        cwd: root,
        shell: true }
    );
    return true;
  } catch {
    return false;
  }
}

async function copyFromGit() {
  let ok = 0;
  for (const [dest, rel] of REMOTE) {
    const src = join(cloneDir, rel);
    const dst = join(outDir, dest);
    if (await exists(src)) {
      await copyFile(src, dst);
      console.log('OK (git)', dest);
      ok++;
    }
  }
  return ok;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  console.log('=== Step 1: local Kali-style wallpapers (no internet) ===\n');
  const localCount = await writeLocalWallpapers();

  console.log('\n=== Step 2: optional download (PNG/JPG from GitLab) ===\n');
  let net = 0;
  for (const [dest, rel] of REMOTE) {
    if (await tryDownloadRemote(dest, rel)) net++;
  }

  if (net < REMOTE.length) {
    console.log('\n=== Step 3: git fallback ===\n');
    if (await gitClone()) {
      net = Math.max(net, await copyFromGit());
    } else {
      console.log('Git not installed - using local SVG only (this is fine).');
    }
  }

  console.log(`\nDone: ${localCount} local SVG + ${net} remote files in public/wallpapers/`);
  console.log('In app: Settings - Desktop - Kali Neon / Cubes');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
