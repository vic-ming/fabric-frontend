<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { createFabricViewer } from '../three-viewer.js';

const props = defineProps({
  model: { type: Object, required: true },
  hdri: { type: Object, required: true },
  tiling: { type: Number, required: true },
  autoRotate: { type: Boolean, required: true },
  textureBase: { type: String, required: true },
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
watch(() => props.textureBase, (value) => viewer?.setTexture(value));

onBeforeUnmount(() => viewer?.dispose());
</script>

<template>
  <div ref="root" class="three-canvas"></div>
</template>
