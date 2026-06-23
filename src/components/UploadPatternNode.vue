<script setup>
import { computed, onBeforeUnmount, ref } from 'vue';
import { Handle, Position } from '@vue-flow/core';

defineProps({ id: { type: String, required: true } });
const emit = defineEmits(['close', 'preview']);
const fileInput = ref(null);
const file = ref(null);
const previewUrl = ref('');
const fileName = ref('');
const width = ref('');
const height = ref('');

const canPreview = computed(() =>
  Boolean(previewUrl.value && fileName.value.trim() && String(width.value).trim() && String(height.value).trim()),
);

function selectFile(files) {
  const nextFile = files?.[0];
  if (!nextFile || nextFile.size > 5 * 1024 * 1024) return;
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = nextFile;
  previewUrl.value = URL.createObjectURL(nextFile);
  fileName.value = nextFile.name;
}

function onDrop(event) {
  selectFile(event.dataTransfer.files);
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>

<template>
  <article class="extension-node upload-pattern-node">
    <Handle type="target" :position="Position.Left" />
    <header class="extension-drag-handle">
      <span class="extension-icon"><svg viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4M5 14v6h14v-6" /></svg></span>
      <strong>上傳圖案</strong>
      <button type="button" aria-label="關閉上傳圖案卡片" @click="emit('close', id)"><img src="/images/ic_close.svg" alt="" /></button>
    </header>
    <button type="button" class="upload-dropzone" @click="fileInput.click()" @dragover.prevent @drop.prevent="onDrop">
      <img v-if="previewUrl" class="upload-preview" :src="previewUrl" :alt="file.name" />
      <template v-else>
        <svg viewBox="0 0 24 24"><path d="M12 16V4M8 8l4-4 4 4M5 14v6h14v-6" /></svg>
        <strong>點擊或拖曳上傳</strong>
        <span>支援 PNG, JPG, MAX 5MB</span>
      </template>
    </button>
    <input ref="fileInput" class="sr-only" type="file" accept="image/png,image/jpeg" @change="selectFile($event.target.files)" />
    <label><span>檔案名稱</span><input v-model.trim="fileName" placeholder="請輸入檔案名稱" /></label>
    <div class="upload-size-fields">
      <label><span>圖片寬度 (cm)</span><input v-model="width" inputmode="decimal" /></label>
      <label><span>圖片高度 (cm)</span><input v-model="height" inputmode="decimal" /></label>
    </div>
    <button type="button" class="blue-button extension-submit" @click="fileInput.click()">選擇檔案</button>
    <button type="button" class="solid-preview-button" aria-label="預覽上傳圖案" :disabled="!canPreview" @click="emit('preview', { kind: 'upload', textureUrl: previewUrl, fileName, width, height })"><img src="/images/ic_eye.svg" alt="" /></button>
    <Handle type="source" :position="Position.Right" />
  </article>
</template>
