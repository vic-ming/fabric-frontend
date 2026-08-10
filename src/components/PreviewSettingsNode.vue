<script setup>
import { computed, ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import ThreeViewer from './ThreeViewer.vue';
import ToggleSwitch from './ToggleSwitch.vue';
import { hdriOptions, previewModels } from '../data.js';

const props = defineProps({
  id: { type: String, required: true },
  data: { type: Object, required: true },
});
const emit = defineEmits(['close']);

const selectedModelId = ref(previewModels[0]?.value ?? 1);
const selectedHdriId = ref(hdriOptions[0]?.value ?? 1);
const tiling = ref(1);
const autoRotate = ref(false);
const downloading = ref(false);

const model = computed(() => previewModels.find((item) => item.value === selectedModelId.value) ?? previewModels[0]);
const hdri = computed(() => hdriOptions.find((item) => item.value === selectedHdriId.value) ?? hdriOptions[0]);
const tilingLabel = computed(() => `${Math.round(tiling.value * 100)}%`);
const fabric = computed(() => props.data.fabric ?? {});
const library = computed(() => fabric.value.library ?? null);
const u3m = computed(() => library.value?.u3m ?? null);

const textureUrl = computed(() => {
  if (props.data.kind === 'solid') return solidTexture(props.data.hex);
  // 內建圖案 / 上傳圖案都帶著 textureUrl；沒有圖案時退回布樣本身的 BASE 貼圖
  return props.data.textureUrl || u3m.value?.textures?.base || solidTexture('#d7d7d7');
});

const patternLabel = computed(() => props.data.pattern || props.data.pantone || props.data.fileName || '素色');

function solidTexture(hex = '#d7d7d7') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${hex}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// 交付的 7 組布樣已附 u3m/textures，直接把整包壓成使用者可下載的檔案清單
async function downloadU3M() {
  if (!u3m.value || downloading.value) return;
  downloading.value = true;
  try {
    const link = document.createElement('a');
    link.href = u3m.value.file;
    link.download = `${library.value.code}.u3m`;
    link.click();
  } finally {
    downloading.value = false;
  }
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
          <div class="preview-info-swatch" :style="{ backgroundImage: `url(${fabric.swatch || textureUrl})` }"></div>
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

      <button type="button" class="blue-button preview-save"><img src="/images/ic_eye_solid_white.svg" alt="" />儲存並預覽</button>
      <button type="button" class="preview-download" :disabled="!u3m" @click="downloadU3M">
        <img src="/images/ic_download.svg" alt="" />
        {{ u3m ? '下載 u3ma 格式' : '此布樣尚未提供 u3m' }}
      </button>
    </aside>
    <section class="preview-three-panel">
      <ThreeViewer :model="model" :hdri="hdri" :tiling="tiling" :auto-rotate="autoRotate" :texture-base="textureUrl" />
    </section>
  </article>
</template>
