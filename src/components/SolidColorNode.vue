<script setup>
import { computed, ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { pantoneByCode } from '../data/pantone.js';

defineProps({ id: { type: String, required: true } });
const emit = defineEmits(['close', 'preview']);
const pantone = ref('');

const matched = computed(() => pantoneByCode[pantone.value] ?? null);
const notFound = computed(() => pantone.value !== '' && !matched.value);
</script>

<template>
  <article class="solid-color-node">
    <Handle type="target" :position="Position.Left" />
    <header class="extension-drag-handle">
      <span class="solid-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v14H5zM5 9h14" /></svg>
      </span>
      <strong>素色</strong>
      <button type="button" aria-label="關閉素色卡片" @click="emit('close', id)">
        <img src="/images/ic_close.svg" alt="" aria-hidden="true" />
      </button>
    </header>
    <div class="solid-preview" :style="matched ? { background: matched.hex } : null"></div>
    <label>
      <span>Pantone色號</span>
      <input v-model.trim="pantone" placeholder="例：11-0103" />
    </label>
    <p v-if="notFound" class="solid-hint">查無此色號</p>
    <!-- <button type="button" class="blue-button solid-search">搜尋</button> -->
    <button type="button" class="solid-preview-button" aria-label="預覽素色" :disabled="!matched" @click="emit('preview', { kind: 'solid', pantone, hex: matched.hex })">
      <img src="/images/ic_eye.svg" alt="" aria-hidden="true" />
    </button>
    <Handle type="source" :position="Position.Right" />
  </article>
</template>
