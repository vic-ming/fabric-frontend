<script setup>
import WorkspaceHeader from '../components/WorkspaceHeader.vue';
import SideNavigation from '../components/SideNavigation.vue';

defineProps({
  mode: { type: String, default: 'projects' },
});

defineEmits(['navigate', 'logout']);

const fabrics = [
  { name: 'TechSphere 提案A', pattern: 'loading' },
  { name: 'InfinityGallery', pattern: 'blue-knit' },
  { name: 'InfinityGallery', pattern: 'strokes' },
  { name: 'FutureVision_Immersive_Art', pattern: 'flowers' },
  { name: 'InfinityGallery', pattern: 'botanical' },
  { name: 'InfinityGallery', pattern: 'motion' },
  { name: 'InfinityGallery', pattern: 'paint' },
  { name: 'InfinityGallery', pattern: 'motion' },
  { name: 'InfinityGallery', pattern: 'botanical' },
  { name: 'InfinityGallery', pattern: 'motion' },
  { name: 'InfinityGallery', pattern: 'paint selected' },
];
</script>

<template>
  <main class="application-shell library-shell">
    <SideNavigation :active="mode" @navigate="$emit('navigate', $event)" />
    <WorkspaceHeader @logout="$emit('logout')" />
    <section class="library-content antialiased">
      <div v-if="mode === 'gallery' || mode === 'history'" class="gallery-empty-state">
        <p>尚在開發中</p>
      </div>
      <template v-else>
        <div class="library-tools">
          <select aria-label="排序方式"><option>排序方式</option><option>最新建立</option><option>名稱</option></select>
          <label class="search-box"><img src="/images/ic_search.svg" alt="" aria-hidden="true" /><input placeholder="搜尋" /></label>
        </div>
        <div class="fabric-grid">
          <article v-for="fabric in fabrics" :key="`${fabric.name}-${fabric.pattern}`" class="fabric-card group">
            <div class="gallery-pattern" :class="fabric.pattern"><span v-if="fabric.pattern === 'loading'" class="spinner"></span></div>
            <footer><span>{{ fabric.name }}</span><button type="button" aria-label="編輯"><img src="/images/ic_edit.svg" alt="" aria-hidden="true" /></button></footer>
          </article>
          <button type="button" class="new-fabric-card" @click="$emit('navigate', 'workspace')"><img src="/images/ic_add.svg" alt="" aria-hidden="true" />新增布料</button>
        </div>
      </template>
    </section>
  </main>
</template>
