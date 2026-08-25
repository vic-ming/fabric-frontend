<script setup>
import { computed, ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import ThreeViewer from './ThreeViewer.vue';
import ToggleSwitch from './ToggleSwitch.vue';
import { hdriOptions, previewModels } from '../data.js';
import { defaultTextureCm } from '../data/preview-assets.js';
import { buildU3MPackage, downloadBlob } from '../u3m-package.js';

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
});
const emit = defineEmits(['close']);

const selectedModelId = ref(previewModels[0]?.value ?? 1);
const selectedHdriId = ref(hdriOptions[0]?.value ?? 1);
const tiling = ref(1);
const autoRotate = ref(false);
const busy = ref('');
const message = ref('');
const viewerRef = ref(null);

const model = computed(() => previewModels.find((item) => item.value === selectedModelId.value) ?? previewModels[0]);
const hdri = computed(() => hdriOptions.find((item) => item.value === selectedHdriId.value) ?? hdriOptions[0]);
const tilingLabel = computed(() => `${Math.round(tiling.value * 100)}%`);
const fabric = computed(() => props.data.fabric ?? {});
const library = computed(() => fabric.value.library ?? null);
const u3m = computed(() => library.value?.u3m ?? null);

// 布樣貼圖的實際尺寸來自 .u3m；沒有的布樣退回預設值
const fabricTextureCm = computed(() => library.value?.textureSizeCm
  ?? { width: defaultTextureCm, height: defaultTextureCm });

const colorMap = computed(() => {
  if (props.data.kind === 'solid') {
    return { url: solidTexture(props.data.hex), widthCm: defaultTextureCm, heightCm: defaultTextureCm };
  }
  if (props.data.kind === 'upload' && props.data.textureUrl) {
    // 上傳圖案卡有讓使用者填實際公分尺寸，直接拿來算重複次數
    return {
      url: props.data.textureUrl,
      widthCm: Number(props.data.width) || defaultTextureCm,
      heightCm: Number(props.data.height) || Number(props.data.width) || defaultTextureCm,
    };
  }
  if (props.data.textureUrl) {
    // 內建圖案：客戶未提供每張圖的實際尺寸，先用預設邊長（待確認）
    return { url: props.data.textureUrl, widthCm: defaultTextureCm, heightCm: defaultTextureCm };
  }
  // 沒有套圖案時就顯示布樣本身的織紋
  return {
    url: u3m.value?.textures?.base ?? solidTexture('#d7d7d7'),
    widthCm: fabricTextureCm.value.width,
    heightCm: fabricTextureCm.value.height,
  };
});

// 法線／粗糙度撐起織紋立體感，永遠跟著布樣走，不隨圖案改變
const materialMaps = computed(() => {
  const textures = u3m.value?.textures;
  if (!textures) return {};
  return {
    normal: textures.nrm ?? null,
    roughness: textures.rough ?? null,
    // ALPHA 幾乎全白的布樣掛上去只是白費效能，交給資料層判斷
    alpha: library.value?.usesAlpha ? textures.alpha ?? null : null,
    widthCm: fabricTextureCm.value.width,
    heightCm: fabricTextureCm.value.height,
  };
});

const patternLabel = computed(() => props.data.pattern || props.data.pantone || props.data.fileName || '素色');

function solidTexture(hex = '#d7d7d7') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${hex}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function downloadU3M() {
  if (!u3m.value || busy.value) return;
  busy.value = 'u3m';
  message.value = '';
  try {
    const { blob, filename, fileCount } = await buildU3MPackage(library.value);
    downloadBlob(blob, filename);
    message.value = `已下載 ${filename}（${fileCount} 個檔案）`;
  } catch (error) {
    message.value = `下載失敗：${error.message}`;
  } finally {
    busy.value = '';
  }
}

// 目前沒有後端可存，先讓使用者把當下這個視角的 3D 畫面存成 PNG
function savePreview() {
  const dataUrl = viewerRef.value?.capture?.();
  if (!dataUrl) {
    message.value = '目前無法擷取畫面';
    return;
  }
  const name = [fabric.value.code || 'preview', model.value?.displayname, patternLabel.value]
    .filter(Boolean).join('_');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${name}.png`;
  link.click();
  message.value = '已儲存預覽圖';
}
</script>

<template>
  <article class="preview-settings-node">
    <Handle type="target" :position="Position.Left" />
    <aside class="preview-settings-panel">
      <header class="preview-drag-handle">
        <span class="preview-title-icon"><img src="/images/ic_eye_solid.svg" alt="" /></span>
        <strong>預覽設定</strong>
        <button type="button" aria-label="關閉預覽" @click="emit('close', id)"><img src="/images/ic_close.svg" alt="" /></button>
      </header>

      <section class="preview-fabric-info">
        <h3>布料資訊</h3>
        <div class="preview-info-content">
          <div class="preview-info-swatch" :style="{ backgroundImage: `url(${fabric.swatch || colorMap.url})` }"></div>
          <dl>
            <dt>布號</dt><dd>{{ fabric.code || '—' }}</dd>
            <dt>種類</dt><dd>{{ fabric.type || '—' }}</dd>
            <dt>圖案</dt><dd>{{ patternLabel }}</dd>
            <dt>組織</dt><dd>{{ fabric.weave || '—' }}</dd>
            <dt>成分</dt><dd>{{ fabric.composition || '—' }}</dd>
          </dl>
        </div>
      </section>

      <section class="preview-setting-group">
        <div class="setting-heading"><span>印花尺寸 (縮放)</span><strong>{{ tilingLabel }}</strong></div>
        <input v-model.number="tiling" type="range" min="0.5" max="2" step="0.25" />
        <small class="spec-message">一個循環約 {{ (colorMap.widthCm / tiling).toFixed(1) }} × {{ (colorMap.heightCm / tiling).toFixed(1) }} cm</small>
      </section>

      <section class="preview-setting-group">
        <h3>背景設定</h3>
        <div class="preview-switch"><span>自動旋轉</span><ToggleSwitch v-model="autoRotate" /></div>
        <label><span>HDRI 環境光</span><select v-model.number="selectedHdriId"><option v-for="item in hdriOptions" :key="item.value" :value="item.value">{{ item.displayname }}</option></select></label>
        <label>
          <span>預覽型態</span>
          <select v-model.number="selectedModelId">
            <option v-for="item in previewModels" :key="item.value" :value="item.value">{{ item.displayname }}（{{ item.group }}）</option>
          </select>
        </label>
      </section>

      <button type="button" class="blue-button preview-save" @click="savePreview">
        <img src="/images/ic_eye_solid_white.svg" alt="" />儲存並預覽
      </button>
      <button type="button" class="preview-download" :disabled="!u3m || busy === 'u3m'" @click="downloadU3M">
        <img src="/images/ic_download.svg" alt="" />
        <template v-if="busy === 'u3m'">打包中…</template>
        <template v-else>{{ u3m ? '下載 u3ma 格式' : '此布樣尚未提供 u3m' }}</template>
      </button>
      <p v-if="message" class="spec-message">{{ message }}</p>
    </aside>
    <section class="preview-three-panel">
      <ThreeViewer
        ref="viewerRef"
        :model="model"
        :hdri="hdri"
        :tiling="tiling"
        :auto-rotate="autoRotate"
        :color-map="colorMap"
        :material-maps="materialMaps"
      />
    </section>
  </article>
</template>
