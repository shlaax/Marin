(function () {
  const container = document.getElementById('boat-3d');
  if (!container) return;

  const BOAT_LENGTH = 6, MAX_BEAM = 2, MAX_DRAFT = 0.8, FREEBOARD = 0.5;
  const SEGMENTS = 28;

  const SECTIONS = {
    bottom: { color: 0x1B6CA8, emissive: 0x1B6CA8, label: 'Bundmaling', price: 'Fra 6.500 DKK', desc: 'Professionel afrensning og påføring af miljøvenlig bundmaling. Alt materialer inkluderet.', offset: [0, -0.8, 0] },
    hull: { color: 0x0D3B66, emissive: 0x0D3B66, label: 'Udvendig Rengøring', price: 'Fra 1.800 DKK', desc: 'Skrog, dæk og gelcoat vaskes, poleres og beskyttes med premium marine-voks.', offset: [0, 0.6, 0] },
    deck: { color: 0xE8E4D8, emissive: 0xF5F5F0, label: 'Polering & Dæk', price: 'Fra 3.200 DKK', desc: 'Flertrins maskinpolering der fjerner oxidering og genskaber glansen i din gelcoat.', offset: [0, 1.4, 0] },
    cabin: { color: 0xC9A84C, emissive: 0xC9A84C, label: 'Indvendig Rengøring', price: 'Fra 1.200 DKK', desc: 'Komplet rengøring af kahyt, salon, pantry og hoveder. Vi efterlader din båd renere end ny.', offset: [0, 2.2, 0.3] }
  };

  // Hull shape functions
  function halfWidth(t) {
    if (t < 0.05) return t / 0.05 * 0.08;
    if (t < 0.35) return 0.08 + (t - 0.05) / 0.3 * 0.92;
    if (t < 0.8) return 1.0;
    return 1.0 - (t - 0.8) / 0.2 * 0.18;
  }
  function keelDepth(t) {
    if (t < 0.15) return Math.pow(t / 0.15, 0.7);
    if (t < 0.75) return 1.0;
    return 1.0 - Math.pow((t - 0.75) / 0.25, 1.5) * 0.35;
  }

  // Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a12, 0.04);
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(4, 3, 5);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0x8FA3B1, 0.4));
  const key = new THREE.DirectionalLight(0xffeedd, 1.2);
  key.position.set(5, 8, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x6688cc, 0.4);
  fill.position.set(-3, 4, -2);
  scene.add(fill);
  const rim = new THREE.PointLight(0xC9A84C, 0.6, 15);
  rim.position.set(-2, 2, -4);
  scene.add(rim);

  // Build boat geometry
  function buildSection(type) {
    const verts = [], idxs = [];
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const z = (t - 0.5) * BOAT_LENGTH;
      const w = halfWidth(t) * MAX_BEAM / 2;
      const d = keelDepth(t) * MAX_DRAFT;
      if (type === 'bottom') {
        verts.push(0, -d, z, -w * 0.85, -d * 0.15, z, w * 0.85, -d * 0.15, z);
      } else if (type === 'hull') {
        verts.push(-w * 0.85, -d * 0.15, z, -w, FREEBOARD, z, w * 0.85, -d * 0.15, z, w, FREEBOARD, z);
      } else if (type === 'deck') {
        verts.push(-w, FREEBOARD, z, w, FREEBOARD, z);
      }
    }
    if (type === 'bottom') {
      for (let i = 0; i < SEGMENTS; i++) {
        const a = i * 3, b = (i + 1) * 3;
        idxs.push(a, b, a + 1, a + 1, b, b + 1);
        idxs.push(a, a + 2, b, b, a + 2, b + 2);
        idxs.push(a + 1, b + 1, a + 2, a + 2, b + 1, b + 2);
      }
    } else if (type === 'hull') {
      for (let i = 0; i < SEGMENTS; i++) {
        const a = i * 4, b = (i + 1) * 4;
        idxs.push(a, a + 1, b, b, a + 1, b + 1);
        idxs.push(a + 2, b + 2, a + 3, a + 3, b + 2, b + 3);
      }
    } else if (type === 'deck') {
      for (let i = 0; i < SEGMENTS; i++) {
        const a = i * 2, b = (i + 1) * 2;
        idxs.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idxs);
    geo.computeVertexNormals();
    return geo;
  }

  function buildCabin() {
    const g = new THREE.Group();
    // Main cabin body
    const bodyGeo = new THREE.BoxGeometry(1.4, 0.55, 1.6);
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0xC9A84C, metalness: 0.3, roughness: 0.4, clearcoat: 0.8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, FREEBOARD + 0.275, -0.3);
    g.add(body);
    // Windshield
    const wsGeo = new THREE.BoxGeometry(1.3, 0.45, 0.06);
    const wsMat = new THREE.MeshPhysicalMaterial({ color: 0x88bbdd, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.5, clearcoat: 1.0 });
    const ws = new THREE.Mesh(wsGeo, wsMat);
    ws.position.set(0, FREEBOARD + 0.5, -1.08);
    ws.rotation.x = -0.25;
    g.add(ws);
    // Roof
    const roofGeo = new THREE.BoxGeometry(1.45, 0.04, 1.2);
    const roof = new THREE.Mesh(roofGeo, bodyMat.clone());
    roof.position.set(0, FREEBOARD + 0.56, -0.1);
    g.add(roof);
    return g;
  }

  const boatGroup = new THREE.Group();
  const sectionMeshes = {};
  const originalPositions = {};

  ['bottom', 'hull', 'deck'].forEach(key => {
    const geo = buildSection(key);
    const cfg = SECTIONS[key];
    const mat = new THREE.MeshPhysicalMaterial({
      color: cfg.color, metalness: key === 'deck' ? 0.05 : 0.35,
      roughness: key === 'deck' ? 0.6 : 0.3, clearcoat: 0.6, emissive: 0x000000
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { sectionKey: key };
    sectionMeshes[key] = mesh;
    originalPositions[key] = mesh.position.clone();
    boatGroup.add(mesh);
  });

  const cabinGroup = buildCabin();
  cabinGroup.userData = { sectionKey: 'cabin' };
  cabinGroup.children.forEach(c => c.userData = { sectionKey: 'cabin' });
  sectionMeshes['cabin'] = cabinGroup;
  originalPositions['cabin'] = cabinGroup.position.clone();
  boatGroup.add(cabinGroup);
  scene.add(boatGroup);

  // Water
  const waterGeo = new THREE.PlaneGeometry(40, 40, 80, 80);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a2540, metalness: 0.9, roughness: 0.15,
    transparent: true, opacity: 0.8, side: THREE.DoubleSide
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.02;
  scene.add(water);

  // Particles
  const pCount = 200;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 20;
    pPos[i * 3 + 1] = Math.random() * 8;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }
  pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xC9A84C, size: 0.03, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(pGeo, pMat));

  // State
  let explodeProgress = 0, targetExplode = 0;
  let hoveredKey = null, activeKey = null;
  let autoRotate = true, rotationY = 0;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);
  let clock = new THREE.Clock();

  // Scroll-driven explode
  const section3d = document.querySelector('.boat-3d-section');
  function updateScroll() {
    if (!section3d) return;
    const rect = section3d.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
    // Explode between 30% and 70% scroll
    targetExplode = Math.max(0, Math.min(1, (progress - 0.3) / 0.4));
  }
  window.addEventListener('scroll', updateScroll, { passive: true });

  // Mouse interaction
  function onMouseMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }
  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('click', () => {
    if (hoveredKey) {
      activeKey = activeKey === hoveredKey ? null : hoveredKey;
      updateInfoPanel();
    }
  });
  renderer.domElement.style.cursor = 'default';

  // Info panel
  const infoPanel = document.getElementById('boat-info-panel');
  function updateInfoPanel() {
    if (!infoPanel) return;
    if (activeKey && SECTIONS[activeKey]) {
      const s = SECTIONS[activeKey];
      infoPanel.innerHTML = `
        <div class="bip-close" id="bip-close">✕</div>
        <div class="bip-label">${s.label}</div>
        <div class="bip-price">${s.price}</div>
        <div class="bip-desc">${s.desc}</div>
        <a href="#contact" class="bip-btn">Book Nu →</a>`;
      infoPanel.classList.add('active');
      document.getElementById('bip-close').addEventListener('click', () => {
        activeKey = null;
        infoPanel.classList.remove('active');
      });
    } else {
      infoPanel.classList.remove('active');
    }
  }

  // Animate
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    explodeProgress += (targetExplode - explodeProgress) * 0.05;

    // Rotate boat
    if (autoRotate) rotationY += dt * 0.3;
    boatGroup.rotation.y = rotationY;

    // Explode sections
    Object.keys(sectionMeshes).forEach(key => {
      const mesh = sectionMeshes[key];
      const off = SECTIONS[key].offset;
      const ox = originalPositions[key].x + off[0] * explodeProgress;
      const oy = originalPositions[key].y + off[1] * explodeProgress;
      const oz = originalPositions[key].z + off[2] * explodeProgress;
      mesh.position.lerp(new THREE.Vector3(ox, oy, oz), 0.08);
    });

    // Raycast for hover
    raycaster.setFromCamera(mouse, camera);
    const targets = [];
    Object.values(sectionMeshes).forEach(m => {
      if (m.isMesh) targets.push(m);
      else if (m.children) m.children.forEach(c => { if (c.isMesh) targets.push(c); });
    });
    const hits = raycaster.intersectObjects(targets);
    const newHovered = hits.length > 0 ? hits[0].object.userData.sectionKey : null;
    if (newHovered !== hoveredKey) {
      hoveredKey = newHovered;
      renderer.domElement.style.cursor = hoveredKey ? 'pointer' : 'default';
    }

    // Emissive glow on hover
    Object.keys(sectionMeshes).forEach(key => {
      const mesh = sectionMeshes[key];
      const isActive = key === hoveredKey || key === activeKey;
      const meshes = mesh.isMesh ? [mesh] : mesh.children.filter(c => c.isMesh);
      meshes.forEach(m => {
        if (m.material.emissive) {
          const target = isActive ? new THREE.Color(SECTIONS[key].emissive).multiplyScalar(0.4) : new THREE.Color(0x000000);
          m.material.emissive.lerp(target, 0.1);
        }
      });
    });

    // Animate water vertices
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.5 + time) * 0.04 + Math.cos(z * 0.3 + time * 0.7) * 0.03);
    }
    pos.needsUpdate = true;

    // Animate particles
    const pp = pGeo.attributes.position;
    for (let i = 0; i < pCount; i++) {
      let y = pp.getY(i) + dt * 0.15;
      if (y > 8) y = 0;
      pp.setY(i, y);
    }
    pp.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);

  // Section labels in 3D (projected to 2D)
  const labelsContainer = document.getElementById('boat-labels');
  function updateLabels() {
    if (!labelsContainer || explodeProgress < 0.15) {
      if (labelsContainer) labelsContainer.style.opacity = '0';
      return;
    }
    labelsContainer.style.opacity = String(Math.min(1, (explodeProgress - 0.15) / 0.3));
    labelsContainer.innerHTML = '';
    Object.keys(sectionMeshes).forEach(key => {
      const mesh = sectionMeshes[key];
      const worldPos = new THREE.Vector3();
      if (mesh.isMesh) mesh.getWorldPosition(worldPos);
      else { mesh.getWorldPosition(worldPos); worldPos.y += 0.3; }
      worldPos.project(camera);
      const x = (worldPos.x * 0.5 + 0.5) * container.clientWidth;
      const y = (-worldPos.y * 0.5 + 0.5) * container.clientHeight;
      if (worldPos.z > 1) return;
      const el = document.createElement('div');
      el.className = 'boat-label' + (key === hoveredKey || key === activeKey ? ' active' : '');
      el.textContent = SECTIONS[key].label;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.addEventListener('click', () => { activeKey = activeKey === key ? null : key; updateInfoPanel(); });
      labelsContainer.appendChild(el);
    });
    requestAnimationFrame(updateLabels);
  }
  requestAnimationFrame(updateLabels);
  window.addEventListener('scroll', () => requestAnimationFrame(updateLabels), { passive: true });
})();
