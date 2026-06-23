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

const selectedModelId = ref(6);
const selectedHdriId = ref(1);
const tiling = ref(1);
const autoRotate = ref(false);

const model = computed(() => previewModels.find((item) => item.value === selectedModelId.value) ?? previewModels[0]);
const hdri = computed(() => hdriOptions.find((item) => item.value === selectedHdriId.value) ?? hdriOptions[0]);
const tilingLabel = computed(() => `${Math.round(tiling.value * 100)}%`);
const fabric = computed(() => props.data.fabric ?? {});
const textureUrl = computed(() => props.data.textureUrl || makeGeneratedTexture(props.data));

function makeGeneratedTexture(data) {
  const palette = {
    motion: ['#0f4262', '#78c7ed', '#e4f7ff'],
    botanical: ['#f8f3e7', '#7b9b72', '#eac4a0'],
    paint: ['#068e9e', '#f36d33', '#11495e'],
    strokes: ['#faf7ed', '#5f341b', '#ed315f'],
    flowers: ['#f2e366', '#3b853b', '#f04f26'],
    'blue-knit': ['#60a8ed', '#86c6fa', '#c7ecff'],
  };
  const solidColor = data.hex || '#d7d7d7';
  const colors = data.kind === 'solid'
    ? [solidColor, solidColor, solidColor]
    : (palette[data.pattern] ?? palette.motion);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${colors[0]}"/><path d="M-60 0 196 256M0 0l256 256M60 0l256 256" stroke="${colors[1]}" stroke-width="28"/><path d="M0 64h256M0 192h256" stroke="${colors[2]}" stroke-width="14" opacity=".75"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
          <div class="preview-info-swatch" :style="{ backgroundImage: `url(${textureUrl})` }"></div>
          <dl>
            <dt>種類</dt><dd>{{ fabric.type || '圓編' }}</dd>
            <dt>圖案</dt><dd>{{ data.pattern || data.pantone || '素色' }}</dd>
            <dt>組織</dt><dd>{{ fabric.weave || '單面平紋' }}</dd>
            <dt>加工</dt><dd>—</dd>
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
        <label><span>預覽型態</span><select v-model.number="selectedModelId"><option v-for="item in previewModels" :key="item.value" :value="item.value">{{ item.displayname }}</option></select></label>
      </section>

      <button type="button" class="blue-button preview-save"><img src="/images/ic_eye_solid_white.svg" alt="" />儲存並預覽</button>
      <button type="button" class="preview-download"><img src="/images/ic_download.svg" alt="" />下載 u3ma 格式</button>
    </aside>
    <section class="preview-three-panel">
      <ThreeViewer :model="model" :hdri="hdri" :tiling="tiling" :auto-rotate="autoRotate" :texture-base="textureUrl" />
    </section>
  </article>
</template>
