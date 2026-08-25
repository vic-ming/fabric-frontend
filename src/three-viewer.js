import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { defaultTextureCm } from './data/preview-assets.js';

// 貼圖重複次數 = 模型實際公分尺寸 / 貼圖實際公分尺寸 × 使用者的縮放倍率。
//
// 布樣貼圖的實際尺寸來自客戶的 .u3m（例如 WK3-0000001 的織紋一個循環是 3.97 × 4.03 cm）。
// 顏色貼圖與材質貼圖（法線、粗糙度）各自算 —— 使用者換上自己的圖案時，圖案的尺寸會變，
// 但底下那塊布的織紋粒度不該跟著變。

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
  let colorToken = 0;
  let materialToken = 0;
  let autoRotate = false;
  let tilingScale = 1;
  let modelSize = { x: 100, y: 100 };
  let colorSize = { width: defaultTextureCm, height: defaultTextureCm };
  let materialSize = { width: defaultTextureCm, height: defaultTextureCm };
  let colorMap = null;
  let materialMaps = {};       // { normalMap, roughnessMap, alphaMap }
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
  setColorMap(options.colorMap);
  setMaterialMaps(options.materialMaps);
  setModel(options.model);
  resize();

  const observer = new ResizeObserver(resize);
  observer.observe(el);
  window.addEventListener('resize', resize);
  animate();

  function setModel(model) {
    modelSize = {
      x: Number(model?.sizeX) || 100,
      y: Number(model?.sizeY) || Number(model?.sizeX) || 100,
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
      child.material = makeMaterial();
      meshes.push(child);
    });

    fitToView(object);
    group.add(object);
    group.rotation.set(0, 0, 0);
    current = { object, meshes };
    applyMaterials();
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

  /** @param {{url: string, widthCm?: number, heightCm?: number}} source */
  function setColorMap(source) {
    const url = typeof source === 'string' ? source : source?.url;
    colorSize = {
      width: Number(source?.widthCm) || defaultTextureCm,
      height: Number(source?.heightCm) || Number(source?.widthCm) || defaultTextureCm,
    };
    if (!url) {
      applyTiling();
      return;
    }

    const token = ++colorToken;
    textureLoader.load(
      url,
      (texture) => adoptColorMap(texture, token),
      undefined,
      () => adoptColorMap(makeFallbackTexture(), token),
    );
  }

  function adoptColorMap(texture, token) {
    if (disposed || token !== colorToken) {
      texture.dispose();
      return;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    colorMap?.dispose();
    colorMap = texture;
    applyTiling();
    applyMaterials();
  }

  /**
   * 布樣自己的 PBR 貼圖。normal 撐起織紋的立體感、roughness 決定光澤變化，
   * alpha 只有真的有孔洞的布樣（洞洞布/網布）才掛。
   * @param {{normal?: string, roughness?: string, alpha?: string, widthCm?: number, heightCm?: number}} maps
   */
  function setMaterialMaps(maps) {
    materialSize = {
      width: Number(maps?.widthCm) || defaultTextureCm,
      height: Number(maps?.heightCm) || Number(maps?.widthCm) || defaultTextureCm,
    };

    for (const texture of Object.values(materialMaps)) texture?.dispose();
    materialMaps = {};
    applyMaterials();

    const wanted = [
      ['normalMap', maps?.normal],
      ['roughnessMap', maps?.roughness],
      ['alphaMap', maps?.alpha],
    ].filter(([, url]) => Boolean(url));
    if (!wanted.length) return;

    const token = ++materialToken;
    for (const [slot, url] of wanted) {
      textureLoader.load(url, (texture) => {
        if (disposed || token !== materialToken) {
          texture.dispose();
          return;
        }
        // 非顏色資料一律留在線性空間，套 sRGB 會讓凹凸與粗糙度失真
        texture.colorSpace = THREE.NoColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        materialMaps[slot] = texture;
        applyTiling();
        applyMaterials();
      });
    }
  }

  function applyMaterials() {
    if (!current) return;
    for (const mesh of current.meshes) {
      const material = mesh.material;
      material.map = colorMap;
      material.normalMap = materialMaps.normalMap ?? null;
      material.roughnessMap = materialMaps.roughnessMap ?? null;
      material.alphaMap = materialMaps.alphaMap ?? null;
      material.roughness = materialMaps.roughnessMap ? 1 : 0.78;
      // 用 alphaTest 而非半透明，避免布料前後片互相穿透造成排序問題
      material.alphaTest = materialMaps.alphaMap ? 0.5 : 0;
      material.needsUpdate = true;
    }
  }

  function setTiling(value) {
    tilingScale = Number(value) || 1;
    applyTiling();
  }

  function applyTiling() {
    const repeat = (texture, size) => {
      if (!texture) return;
      texture.repeat.set(
        (modelSize.x / size.width) * tilingScale,
        (modelSize.y / size.height) * tilingScale,
      );
      texture.needsUpdate = true;
    };
    repeat(colorMap, colorSize);
    for (const texture of Object.values(materialMaps)) repeat(texture, materialSize);
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

  /** 擷取目前畫面。要先 render 一次，否則沒開 preserveDrawingBuffer 會拿到空白。 */
  function capture() {
    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  }

  function dispose() {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    controls.dispose();
    if (current) disposeObject(current.object);
    colorMap?.dispose();
    for (const texture of Object.values(materialMaps)) texture?.dispose();
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
    return new THREE.Mesh(makeGeometry(name), makeMaterial());
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

  // 一律換上自己的材質：glb 內建的貼圖是模型作者放的示意花色，不是使用者選的布
  function makeMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.78,
      metalness: 0,
      side: THREE.DoubleSide,
    });
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
    setColorMap,
    setMaterialMaps,
    setTiling,
    setBackground,
    setAutoRotate,
    capture,
    dispose,
  };
}
