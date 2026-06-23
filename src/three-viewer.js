import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createFabricViewer(el, options) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  const controls = new OrbitControls(camera, renderer.domElement);
  const textureLoader = new THREE.TextureLoader();
  const group = new THREE.Group();
  let raf = null;
  let currentMesh = null;
  let autoRotate = false;
  let tiling = 1;
  let baseTexture = null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);

  camera.position.set(0, 1.1, 4.2);
  controls.enableDamping = true;
  controls.target.set(0, 0.1, 0);

  scene.add(group);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x676767, 1.2));

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
    if (currentMesh) {
      group.remove(currentMesh);
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
    }

    const geometry = makeGeometry(model?.displayname);
    currentMesh = new THREE.Mesh(geometry, makeMaterial());
    group.add(currentMesh);
    group.rotation.set(0, 0, 0);
  }

  function setTexture(url) {
    if (!url) return;
    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        baseTexture = texture;
        applyTiling();
        if (currentMesh) currentMesh.material.map = baseTexture;
        if (currentMesh) currentMesh.material.needsUpdate = true;
      },
      undefined,
      () => {
        baseTexture = makeFallbackTexture();
        if (currentMesh) currentMesh.material.map = baseTexture;
        if (currentMesh) currentMesh.material.needsUpdate = true;
      },
    );
  }

  function setTiling(value) {
    tiling = Number(value) || 1;
    applyTiling();
  }

  function setBackground(hdri) {
    const file = hdri?.file ?? '#e5e5e5';
    if (file.startsWith('#')) {
      scene.background = new THREE.Color(file);
      return;
    }

    const colors = {
      lilienstein: 0x87a56f,
      studio: 0xd6d7db,
      royal: 0xa7b2c8,
      lebombo: 0xc8b58a,
    };
    const match = Object.keys(colors).find((name) => file.includes(name));
    scene.background = new THREE.Color(colors[match] ?? 0xe5e5e5);
  }

  function setAutoRotate(value) {
    autoRotate = Boolean(value);
  }

  function dispose() {
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener('resize', resize);
    controls.dispose();
    renderer.dispose();
    if (currentMesh) {
      currentMesh.geometry.dispose();
      currentMesh.material.dispose();
    }
    el.innerHTML = '';
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

  function makeMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: baseTexture,
      roughness: 0.78,
      metalness: 0.02,
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
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    applyTiling(texture);
    return texture;
  }

  function applyTiling(texture = baseTexture) {
    if (!texture) return;
    texture.repeat.set(tiling, tiling);
    texture.needsUpdate = true;
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
