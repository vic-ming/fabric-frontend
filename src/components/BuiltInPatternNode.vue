<script setup>
import { computed, ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { builtInPatterns } from '../data.js';

defineProps({ id: { type: String, required: true } });
const emit = defineEmits(['close', 'preview']);

// 客戶交付的 15 張為測試圖，尚未附「圖案來源」分類，因此來源選單先只有全部。
const source = ref('all');
const category = ref('all');
const keyword = ref('');
const selected = ref(builtInPatterns[0]?.id ?? '');

const visiblePatterns = computed(() => builtInPatterns.filter((pattern) => {
  if (category.value === 'seamless' && !pattern.square) return false;
  if (category.value === 'single' && pattern.square) return false;
  if (keyword.value && !pattern.name.toLowerCase().includes(keyword.value.toLowerCase())) return false;
  return true;
}));

const selectedPattern = computed(() => builtInPatterns.find((item) => item.id === selected.value) ?? null);

function preview() {
  if (!selectedPattern.value) return;
  emit('preview', {
    kind: 'builtin',
    pattern: selectedPattern.value.name,
    textureUrl: selectedPattern.value.file,
  });
}
</script>

<template>
  <article class="extension-node builtin-pattern-node">
    <Handle type="target" :position="Position.Left" />
    <header class="extension-drag-handle">
      <span class="extension-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM7 16l4-4 3 3 2-2 3 3M8 9h.01" /></svg></span>
      <strong>內建圖案</strong>
      <button type="button" aria-label="關閉內建圖案卡片" @click="emit('close', id)"><img src="/images/ic_close.svg" alt="" /></button>
    </header>
    <label>
      <span>圖案來源</span>
      <select v-model="source">
        <option value="all">全部（分類待客戶提供）</option>
      </select>
    </label>
    <label>
      <span>圖案類型</span>
      <select v-model="category">
        <option value="all">全部</option>
        <option value="seamless">連續圖案</option>
        <option value="single">單一圖案</option>
      </select>
    </label>
    <label><span>關鍵字</span><input v-model.trim="keyword" placeholder="輸入圖案名稱" /></label>
    <div class="builtin-pattern-grid">
      <button
        v-for="pattern in visiblePatterns"
        :key="pattern.id"
        type="button"
        :class="['pattern-thumb', { selected: selected === pattern.id }]"
        :aria-label="`選擇 ${pattern.name}`"
        @click="selected = pattern.id"
      >
        <img :src="pattern.thumb" :alt="pattern.name" loading="lazy" />
        <span>{{ pattern.name }}</span>
      </button>
      <p v-if="!visiblePatterns.length" class="pattern-empty">沒有符合的圖案</p>
    </div>
    <button type="button" class="solid-preview-button" aria-label="預覽內建圖案" :disabled="!selectedPattern" @click="preview"><img src="/images/ic_eye.svg" alt="" /></button>
    <Handle type="source" :position="Position.Right" />
  </article>
</template>
