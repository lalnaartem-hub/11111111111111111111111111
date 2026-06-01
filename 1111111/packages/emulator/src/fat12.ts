/** Создание 1.44 МБ FAT12 дискеты с одним файлом для v86 */

const SECTOR_SIZE = 512;
const TOTAL_SECTORS = 2880;
const RESERVED = 1;
const NUM_FATS = 2;
const ROOT_ENTRIES = 224;
const SECTORS_PER_FAT = 9;
const ROOT_SECTORS = 14;
const DATA_START_SECTOR = RESERVED + NUM_FATS * SECTORS_PER_FAT + ROOT_SECTORS;

function to83(filename: string): string {
  const dot = filename.lastIndexOf('.');
  const base = (dot > 0 ? filename.slice(0, dot) : filename).toUpperCase();
  const ext = (dot > 0 ? filename.slice(dot + 1) : 'EXE').toUpperCase();
  return base.slice(0, 8).padEnd(8, ' ') + ext.slice(0, 3).padEnd(3, ' ');
}

function setFat12(bytes: Uint8Array, fatStart: number, cluster: number, value: number) {
  const offset = fatStart + Math.floor((cluster * 3) / 2);
  if (cluster & 1) {
    bytes[offset] = (bytes[offset] & 0x0f) | ((value & 0x0f) << 4);
    bytes[offset + 1] = (value >> 4) & 0xff;
  } else {
    bytes[offset] = value & 0xff;
    bytes[offset + 1] = (bytes[offset + 1] & 0xf0) | ((value >> 8) & 0x0f);
  }
}

export function createFat12Floppy(filename: string, fileData: Uint8Array): ArrayBuffer {
  const clusters = Math.max(1, Math.ceil(fileData.length / SECTOR_SIZE));
  const maxDataClusters = TOTAL_SECTORS - DATA_START_SECTOR;
  if (clusters > maxDataClusters) {
    throw new Error('Файл слишком большой для дискеты 1.44 МБ');
  }

  const buffer = new ArrayBuffer(TOTAL_SECTORS * SECTOR_SIZE);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  const oem = 'MSWIN4.1';
  for (let i = 0; i < oem.length; i++) bytes[i] = oem.charCodeAt(i);
  view.setUint16(11, SECTOR_SIZE, true);
  view.setUint8(13, 1);
  view.setUint16(14, RESERVED, true);
  view.setUint8(16, NUM_FATS);
  view.setUint16(17, ROOT_ENTRIES, true);
  view.setUint8(21, 0xf0);
  view.setUint16(22, SECTORS_PER_FAT, true);
  view.setUint16(24, 18, true);
  view.setUint16(26, 2, true);
  view.setUint32(32, TOTAL_SECTORS, true);
  bytes[510] = 0x55;
  bytes[511] = 0xaa;

  const fatStart = RESERVED * SECTOR_SIZE;
  setFat12(bytes, fatStart, 0, 0xff0);
  setFat12(bytes, fatStart, 1, 0xfff);

  const firstCluster = 2;
  for (let c = 0; c < clusters; c++) {
    const cluster = firstCluster + c;
    const next = c === clusters - 1 ? 0xff8 : cluster + 1;
    setFat12(bytes, fatStart, cluster, next);
    setFat12(bytes, fatStart + SECTORS_PER_FAT * SECTOR_SIZE, cluster, next);
  }

  const rootOffset = (RESERVED + NUM_FATS * SECTORS_PER_FAT) * SECTOR_SIZE;
  const name83 = to83(filename);
  for (let i = 0; i < 11; i++) bytes[rootOffset + i] = name83.charCodeAt(i);
  bytes[rootOffset + 11] = 0x20;
  view.setUint16(rootOffset + 26, firstCluster, true);
  view.setUint32(rootOffset + 28, fileData.length, true);

  let offset = DATA_START_SECTOR * SECTOR_SIZE;
  bytes.set(fileData.subarray(0, fileData.length), offset);

  return buffer;
}

export function analyzeExecutable(data: Uint8Array): {
  runnable: boolean;
  kind: 'dos' | 'com' | 'pe' | 'unknown';
  message: string;
} {
  if (data.length < 2) {
    return { runnable: false, kind: 'unknown', message: 'Пустой файл' };
  }
  if (data[0] === 0x4d && data[1] === 0x5a) {
    if (data.length >= 0x40) {
      const peOff = data[0x3c] | (data[0x3d] << 8) | (data[0x3e] << 16) | (data[0x3f] << 24);
      if (peOff + 4 <= data.length) {
        const pe =
          data[peOff] |
          (data[peOff + 1] << 8) |
          (data[peOff + 2] << 16) |
          (data[peOff + 3] << 24);
        if (pe === 0x00004550) {
          return {
            runnable: true,
            kind: 'pe',
            message:
              'Windows PE (.exe) — запуск в Windows 98 (v86). После загрузки: «Мой компьютер» → диск A: → ваш файл.',
          };
        }
      }
    }
    return {
      runnable: true,
      kind: 'dos',
      message: 'DOS-программа (MZ). Будет загружена на дискету A: в FreeDOS.',
    };
  }
  return {
    runnable: true,
    kind: 'com',
    message: 'DOS COM-файл. Будет загружен на дискету A: в FreeDOS.',
  };
}
