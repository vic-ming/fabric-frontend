<script setup>
import { computed, defineAsyncComponent, nextTick, ref } from 'vue';
import { MarkerType, VueFlow, useVueFlow } from '@vue-flow/core';
import WorkspaceHeader from '../components/WorkspaceHeader.vue';
import SideNavigation from '../components/SideNavigation.vue';
import FabricSearchNode from '../components/FabricSearchNode.vue';
import FabricResultNode from '../components/FabricResultNode.vue';
import SolidColorNode from '../components/SolidColorNode.vue';
import BuiltInPatternNode from '../components/BuiltInPatternNode.vue';
import UploadPatternNode from '../components/UploadPatternNode.vue';
import { searchFabrics } from '../api.js';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

const PreviewSettingsNode = defineAsyncComponent(() => import('../components/PreviewSettingsNode.vue'));

defineEmits(['navigate', 'logout']);

const nodes = ref([]);
const edges = ref([]);
const hasResults = ref(false);
const fabricCount = computed(() => nodes.value.filter((node) => node.id.startsWith('fabric-')).length);
const flowStage = ref(null);
const { fitView, getViewport, screenToFlowCoordinate, setViewport } = useVueFlow();

async function openSearch() {
  if (nodes.value.some((node) => node.type === 'search')) return;

  const bounds = flowStage.value.getBoundingClientRect();
  const center = screenToFlowCoordinate({
    x: bounds.left + bounds.width / 2,
    y: bounds.top + bounds.height / 2,
  });
  const searchNode = { id: 'search', type: 'search', position: center, draggable: true };
  nodes.value.push(searchNode);

  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const element = flowStage.value.querySelector('.vue-flow__node-search');
  if (!element) return;

  const { zoom } = getViewport();
  const renderedNode = nodes.value.find((node) => node.id === 'search');
  if (!renderedNode) return;
  renderedNode.position = {
    x: center.x - element.offsetWidth / zoom / 2,
    y: center.y - element.offsetHeight / zoom / 2,
  };
}

// 客戶未提供搜尋 API，先以交付的 40 筆布樣清單比對；一次最多開這麼多張結果卡
const MAX_RESULTS = 4;

async function runSearch(form) {
  const searchNode = nodes.value.find((node) => node.id === 'search');
  const searchPosition = searchNode?.position ?? { x: 0, y: 0 };
  const resultX = searchPosition.x + 420;

  const matches = (await searchFabrics(form)).slice(0, MAX_RESULTS);
  const resultNodes = matches.map((fabric, index) => ({
    id: `fabric-${fabric.code}`,
    type: 'fabric',
    position: { x: resultX, y: searchPosition.y - 100 + index * 500 },
    data: {
      code: fabric.code,
      type: fabric.categoryText,
      weave: fabric.weaveText,
      composition: fabric.compositionText,
      // 布重/布厚未隨布樣清單交付，先沿用使用者輸入的規格
      gsm: form.gsm,
      thickness: form.thickness,
      swatch: fabric.swatch,
      hasU3M: Boolean(fabric.u3m),
      library: fabric,
      pattern: index % 2 === 0 ? 'pattern-dark' : 'pattern-light',
    },
  }));

  nodes.value = [
    ...nodes.value.filter((node) => !node.id.startsWith('fabric-') && !node.id.startsWith('extension-') && !node.id.startsWith('preview-')),
    ...resultNodes,
  ];
  edges.value = resultNodes.map((node) => ({
    id: `search-${node.id}`,
    source: 'search',
    target: node.id,
    type: 'bezier',
    animated: false,
    markerEnd: MarkerType.ArrowClosed,
    style: { stroke: '#4775ee', strokeWidth: 2 },
  }));
  hasResults.value = true;
  await nextTick();
  await fitView({ padding: 1, maxZoom: 0.65, duration: 500 });
  const viewport = getViewport();
  await setViewport(
    { ...viewport, x: viewport.x - 400, y: viewport.y - 100 },
    { duration: 500 },
  );
}

function closeSearch() {
  nodes.value = [];
  edges.value = [];
  hasResults.value = false;
}

const MAX_EXTENSIONS = 5;
let extensionSeq = 0;

function extensionCount(sourceId) {
  return nodes.value.filter((node) => node.id.startsWith(`extension-${sourceId}-`)).length;
}

function extendFabric(sourceId, type) {
  const extensionTypes = ['builtin', 'solid', 'upload'];
  if (!extensionTypes.includes(type)) return;
  const source = nodes.value.find((node) => node.id === sourceId);
  if (!source) return;

  const count = extensionCount(sourceId);
  if (count >= MAX_EXTENSIONS) return;

  const nodeId = `extension-${sourceId}-${extensionSeq++}`;
  nodes.value.push({
    id: nodeId,
    type,
    position: { x: source.position.x + 430, y: source.position.y + 20 + count * 460 },
    data: { fabric: source.data },
    draggable: true,
    dragHandle: '.extension-drag-handle',
  });

  edges.value.push({
    id: `${sourceId}-${nodeId}`,
    source: sourceId,
    target: nodeId,
    type: 'bezier',
    markerEnd: MarkerType.ArrowClosed,
    style: { stroke: '#4775ee', strokeWidth: 2 },
  });
}

async function openPreview(sourceId, previewData) {
  const source = nodes.value.find((node) => node.id === sourceId);
  if (!source) return;

  const nodeId = `preview-${sourceId}`;
  const nodeData = { ...previewData, fabric: source.data.fabric };
  const existing = nodes.value.find((node) => node.id === nodeId);
  if (existing) {
    existing.data = nodeData;
  } else {
    nodes.value.push({
      id: nodeId,
      type: 'preview',
      position: { x: source.position.x + 430, y: source.position.y - 40 },
      data: nodeData,
      draggable: true,
      dragHandle: '.preview-drag-handle',
    });
  }

  const edgeId = `${sourceId}-${nodeId}`;
  if (!edges.value.some((edge) => edge.id === edgeId)) {
    edges.value.push({
      id: edgeId,
      source: sourceId,
      target: nodeId,
      type: 'bezier',
      markerEnd: MarkerType.ArrowClosed,
      style: { stroke: '#4775ee', strokeWidth: 2 },
    });
  }

  await nextTick();
  await fitView({ padding: 0.25, maxZoom: 0.55, duration: 500 });
}

function removeNode(nodeId) {
  const childIds = edges.value
    .filter((edge) => edge.source === nodeId && edge.target.startsWith('preview-'))
    .map((edge) => edge.target);
  const removedIds = new Set([nodeId, ...childIds]);
  nodes.value = nodes.value.filter((node) => !removedIds.has(node.id));
  edges.value = edges.value.filter((edge) => !removedIds.has(edge.source) && !removedIds.has(edge.target));
}
</script>

<template>
  <main class="application-shell">
    <SideNavigation active="workspace" @navigate="$emit('navigate', $event)" />
    <WorkspaceHeader @logout="$emit('logout')" />
    <section ref="flowStage" class="flow-stage">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :min-zoom="0.45"
        :max-zoom="1"
        :default-viewport="{ x: 0, y: 0, zoom: 1 }"
        @pane-click="openSearch"
      >
        <template #node-search><FabricSearchNode @search="runSearch" @close="closeSearch" /></template>
        <template #node-fabric="nodeProps"><FabricResultNode :data="nodeProps.data" :extension-count="extensionCount(nodeProps.id)" :max-extensions="MAX_EXTENSIONS" @extend="extendFabric(nodeProps.id, $event)" /></template>
        <template #node-solid="nodeProps"><SolidColorNode :id="nodeProps.id" @close="removeNode" @preview="openPreview(nodeProps.id, $event)" /></template>
        <template #node-builtin="nodeProps"><BuiltInPatternNode :id="nodeProps.id" @close="removeNode" @preview="openPreview(nodeProps.id, $event)" /></template>
        <template #node-upload="nodeProps"><UploadPatternNode :id="nodeProps.id" @close="removeNode" @preview="openPreview(nodeProps.id, $event)" /></template>
        <template #node-preview="nodeProps"><PreviewSettingsNode :id="nodeProps.id" :data="nodeProps.data" @close="removeNode" /></template>
      </VueFlow>

      <div v-if="!nodes.length" class="empty-flow" @click="openSearch">
        <img class="empty-icon" src="/images/start.svg" alt="" aria-hidden="true" />
        <strong>隨意點擊畫面開始新增布料！</strong>
      </div>

      <Teleport to="body">
        <div v-if="hasResults" class="result-dialog-layer">
          <div class="result-toast" role="dialog" aria-modal="true" aria-label="搜尋結果">
            找到 {{ fabricCount }} 筆相符布料
            <button type="button" @click="hasResults = false">了解</button>
          </div>
        </div>
      </Teleport>
    </section>
  </main>
</template>
