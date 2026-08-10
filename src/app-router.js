import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/LoginView.vue'),
  },
  {
    path: '/workspace',
    name: 'workspace',
    component: () => import('./views/FlowWorkspaceView.vue'),
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: () => import('./views/FabricLibraryView.vue'),
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('./views/FabricLibraryView.vue'),
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('./views/FabricLibraryView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
