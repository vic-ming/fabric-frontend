<script setup>
import { computed, reactive, watch } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { compositions, fabricationsByType, fabricTypes, stretchOptions } from '../data.js';

const emit = defineEmits(['search', 'close']);
const form = reactive({
  type: 'CW',
  weave: 'CWS010',
  compositions: [{ id: crypto.randomUUID(), code: 'SY060', percent: 100 }],
  gsm: 100,
  thickness: 0.2,
  stretch: 'NA',
});

const fabricationOptions = computed(() => fabricationsByType[form.type] ?? []);
const compositionTotal = computed(() => form.compositions.reduce((sum, row) => sum + (Number(row.percent) || 0), 0));
const compositionValid = computed(() => (
  form.compositions.length > 0
  && form.compositions.every((row) => row.code && Number(row.percent) > 0)
  && Math.round(compositionTotal.value * 10) / 10 === 100
));

watch(() => form.type, () => {
  if (!fabricationOptions.value.some((item) => item.value === form.weave)) {
    form.weave = fabricationOptions.value[0]?.value ?? '';
  }
});

function submit() {
  if (!compositionValid.value) return;

  emit('search', {
    ...form,
    typeText: fabricTypes.find((item) => item.value === form.type)?.text ?? form.type,
    weaveText: fabricationOptions.value.find((item) => item.value === form.weave)?.text ?? form.weave,
    compositions: form.compositions.map((row) => ({ ...row })),
    compositionText: form.compositions.map((row) => {
      const name = compositions.find((item) => item.value === row.code)?.text ?? row.code;
      return `${row.percent}% ${name}`;
    }).join('、'),
  });
}

function addComposition() {
  form.compositions.push({ id: crypto.randomUUID(), code: '', percent: null });
}

function removeComposition(index) {
  if (form.compositions.length === 1) {
    form.compositions[0] = { id: crypto.randomUUID(), code: '', percent: null };
    return;
  }
  form.compositions.splice(index, 1);
}
</script>

<template>
  <article class="search-node nodrag text-slate-700">
    <header>
      <span class="tool-symbol"><img src="/images/ic_magic.svg" alt="" aria-hidden="true" /></span>
      <strong>圖片生成</strong>
      <button type="button" aria-label="關閉" @click="$emit('close')"><img src="/images/ic_close.svg" alt="" aria-hidden="true" /></button>
    </header>
    <label>
      <span>布樣種類</span>
      <select v-model="form.type">
        <option v-for="item in fabricTypes" :key="item.value" :value="item.value">{{ item.text }}</option>
      </select>
    </label>
    <label>
      <span>組織</span>
      <select v-model="form.weave">
        <option v-for="item in fabricationOptions" :key="item.value" :value="item.value">{{ item.text }}</option>
      </select>
    </label>
    <fieldset class="composition-section">
      <span>成分</span>
      <div v-for="(row, index) in form.compositions" :key="row.id" class="composition-fields">
        <select v-model="row.code" aria-label="成分種類">
          <option value="" disabled>請選擇</option>
          <option v-for="item in compositions" :key="item.value" :value="item.value">{{ item.text }}</option>
        </select>
        <span class="percent-input">
          <input v-model.number="row.percent" type="number" min="0" max="100" step="0.1" aria-label="成分百分比" />
          <i>%</i>
        </span>
        <button v-if="index === 0" type="button" class="composition-action add" aria-label="新增成分" @click="addComposition"><img src="/images/ic_add_solid.svg" alt="" aria-hidden="true" /></button>
        <span v-else class="composition-action-placeholder"></span>
        <button type="button" class="composition-action delete" aria-label="刪除成分" @click="removeComposition(index)">
          <img src="/images/ic_delete.svg" alt="" aria-hidden="true" />
        </button>
      </div>
      <small :class="['composition-total', { invalid: !compositionValid }]">
        成分總和 {{ compositionTotal.toFixed(1) }}%
      </small>
    </fieldset>
    <div class="paired-fields">
      <label><span>布重 (g/m²)</span><input v-model.number="form.gsm" type="number" /></label>
      <label><span>布厚 (mm)</span><input v-model.number="form.thickness" type="number" step="0.1" /></label>
    </div>
    <label>
      <span>彈性</span>
      <select v-model="form.stretch">
        <option v-for="item in stretchOptions" :key="item.value" :value="item.value">{{ item.text }}</option>
      </select>
    </label>
    <button type="button" class="blue-button search-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500" :disabled="!compositionValid" @click="submit">搜尋</button>
    <Handle type="source" :position="Position.Right" />
  </article>
</template>
