<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createFabricViewer } from '../three-viewer.js';

const props = defineProps({
  model: { type: Object, required: true },
  hdri: { type: Object, required: true },
  tiling: { type: Number, required: true },
  autoRotate: { type: Boolean, required: true },
  // { url, widthCm, heightCm } — 顏色貼圖與它在真實世界的尺寸
  colorMap: { type: Object, required: true },
  // { normal, roughness, alpha, widthCm, heightCm } — 布樣自己的 PBR 貼圖
  materialMaps: { type: Object, default: () => ({}) },
});

const root = ref(null);
let viewer = null;

onMounted(async () => {
  await nextTick();
  viewer = createFabricViewer(root.value, props);
});

watch(() => props.model, (value) => viewer?.setModel(value));
watch(() => props.hdri, (value) => viewer?.setBackground(value));
watch(() => props.tiling, (value) => viewer?.setTiling(value), { immediate: true });
watch(() => props.autoRotate, (value) => viewer?.setAutoRotate(value));
watch(() => props.colorMap, (value) => viewer?.setColorMap(value), { deep: true });
watch(() => props.materialMaps, (value) => viewer?.setMaterialMaps(value), { deep: true });

onBeforeUnmount(() => viewer?.dispose());

defineExpose({ capture: () => viewer?.capture() ?? null });
</script>

<template>
  <div ref="root" class="three-canvas"></div>
</template>
