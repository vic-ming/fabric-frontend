// 環境探測
const probe = [];
const cvs = document.createElement('canvas');
probe.push('webgl2=' + Boolean(cvs.getContext('webgl2')));
probe.push('webgl1=' + Boolean(cvs.getContext('webgl')));
try {
  const { WebGLRenderer } = await import('three');
  const r = new WebGLRenderer();
  probe.push('renderer=ok');
  r.dispose();
} catch (e) {
  probe.push('renderer=FAIL:' + e.message.slice(0, 120));
}
document.title = probe.join(' | ');

import { createApp, h } from 'vue';
import PreviewSettingsNode from './components/PreviewSettingsNode.vue';
import { fabricsWithU3M, builtInPatterns } from './data.js';
import './new-ui.css';
import './styles/app.scss';

const params = new URLSearchParams(location.search);
const fabric = fabricsWithU3M[Number(params.get('f') ?? 0)];
const withPattern = params.get('p') === '1';
const fabricData = {
  code: fabric.code, type: fabric.categoryText, weave: fabric.weaveText,
  composition: fabric.compositionText, gsm: 205, thickness: 0.5,
  swatch: fabric.swatch, hasU3M: true, library: fabric,
};
const app = createApp({
  render: () => h('div', { style: 'padding:16px' }, [
    h(PreviewSettingsNode, {
      id: 'smoke',
      data: withPattern
        ? { kind: 'builtin', pattern: builtInPatterns[1].name, textureUrl: builtInPatterns[1].file, fabric: fabricData }
        : { kind: 'fabric', fabric: fabricData },
    }),
  ]),
});
app.config.errorHandler = (err, _i, info) => { document.title = 'VUE ERROR [' + info + '] ' + (err && err.stack ? err.stack.slice(0,400) : err); };
app.mount('#app');

