<script setup>
defineProps({ active: { type: String, required: true } });
defineEmits(['navigate']);

const items = [
  { id: 'gallery', label: '我的圖庫', icon: '/images/nav_1.svg' },
  { id: 'workspace', label: '新增布料', icon: '/images/nav_2.svg' },
  { id: 'history', label: '歷史布料', icon: '/images/nav_3.svg' },
];
</script>

<template>
  <nav class="bottom-nav select-none" aria-label="主要功能">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :class="[{ active: active === item.id }]"
      @click="$emit('navigate', item.id)"
    >
      <span class="nav-icon" :style="{ '--nav-icon': `url(${item.icon})` }" aria-hidden="true"></span>
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
