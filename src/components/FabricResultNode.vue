<script setup>
import { computed } from 'vue';
import { Handle, Position } from '@vue-flow/core';

const props = defineProps({
  data: { type: Object, required: true },
  extensionCount: { type: Number, default: 0 },
  maxExtensions: { type: Number, default: 5 },
});
const emit = defineEmits(['extend']);

const full = computed(() => props.extensionCount >= props.maxExtensions);

function selectExtension(type) {
  if (full.value) return;
  emit('extend', type);
}
</script>

<template>
  <article class="fabric-node">
    <Handle type="target" :position="Position.Left" />
    <header>{{ data.code }}</header>
    <div class="fabric-swatch" :class="data.swatch ? null : data.pattern">
      <img v-if="data.swatch" :src="data.swatch" :alt="`${data.code} 組織瀏覽圖`" loading="lazy" />
      <span v-if="data.hasU3M" class="fabric-badge">U3M</span>
    </div>
    <dl>
      <dt>織物</dt><dd>{{ data.type }}</dd>
      <dt>織物組織</dt><dd>{{ data.weave }}</dd>
      <dt>布重</dt><dd>{{ data.gsm }} g/m²</dd>
      <dt>布厚</dt><dd>{{ data.thickness }} mm</dd>
      <dt>後整理</dt><dd></dd>
      <dt>成分</dt><dd>{{ data.composition }}</dd>
    </dl>
    <div class="node-add-control nodrag">
      <button type="button" class="node-add" aria-label="新增圖案" aria-haspopup="menu">＋</button>
      <div class="fabric-add-menu" role="menu" aria-label="新增圖案方式">
        <button type="button" role="menuitem" :disabled="full" @click="selectExtension('builtin')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM7 16l4-4 3 3 2-2 3 3M8 9h.01" /></svg>
          <span>內建圖案</span>
        </button>
        <div class="line"></div>
        <button type="button" role="menuitem" :disabled="full" @click="selectExtension('solid')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM5 9h14" /></svg>
          <span>素色</span>
        </button>
        <div class="line"></div>
        <button type="button" role="menuitem" :disabled="full" @click="selectExtension('upload')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M8 8l4-4 4 4M5 14v6h14v-6" /></svg>
          <span>上傳圖案</span>
        </button>
        <p v-if="full" class="fabric-add-full bg-[#c43e4a]">已達上限</p>
      </div>
    </div>
    <Handle type="source" :position="Position.Right" />
  </article>
</template>
