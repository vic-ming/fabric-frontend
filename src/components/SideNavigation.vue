<script setup>
defineProps({ active: { type: String, required: true } });
defineEmits(['navigate']);

const items = [
  { id: 'workspace', label: '新增專案', icon: '/images/nav_1.svg' },
  { id: 'gallery', label: '我的圖庫', icon: '/images/nav_2.svg' },
  { id: 'history', label: '歷史布料', icon: '/images/nav_3.svg' },
  { id: 'projects', label: '歷史專案', icon: '/images/nav_4.svg' },
];
</script>

<template>
  <nav class="side-nav select-none" aria-label="主要功能">
    <img class="logo"  src="/images/top-logo.svg" alt="">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :class="[{ active: active === item.id }]"
      :aria-current="active === item.id ? 'page' : undefined"
      @click="$emit('navigate', item.id)"
    >
      <span class="nav-icon" :style="{ '--nav-icon': `url(${item.icon})` }" aria-hidden="true"></span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>
