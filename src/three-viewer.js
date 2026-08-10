import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// 布料材質在模型上的重複次數由 previewModels 的 tilingX / tilingY 決定
// （= 模型公分尺寸 / 9.144），使用者的縮放滑桿再乘上去。

export function createFabricViewer(el, options) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 500);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  const controls = new OrbitControls(camera, renderer.domElement);
  const textureLoader = new THREE.TextureLoader();
  const gltfLoader = new GLTFLoader();
  const rgbeLoader = new RGBELoader();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const group = new THREE.Group();

  let raf = null;
  let disposed = false;
  let current = null;          // { object, meshes }
  let modelToken = 0;
  let hdrToken = 0;
  let autoRotate = false;
  let tilingScale = 1;
  let modelTiling = { x: 1, y: 1 };
  let baseTexture = null;
  let envMap = null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  pmrem.compileEquirectangularShader();
  el.appendChild(renderer.domElement);

  camera.position.set(0, 1.1, 4.2);
  controls.enableDamping = true;
  controls.target.set(0, 0.1, 0);

  scene.add(group);

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x676767, 1.2);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 4, 5);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(-4, 2, -2);
  scene.add(fill);

  setBackground(options.hdri);
  setTexture(options.textureBase);
  setModel(options.model);
  resize();

  const observer = new ResizeObserver(resize);
  observer.observe(el);
  window.addEventListener('resize', resize);
  animate();

  function setModel(model) {
    modelTiling = {
      x: Number(model?.tilingX) || 1,
      y: Number(model?.tilingY) || Number(model?.tilingX) || 1,
    };
    applyTiling();

    const token = ++modelToken;
    const url = model?.file;

    if (!url || !url.endsWith('.glb')) {
      // 尚未交付 glb（例如 Specs2VS 的 obj 物性模型）時退回程序化幾何
      showObject(makePlaceholder(model?.displayname), token);
      return;
    }

    gltfLoader.load(
      url,
      (gltf) => showObject(gltf.scene, token),
      undefined,
      () => showObject(makePlaceholder(model?.displayname), token),
    );
  }

  function showObject(object, token) {
    if (disposed || token !== modelToken) {
      if (object !== current?.object) disposeObject(object);
      return;
    }

    if (current) {
      group.remove(current.object);
      disposeObject(current.object);
    }

    const meshes = [];
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.material = makeMaterial(child.material);
      meshes.push(child);
    });

    fitToView(object);
    group.add(object);
    group.rotation.set(0, 0, 0);
    current = { object, meshes };
    applyTextureToMeshes();
  }

  // 把模型縮放/置中到固定的取景框，讓沙發跟眼罩都填滿畫面
  function fitToView(object) {
    object.updateWorldMatrix(true, true);
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.4 / longest;

    object.scale.multiplyScalar(scale);
    object.position.sub(center.multiplyScalar(scale));
    object.position.y += (size.y * scale) / 2 - 1.2;
  }

  function setTexture(url) {
    if (!url) return;
    textureLoader.load(
      url,
      (texture) => {
        adoptTexture(texture);
      },
      undefined,
      () => {
        adoptTexture(makeFallbackTexture());
      },
    );
  }

  function adoptTexture(texture) {
    if (disposed) {
      texture.dispose();
      return;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    baseTexture?.dispose();
    baseTexture = texture;
    applyTiling();
    applyTextureToMeshes();
  }

  function applyTextureToMeshes() {
    if (!current) return;
    for (const mesh of current.meshes) {
      mesh.material.map = baseTexture;
      mesh.material.needsUpdate = true;
    }
  }

  function setTiling(value) {
    tilingScale = Number(value) || 1;
    applyTiling();
  }

  function setBackground(hdri) {
    const file = hdri?.file ?? '#e5e5e5';
    const intensity = Number(hdri?.intensity) || 0.6;
    const token = ++hdrToken;

    if (!file || file.startsWith('#')) {
      // Asset.xlsx 註明素色背景不使用 HDR，直接以顏色填充
      scene.background = new THREE.Color(file || '#e5e5e5');
      scene.environment = null;
      disposeEnv();
      hemisphere.intensity = 1.2;
      renderer.toneMappingExposure = 1;
      return;
    }

    rgbeLoader.load(
      file,
      (hdr) => {
        if (disposed || token !== hdrToken) {
          hdr.dispose();
          return;
        }
        const target = pmrem.fromEquirectangular(hdr);
        hdr.dispose();
        disposeEnv();
        envMap = target.texture;
        scene.environment = envMap;
        scene.background = envMap;
        hemisphere.intensity = 0.25;
        renderer.toneMappingExposure = intensity * 1.6;
      },
      undefined,
      () => {
        if (disposed || token !== hdrToken) return;
        scene.background = new THREE.Color(0xe5e5e5);
      },
    );
  }

  function setAutoRotate(value) {
    autoRotate = Boolean(value);
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    controls.dispose();
    if (current) disposeObject(current.object);
    baseTexture?.dispose();
    disposeEnv();
    pmrem.dispose();
    renderer.dispose();
    el.innerHTML = '';
  }

  function disposeEnv() {
    envMap?.dispose();
    envMap = null;
  }

  function disposeObject(object) {
    object?.traverse?.((child) => {
      if (!child.isMesh) return;
      child.geometry?.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) material?.dispose();
    });
  }

  function makePlaceholder(name = '') {
    const geometry = makeGeometry(name);
    return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  }

  function makeGeometry(name = '') {
    if (name.includes('布料') || name.includes('布簾') || name.includes('羅馬')) {
      return new THREE.PlaneGeometry(2.8, 2.1, 48, 48);
    }
    if (name.includes('枕') || name.includes('床')) {
      return new THREE.BoxGeometry(2.6, 1.25, 0.75, 24, 12, 8);
    }
    if (name.includes('包')) {
      return new THREE.BoxGeometry(1.8, 1.5, 0.9, 24, 18, 12);
    }
    if (name.includes('鞋')) {
      return new THREE.CapsuleGeometry(0.62, 1.4, 12, 28);
    }
    if (name.includes('T-Shirt') || name.includes('外套') || name.includes('洋裝') || name.includes('襯衫')) {
      return new THREE.CylinderGeometry(0.8, 1.05, 2.2, 48, 16, true);
    }
    return new THREE.SphereGeometry(1.2, 64, 40);
  }

  // 沿用 glb 內建材質的 normal / roughness 等貼圖，只換掉 basecolor
  function makeMaterial(source) {
    const origin = Array.isArray(source) ? source[0] : source;
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: baseTexture,
      normalMap: origin?.normalMap ?? null,
      roughnessMap: origin?.roughnessMap ?? null,
      roughness: origin?.roughness ?? 0.78,
      metalness: origin?.metalness ?? 0.02,
      side: THREE.DoubleSide,
    });
    if (origin && origin !== material) origin.dispose?.();
    return material;
  }

  function makeFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7f7f4';
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = '#1e5b58';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillRect(128, 128, 128, 128);
    ctx.strokeStyle = '#cab45f';
    ctx.lineWidth = 10;
    for (let i = -256; i < 512; i += 42) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
    }
    return new THREE.CanvasTexture(canvas);
  }

  function applyTiling() {
    if (!baseTexture) return;
    baseTexture.repeat.set(modelTiling.x * tilingScale, modelTiling.y * tilingScale);
    baseTexture.needsUpdate = true;
  }

  function resize() {
    const width = el.clientWidth || 640;
    const height = el.clientHeight || 500;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function animate() {
    raf = requestAnimationFrame(animate);
    if (autoRotate) group.rotation.y += 0.005;
    controls.update();
    renderer.render(scene, camera);
  }

  return {
    setModel,
    setTiling,
    setBackground,
    setAutoRotate,
    setTexture,
    dispose,
  };
}
