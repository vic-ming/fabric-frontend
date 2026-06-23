<script setup>
import { RouterView, useRouter } from 'vue-router';

const router = useRouter();

function navigate(target) {
  router.push({ name: target });
}

function logout() {
  router.push({ name: 'login' });
}
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <component
      :is="Component"
      :mode="route.name"
      @logged-in="navigate('workspace')"
      @navigate="navigate"
      @logout="logout"
    />
  </RouterView>
</template>
