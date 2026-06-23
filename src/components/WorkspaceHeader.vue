<script setup>
defineEmits(['logout']);
</script>

<template>
  <header class="workspace-header select-none">
    <strong class="text-white">織物智慧生成系統</strong>
    <button type="button" class="logout-button focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" @click="$emit('logout')">
      <img src="/images/ic_logout.svg" alt="" aria-hidden="true" />
      登出
    </button>
  </header>
</template>
