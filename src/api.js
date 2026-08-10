// 對 TTRI（紡織所）兩組 API 的存取層。
//
// 重要：TTRI 的 token 綁定申請時登記的固定 IP，且需放在 headers，因此不可由瀏覽器直接呼叫。
// 正式環境請把 VITE_TTRI_BASE_URL 指到自家後端 proxy，由後端補 token 後轉發。
// 未設定環境變數時一律走 mock，讓前端可離線開發。

import { fabricLibrary, fabricByCode } from './data/fabric-library.js';
import { specLimits } from './data/fabric-options.js';

const env = import.meta.env ?? {};

export const apiConfig = {
  // Specs2VS / getU3M。預設為後端 proxy 路徑。
  ttriBaseUrl: env.VITE_TTRI_BASE_URL ?? '',
  // Generate_pattern。交付文件只給 http://127.0.0.1:3000/，尚未有正式位址。
  patternBaseUrl: env.VITE_PATTERN_BASE_URL ?? '',
  // 僅供本機直連測試；正式環境不要把 token 放進前端 bundle。
  token: env.VITE_TTRI_TOKEN ?? '',
};

export const useMockTtri = !apiConfig.ttriBaseUrl;
export const useMockPattern = !apiConfig.patternBaseUrl;

// 文件規定：請求間隔建議 1 秒，每分鐘上限 30 次（超過會被暫停 5 秒）。
const MIN_INTERVAL_MS = 1000;
const MAX_PER_MINUTE = 30;
const recentCalls = [];
let queue = Promise.resolve();

function throttle(task) {
  queue = queue.then(async () => {
    const now = Date.now();
    while (recentCalls.length && now - recentCalls[0] > 60_000) recentCalls.shift();

    let wait = 0;
    const last = recentCalls[recentCalls.length - 1];
    if (last) wait = Math.max(wait, MIN_INTERVAL_MS - (now - last));
    if (recentCalls.length >= MAX_PER_MINUTE) {
      wait = Math.max(wait, 60_000 - (now - recentCalls[0]));
    }
    if (wait > 0) await delay(wait);

    recentCalls.push(Date.now());
    return task();
  }, () => task());
  return queue;
}

function headers() {
  const result = { accept: 'application/json' };
  if (apiConfig.token) result.Authorization = apiConfig.token;
  return result;
}

async function requestJson(url, init) {
  const response = await fetch(url, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) } });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} — ${url}`);
  }
  return response.json();
}

export function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function login(credentials) {
  await delay(350);
  return { userId: credentials.id || '2605' };
}

// ---------------------------------------------------------------- Specs2VS

/**
 * 輸入布料規格，取得相近的 FAB 物性與建議的 3D 模型編號。
 * 必要參數依 Schema_Specs2VS：SampleCode / Product_FabricCategoryCode /
 * Product_WeightGSM / T / Product_OP_Percentage / algorithm / buildU3M。
 */
export async function specs2vs({
  sampleCode,
  categoryCode,
  gsm,
  thickness,
  opPercentage = 0,
  algorithm = 'Matched',
  buildU3M = 'Y',
}) {
  const params = new URLSearchParams({
    SampleCode: sampleCode,
    Product_FabricCategoryCode: categoryCode,
    Product_WeightGSM: String(gsm),
    T: String(thickness),
    Product_OP_Percentage: String(opPercentage),
    algorithm,
    buildU3M,
  });

  if (useMockTtri) {
    await delay(400);
    return mockSpecs2vs({ sampleCode, categoryCode, gsm, thickness });
  }
  return throttle(() => requestJson(`${apiConfig.ttriBaseUrl}/Specs2VS?${params}`));
}

/** 取得對應布號的 U3M 或 physics JSON。jsonName: 'U3M' | 'physics' */
export async function getU3M(sampleCode, jsonName = 'U3M') {
  const params = new URLSearchParams({ SampleCode: sampleCode, jsonName });

  if (useMockTtri) {
    await delay(250);
    const local = fabricByCode[sampleCode]?.u3m;
    const url = jsonName === 'physics' ? local?.physics : local?.file;
    if (!url) throw new Error(`本機沒有 ${sampleCode} 的 ${jsonName} 檔`);
    return requestJson(url);
  }
  return throttle(() => requestJson(`${apiConfig.ttriBaseUrl}/getU3M?${params}`));
}

/** 檢查輸入是否落在 Specs2VS 模型的有效範圍內（超出時預測可信度較低）。 */
export function checkSpecRange({ gsm, thickness, opPercentage = 0 }) {
  const warnings = [];
  const check = (value, limit, label) => {
    if (value == null) return;
    if (value < limit.min || value > limit.max) {
      warnings.push(`${label} ${value}${limit.unit} 超出模型範圍 ${limit.min}–${limit.max}${limit.unit}`);
    }
  };
  check(Number(gsm), specLimits.apiGsm, '布重');
  check(Number(thickness), specLimits.apiThickness, '布厚');
  check(Number(opPercentage), specLimits.opPercentage, 'OP 含量');
  return warnings;
}

function mockSpecs2vs({ sampleCode, categoryCode, gsm, thickness }) {
  // 依交付的 Examples 取一組同布種的真實回傳值當基準，再依布重/布厚等比縮放。
  const base = MOCK_VS_SAMPLES[categoryCode] ?? MOCK_VS_SAMPLES.CW;
  const scale = (Number(gsm) || base.MassDensity) / base.MassDensity;
  const round = (value) => Math.round(value * scale * 10) / 10;
  return {
    SampleCode: base.SampleCode,
    Name: base.Name,
    MachineType: 'Matched',
    Thickness: Number(thickness) || base.Thickness,
    MassDensity: Number(gsm) || base.MassDensity,
    BendRigidityWeft: round(base.BendRigidityWeft),
    BendRigidityWarp: round(base.BendRigidityWarp),
    StretchRigidityWeft: round(base.StretchRigidityWeft),
    StretchRigidityWarp: round(base.StretchRigidityWarp),
    StretchRigidityShear: round(base.StretchRigidityShear),
    StretchLinearityWeft: 50,
    StretchLinearityWarp: 50,
    StretchLinearityShear: 20,
    _mock: true,
    _requestedSampleCode: sampleCode,
  };
}

// 取自 TandemTex API Document 的 Examples 工作表
const MOCK_VS_SAMPLES = {
  CW: {
    SampleCode: '2-0000033', Name: '2-0000033-3', Thickness: 0.5, MassDensity: 205,
    BendRigidityWeft: 17.8, BendRigidityWarp: 18, StretchRigidityWeft: 57.4,
    StretchRigidityWarp: 32.9, StretchRigidityShear: 28.5,
  },
  WO: {
    SampleCode: '2-0000516', Name: '2-0000516-1', Thickness: 1.7, MassDensity: 250,
    BendRigidityWeft: 119.8, BendRigidityWarp: 237.7, StretchRigidityWeft: 81.2,
    StretchRigidityWarp: 318.6, StretchRigidityShear: 72.9,
  },
  WK: {
    SampleCode: '1-0000159', Name: '1-0000159-1', Thickness: 0.1, MassDensity: 45,
    BendRigidityWeft: 72.9, BendRigidityWarp: 173.6, StretchRigidityWeft: 679.8,
    StretchRigidityWarp: 4746, StretchRigidityShear: 238.5,
  },
};

// --------------------------------------------------------- Generate_pattern

/**
 * AI 生成圖案。回傳 { status, message, mime_type, descript, image_data_b64 }，
 * 這裡順手把 base64 轉成可直接餵給 <img> / three.js 的 data URL。
 */
export async function generatePattern({
  task = 'seamless',
  prompt,
  style = '',
  imageSize = 1024,
  server = 'Gemini',
  model = 'Gemini2.5',
  negativePrompt = '',
}) {
  const body = {
    task, prompt, style, imageSize, server, model, ne_prompt: negativePrompt,
  };

  if (useMockPattern) {
    await delay(900);
    return { status: 'success', message: 'mock', mime_type: 'image/svg+xml', descript: prompt, dataUrl: mockPatternDataUrl(prompt), _mock: true };
  }

  const result = await requestJson(`${apiConfig.patternBaseUrl}/Generate_pattern`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  // 文件中 mime_type 出現過 '.png' / '.jpg' / 'image/png' 三種寫法，這裡一併正規化。
  const raw = String(result.mime_type ?? '').replace(/^\./, '');
  const mime = raw.includes('/') ? raw : `image/${raw === 'jpg' ? 'jpeg' : raw || 'png'}`;
  return { ...result, dataUrl: `data:${mime};base64,${result.image_data_b64}` };
}

function mockPatternDataUrl(prompt) {
  const hue = [...String(prompt ?? '')].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">`
    + `<rect width="256" height="256" fill="hsl(${hue} 45% 82%)"/>`
    + `<circle cx="64" cy="64" r="42" fill="hsl(${(hue + 40) % 360} 55% 55%)"/>`
    + `<circle cx="192" cy="192" r="42" fill="hsl(${(hue + 40) % 360} 55% 55%)"/>`
    + `<path d="M0 128h256M128 0v256" stroke="hsl(${(hue + 200) % 360} 40% 40%)" stroke-width="10"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ------------------------------------------------------------------ 布樣搜尋

/**
 * 依規格搜尋布樣。客戶未提供搜尋 API，先以交付的 40 筆布樣清單在前端比對，
 * 依布種、組織、成分重疊度排序。
 */
export async function searchFabrics(form) {
  await delay(250);
  const wanted = new Map((form.compositions ?? [])
    .filter((row) => row.code)
    .map((row) => [row.code, Number(row.percent) || 0]));

  const scored = fabricLibrary
    .filter((item) => !form.type || item.categoryCode === form.type)
    .map((item) => {
      let score = 0;
      if (form.weave && item.weaveCode === form.weave) score += 100;
      for (const comp of item.compositions) {
        if (!wanted.has(comp.code)) continue;
        score += 30 - Math.min(30, Math.abs(wanted.get(comp.code) - comp.percent) / 4);
      }
      return { item, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.filter((row) => row.score > 0).map((row) => row.item);
}
