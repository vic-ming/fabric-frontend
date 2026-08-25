<script setup>
import { computed, reactive, watch } from 'vue';
import { Handle, Position } from '@vue-flow/core';
import { compositions, fabricationsByType, fabricTypes, specLimits, stretchOptions } from '../data.js';
import { checkSpecRange } from '../api.js';

const emit = defineEmits(['search', 'close']);
const form = reactive({
  type: 'CW',
  weave: 'CWS010',
  compositions: [{ id: crypto.randomUUID(), code: 'SY060', percent: 100 }],
  gsm: 100,
  thickness: 0.2,
  opPercentage: 0,
  stretch: 'NA',
});

const fabricationOptions = computed(() => fabricationsByType[form.type] ?? []);
const compositionTotal = computed(() => form.compositions.reduce((sum, row) => sum + (Number(row.percent) || 0), 0));
const compositionValid = computed(() => (
  form.compositions.length > 0
  && form.compositions.every((row) => row.code && Number(row.percent) > 0)
  && Math.round(compositionTotal.value * 10) / 10 === 100
));

// 資料內容.xlsx 的輸入限制（硬性擋下）
const rangeErrors = computed(() => {
  const errors = [];
  const check = (value, limit, label) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num < limit.min || num > limit.max) {
      errors.push(`${label}需介於 ${limit.min} ~ ${limit.max} ${limit.unit}`);
    }
  };
  check(form.gsm, specLimits.gsm, '布重');
  check(form.thickness, specLimits.thickness, '布厚');
  check(form.opPercentage, specLimits.opPercentage, 'OP 含量');
  return errors;
});

// Specs2VS 模型的訓練範圍比較窄，超出時只提醒不擋
const rangeWarnings = computed(() => (rangeErrors.value.length ? [] : checkSpecRange(form)));

const canSubmit = computed(() => compositionValid.value && rangeErrors.value.length === 0);

watch(() => form.type, () => {
  if (!fabricationOptions.value.some((item) => item.value === form.weave)) {
    form.weave = fabricationOptions.value[0]?.value ?? '';
  }
});

function submit() {
  if (!canSubmit.value) return;

  emit('search', {
    ...form,
    typeText: fabricTypes.find((item) => item.value === form.type)?.text ?? form.type,
    weaveText: fabricationOptions.value.find((item) => item.value === form.weave)?.text ?? form.weave,
    compositions: form.compositions.map((row) => ({ ...row })),
    compositionText: form.compositions.map((row) => {
      const name = compositions.find((item) => item.value === row.code)?.text ?? row.code;
      return `${row.percent}% ${name}`;
    }).join('、'),
    warnings: rangeWarnings.value,
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
        <option v-for="item in fabricationOptions" :key="item.value" :value="item.value">{{ item.text }}{{ item.provisional ? '（代碼待確認）' : '' }}</option>
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
      <label>
        <span>布重 (g/m²)</span>
        <input v-model.number="form.gsm" type="number" :min="specLimits.gsm.min" :max="specLimits.gsm.max" />
      </label>
      <label>
        <span>布厚 (mm)</span>
        <input v-model.number="form.thickness" type="number" step="0.01" :min="specLimits.thickness.min" :max="specLimits.thickness.max" />
      </label>
    </div>
    <div class="paired-fields">
      <label>
        <span>OP 含量 (%)</span>
        <input v-model.number="form.opPercentage" type="number" step="0.1" :min="specLimits.opPercentage.min" :max="specLimits.opPercentage.max" />
      </label>
      <label>
        <span>彈性</span>
        <select v-model="form.stretch">
          <option v-for="item in stretchOptions" :key="item.value" :value="item.value">{{ item.text }}</option>
        </select>
      </label>
    </div>
    <!-- 客戶的布樣清單沒有彈性欄位，這個條件目前只會帶進 API 呼叫，不參與布樣比對 -->
    <p v-if="form.stretch !== 'NA'" class="spec-message">布樣清單未提供彈性資料，此條件暫不影響搜尋結果</p>
    <p v-for="message in rangeErrors" :key="message" class="spec-message error">{{ message }}</p>
    <p v-for="message in rangeWarnings" :key="message" class="spec-message warning">{{ message }}，預測可信度較低</p>
    <button type="button" class="blue-button search-button focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500" :disabled="!canSubmit" @click="submit">搜尋</button>
    <Handle type="source" :position="Position.Right" />
  </article>
</template>
