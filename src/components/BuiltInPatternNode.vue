<script setup>
import { ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';

defineProps({ id: { type: String, required: true } });
const emit = defineEmits(['close', 'preview']);
const source = ref('動物紋');
const category = ref('全部');
const selected = ref('motion');

const patterns = ['motion', 'botanical', 'paint', 'strokes', 'flowers', 'blue-knit'];
</script>

<template>
  <article class="extension-node builtin-pattern-node">
    <Handle type="target" :position="Position.Left" />
    <header class="extension-drag-handle">
      <span class="extension-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM7 16l4-4 3 3 2-2 3 3M8 9h.01" /></svg></span>
      <strong>內建圖案</strong>
      <button type="button" aria-label="關閉內建圖案卡片" @click="emit('close', id)"><img src="/images/ic_close.svg" alt="" /></button>
    </header>
    <label><span>圖案來源</span><select v-model="source"><option>動物紋</option><option>自然</option><option>幾何</option></select></label>
    <label><span>圖案類型</span><select v-model="category"><option>全部</option><option>連續圖案</option><option>單一圖案</option></select></label>
    <div class="builtin-pattern-grid">
      <button v-for="pattern in patterns" :key="pattern" type="button" :class="['pattern-thumb', pattern, { selected: selected === pattern }]" :aria-label="`選擇 ${pattern}`" @click="selected = pattern"></button>
    </div>
    <button type="button" class="blue-button extension-submit">選擇檔案</button>
    <button type="button" class="solid-preview-button" aria-label="預覽內建圖案" @click="emit('preview', { kind: 'builtin', pattern: selected })"><img src="/images/ic_eye.svg" alt="" /></button>
    <Handle type="source" :position="Position.Right" />
  </article>
</template>
