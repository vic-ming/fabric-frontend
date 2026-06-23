<script setup>
const model = defineModel({ type: Boolean, default: false });
defineProps({ disabled: { type: Boolean, default: false } });
</script>

<template>
  <label class="toggle-switch" :class="{ 'is-on': model, 'is-disabled': disabled }">
    <input v-model="model" type="checkbox" role="switch" :disabled="disabled" />
    <span class="toggle-track"><span class="toggle-knob"></span></span>
    <span v-if="$slots.default" class="toggle-label"><slot /></span>
  </label>
</template>
