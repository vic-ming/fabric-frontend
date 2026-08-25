// 把布樣的 .u3m、physics json 與 textures/ 打包成一個 zip。
//
// .u3m 裡的貼圖是相對路徑（textures/xxx_BASE.jpg），只下載那個 JSON 進到 CLO3D／Browzwear
// 會找不到貼圖，所以必須連同 textures 資料夾一起給。
//
// 用 store（不壓縮）方式寫 zip：內容本來就是 JPEG，再壓一次省不到空間，
// 也免得為了 deflate 多拉一個相依套件。

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function dosDateTime(date) {
  const time = ((date.getHours() & 0x1F) << 11)
    | ((date.getMinutes() & 0x3F) << 5)
    | ((Math.floor(date.getSeconds() / 2)) & 0x1F);
  const day = (((date.getFullYear() - 1980) & 0x7F) << 9)
    | (((date.getMonth() + 1) & 0x0F) << 5)
    | (date.getDate() & 0x1F);
  return { time, day };
}

/**
 * @param {{name: string, data: Uint8Array}[]} entries
 * @param {Date} [modifiedAt]
 * @returns {Blob}
 */
export function createZip(entries, modifiedAt = new Date()) {
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(modifiedAt);
  const parts = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true);   // local file header 簽章
    local.setUint16(4, 20, true);           // version needed
    local.setUint16(6, 0x0800, true);       // flags：檔名為 UTF-8
    local.setUint16(8, 0, true);            // method：store
    local.setUint16(10, time, true);
    local.setUint16(12, day, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);        // compressed size
    local.setUint32(22, size, true);        // uncompressed size
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);           // extra field 長度
    parts.push(new Uint8Array(local.buffer), nameBytes, entry.data);

    const header = new DataView(new ArrayBuffer(46));
    header.setUint32(0, 0x02014B50, true);  // central directory 簽章
    header.setUint16(4, 20, true);          // version made by
    header.setUint16(6, 20, true);          // version needed
    header.setUint16(8, 0x0800, true);
    header.setUint16(10, 0, true);
    header.setUint16(12, time, true);
    header.setUint16(14, day, true);
    header.setUint32(16, crc, true);
    header.setUint32(20, size, true);
    header.setUint32(24, size, true);
    header.setUint16(28, nameBytes.length, true);
    header.setUint16(30, 0, true);          // extra
    header.setUint16(32, 0, true);          // comment
    header.setUint16(34, 0, true);          // disk number
    header.setUint16(36, 0, true);          // internal attrs
    header.setUint32(38, 0, true);          // external attrs
    header.setUint32(42, offset, true);     // local header 位移
    central.push(new Uint8Array(header.buffer), nameBytes);

    offset += 30 + nameBytes.length + size;
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054B50, true);       // end of central directory
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);

  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`下載失敗 ${response.status} — ${url}`);
  return new Uint8Array(await response.arrayBuffer());
}

function basename(path) {
  return String(path).split('/').pop();
}

/**
 * 依 fabricLibrary 的一筆布樣組出可直接匯入 3D 軟體的 zip。
 * 目錄結構維持 .u3m 內相對路徑的樣子：
 *   {legacyCode}/{legacyCode}.u3m
 *   {legacyCode}/{physics}.json
 *   {legacyCode}/textures/*.jpg
 */
export function u3mPackageEntries(fabric) {
  const u3m = fabric?.u3m;
  if (!u3m) throw new Error(`${fabric?.code ?? '此布樣'} 沒有 u3m 資料`);

  const root = fabric.legacyCode ?? fabric.code;
  return [
    { name: `${root}/${basename(u3m.file)}`, url: u3m.file },
    ...(u3m.physics ? [{ name: `${root}/${basename(u3m.physics)}`, url: u3m.physics }] : []),
    ...(u3m.preview ? [{ name: `${root}/${basename(u3m.preview)}`, url: u3m.preview }] : []),
    ...Object.values(u3m.textures ?? {}).map((url) => ({ name: `${root}/textures/${basename(url)}`, url })),
  ];
}

export async function buildU3MPackage(fabric) {
  const sources = u3mPackageEntries(fabric);
  const entries = await Promise.all(
    sources.map(async ({ name, url }) => ({ name, data: await fetchBytes(url) })),
  );
  return { blob: createZip(entries), filename: `${fabric.code}.zip`, fileCount: entries.length };
}

/** 觸發瀏覽器下載，用完就把 object URL 釋放掉。 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
