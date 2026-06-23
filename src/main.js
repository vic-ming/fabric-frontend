import { createApp } from 'vue';
import App from './App.vue';
import { router } from './app-router.js';
import './tailwind.css';
import './new-ui.css';
import './styles/app.scss';

createApp(App).use(router).mount('#app');
