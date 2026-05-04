(function () {
  const container = document.getElementById('boat-3d');
  if (!container) return;

  const SECTIONS = {
    bottom: {
      label: 'Bundmaling',
      price: 'Fra 6.500 DKK',
      desc: 'Professionel afrensning og påføring af miljøvenlig bundmaling. Alt materialer inkluderet. Vi sikrer korrekt lagstykkelse og en glat finish.'
    },
    hull: {
      label: 'Udvendig Rengøring',
      price: 'Fra 1.800 DKK',
      desc: 'Skrog, dæk og gelcoat vaskes, poleres og beskyttes med premium marine-voks. Fuldstændig rengøring over vandlinjen.'
    },
    deck: {
      label: 'Polering & Dæk',
      price: 'Fra 3.200 DKK',
      desc: 'Flertrins maskinpolering der fjerner oxidering og genskaber glansen i din gelcoat. Inkluderer keramisk coating som ekstra tilkøb.'
    },
    cabin: {
      label: 'Indvendig Rengøring',
      price: 'Fra 1.200 DKK',
      desc: 'Komplet rengøring af kahyt, salon, pantry og hoveder. Vi efterlader din båd renere end ny — inkl. polstring, messing og stål.'
    }
  };

  // ── SCENE ──────────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04080f);
  scene.fog = new THREE.FogExp2(0x04080f, 0.028);

  const W = container.clientWidth, H = container.clientHeight;
  const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);
  camera.position.set(9, 5.5, 11);
  camera.lookAt(0, 1.2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  // ── LIGHTS ─────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x1a3a5c, 2.0));

  const sun = new THREE.DirectionalLight(0xfff4e0, 3.0);
  sun.position.set(6, 12, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 50;
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  scene.add(sun);

  const sky = new THREE.DirectionalLight(0x4477bb, 1.0);
  sky.position.set(-4, 6, -6);
  scene.add(sky);

  const rim = new THREE.DirectionalLight(0x88bbdd, 0.5);
  rim.position.set(0, -3, -8);
  scene.add(rim);

  // ── MATERIALS ──────────────────────────────────────────────────────────
  const matBottom = new THREE.MeshStandardMaterial({
    color: 0x1a4f7a, roughness: 0.45, metalness: 0.15
  });
  const matHull = new THREE.MeshStandardMaterial({
    color: 0xEFEDE3, roughness: 0.12, metalness: 0.04
  });
  const matDeck = new THREE.MeshStandardMaterial({
    color: 0x7a5530, roughness: 0.85, metalness: 0.0
  });
  const matDeckLight = new THREE.MeshStandardMaterial({
    color: 0xd4b896, roughness: 0.9, metalness: 0.0
  });
  const matCabin = new THREE.MeshStandardMaterial({
    color: 0x0c3356, roughness: 0.25, metalness: 0.15
  });
  const matGlass = new THREE.MeshPhysicalMaterial({
    color: 0x99bbdd, roughness: 0.0, metalness: 0.05,
    transparent: true, opacity: 0.35, side: THREE.DoubleSide
  });
  const matChrome = new THREE.MeshStandardMaterial({
    color: 0xcccccc, roughness: 0.1, metalness: 0.95
  });
  const matGold = new THREE.MeshStandardMaterial({
    color: 0xC9A84C, roughness: 0.2, metalness: 0.8
  });
  const matRubber = new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.9, metalness: 0.0
  });
  const matCockpit = new THREE.MeshStandardMaterial({
    color: 0x0d1520, roughness: 0.95, metalness: 0.0
  });

  // ── BOAT GROUP ─────────────────────────────────────────────────────────
  const boatGroup = new THREE.Group();
  scene.add(boatGroup);

  const meshKeys = new Map();
  const originalPos = new Map();

  function addPart(mesh, key, shadow = true) {
    mesh.castShadow = shadow;
    mesh.receiveShadow = shadow;
    boatGroup.add(mesh);
    meshKeys.set(mesh, key);
    originalPos.set(mesh, mesh.position.clone());
  }

  // ── HULL LOWER — BUNDMALING ────────────────────────────────────────────
  // Below-waterline body using a tapered half-hull approach
  // Main keel body
  const hullBotMain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.13, 8.0, 18, 1),
    matBottom
  );
  hullBotMain.rotation.z = Math.PI / 2;
  hullBotMain.position.set(0, -0.52, 0);
  hullBotMain.scale.z = 0.52;
  addPart(hullBotMain, 'bottom');

  // Keel fin
  const keelFin = new THREE.Mesh(
    new THREE.BoxGeometry(6.5, 0.28, 0.07),
    matBottom
  );
  keelFin.position.set(-0.2, -0.88, 0);
  addPart(keelFin, 'bottom');

  // Bow underwater extension
  const bowUnder = new THREE.Mesh(
    new THREE.ConeGeometry(0.52, 1.6, 18),
    matBottom
  );
  bowUnder.rotation.z = -Math.PI / 2;
  bowUnder.position.set(4.4, -0.52, 0);
  bowUnder.scale.z = 0.52;
  addPart(bowUnder, 'bottom');

  // Waterline stripe (gold)
  const waterStripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.915, 0.915, 7.4, 18, 1),
    matGold
  );
  waterStripe.rotation.z = Math.PI / 2;
  waterStripe.position.set(-0.1, 0.04, 0);
  waterStripe.scale.z = 0.65;
  addPart(waterStripe, 'bottom');

  // ── HULL UPPER — UDVENDIG ──────────────────────────────────────────────
  // Main hull body above waterline
  const hullMain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 0.9, 7.2, 18, 1),
    matHull
  );
  hullMain.rotation.z = Math.PI / 2;
  hullMain.position.set(-0.1, 0.3, 0);
  hullMain.scale.z = 0.64;
  addPart(hullMain, 'hull');

  // Bow piece (nose)
  const bowCone = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 1.8, 18),
    matHull
  );
  bowCone.rotation.z = -Math.PI / 2;
  bowCone.position.set(4.2, 0.3, 0);
  bowCone.scale.z = 0.64;
  addPart(bowCone, 'hull');

  // Stern transom (flat back wall)
  const transom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.88, 0.88, 0.12, 18),
    matHull
  );
  transom.rotation.z = Math.PI / 2;
  transom.position.set(-3.68, 0.3, 0);
  transom.scale.z = 0.64;
  addPart(transom, 'hull');

  // Rubrail (bumper strip along hull side)
  const railGeo = new THREE.CylinderGeometry(0.035, 0.035, 7.3, 8);
  const railL = new THREE.Mesh(railGeo, matRubber);
  railL.rotation.z = Math.PI / 2;
  railL.position.set(-0.1, 0.72, 0.565);
  addPart(railL, 'hull');
  const railR = new THREE.Mesh(railGeo, matRubber);
  railR.rotation.z = Math.PI / 2;
  railR.position.set(-0.1, 0.72, -0.565);
  addPart(railR, 'hull');

  // Chrome hardware on bow
  const bowCleat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8),
    matChrome
  );
  bowCleat.position.set(4.8, 0.9, 0);
  addPart(bowCleat, 'hull');

  // ── DECK — POLERING ────────────────────────────────────────────────────
  // Main deck surface
  const deckMain = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 0.10, 1.52),
    matDeck
  );
  deckMain.position.set(-0.2, 0.88, 0);
  addPart(deckMain, 'deck');

  // Deck perimeter (white cap rail)
  const capRailGeo = new THREE.BoxGeometry(7.1, 0.06, 1.62);
  const capRail = new THREE.Mesh(capRailGeo, matHull);
  capRail.position.set(-0.2, 0.82, 0);
  addPart(capRail, 'deck');

  // Bow deck (foredeck) teak inlay
  const foreDeck = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.11, 1.3),
    matDeckLight
  );
  foreDeck.position.set(3.0, 0.88, 0);
  addPart(foreDeck, 'deck');

  // Deck cleats (6 of them)
  const cleatGeo = new THREE.BoxGeometry(0.22, 0.07, 0.1);
  [-2.5, -1.2, 0.1, 1.4].forEach(x => {
    [0.73, -0.73].forEach(z => {
      const c = new THREE.Mesh(cleatGeo, matChrome);
      c.position.set(x, 0.95, z);
      addPart(c, 'deck');
    });
  });

  // Handrail stanchions
  for (let i = -2; i <= 1; i++) {
    const stanchion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.35, 6),
      matChrome
    );
    stanchion.position.set(i * 1.3 + 0.2, 1.1, 0.73);
    addPart(stanchion, 'deck');
    const s2 = stanchion.clone();
    s2.position.z = -0.73;
    addPart(s2, 'deck');
  }
  // Handrail wire
  const hrL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 5.3, 6),
    matChrome
  );
  hrL.rotation.z = Math.PI / 2;
  hrL.position.set(-1.0, 1.27, 0.73);
  addPart(hrL, 'deck');
  const hrR = hrL.clone();
  hrR.position.z = -0.73;
  addPart(hrR, 'deck');

  // ── CABIN / COCKPIT — INDVENDIG ────────────────────────────────────────
  // Main cabin body
  const cabinBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.95, 1.38),
    matCabin
  );
  cabinBody.position.set(-0.3, 1.43, 0);
  addPart(cabinBody, 'cabin');

  // Cabin roof (slightly overhang)
  const cabinRoof = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.09, 1.52),
    matHull
  );
  cabinRoof.position.set(-0.3, 1.96, 0);
  addPart(cabinRoof, 'cabin');

  // Windshield (front glass)
  const wsFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.72, 1.25),
    matCabin
  );
  wsFrame.position.set(0.96, 1.55, 0);
  wsFrame.rotation.z = -0.22;
  addPart(wsFrame, 'cabin');

  const wsGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.62, 1.15),
    matGlass
  );
  wsGlass.position.set(0.97, 1.55, 0);
  wsGlass.rotation.z = -0.22;
  addPart(wsGlass, 'cabin');

  // Cabin side windows
  [-0.68, 0.68].forEach(z => {
    const sideWin = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.32, 0.03),
      matGlass
    );
    sideWin.position.set(-0.3, 1.55, z);
    addPart(sideWin, 'cabin');

    // Window frame
    const sideFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.38, 0.04),
      matCabin
    );
    sideFrame.position.set(-0.3, 1.55, z - (z > 0 ? 0.01 : -0.01));
    addPart(sideFrame, 'cabin');
  });

  // Cockpit (open area behind cabin)
  const cockpit = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.72, 1.38),
    matCockpit
  );
  cockpit.position.set(-1.9, 1.33, 0);
  addPart(cockpit, 'cabin');

  // Cockpit side walls
  [-0.69, 0.69].forEach(z => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.72, 0.08),
      matCabin
    );
    wall.position.set(-1.9, 1.33, z);
    addPart(wall, 'cabin');
  });

  // Steering console
  const console3d = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.55, 0.7),
    matCabin
  );
  console3d.position.set(-1.25, 1.52, 0);
  addPart(console3d, 'cabin');

  // Steering wheel
  const wheelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.022, 8, 28),
    matChrome
  );
  wheelRing.rotation.x = 1.1;
  wheelRing.position.set(-1.25, 1.83, 0.0);
  addPart(wheelRing, 'cabin');

  const wheelHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8),
    matChrome
  );
  wheelHub.rotation.x = 1.1;
  wheelHub.position.copy(wheelRing.position);
  addPart(wheelHub, 'cabin');

  // Dual outboard engines
  [-0.38, 0.38].forEach(z => {
    const engBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.8, 0.38),
      new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 0.25, metalness: 0.8 })
    );
    engBlock.position.set(-3.62, 0.22, z);
    addPart(engBlock, 'cabin');

    const engLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.45, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.3, metalness: 0.7 })
    );
    engLeg.position.set(-3.62, -0.22, z);
    addPart(engLeg, 'cabin');

    const prop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.06, 3),
      matChrome
    );
    prop.position.set(-3.62, -0.5, z);
    addPart(prop, 'cabin');
  });

  // Navigation light (bow)
  const navLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xff4422, emissive: 0xff2200, emissiveIntensity: 1.5 })
  );
  navLight.position.set(4.9, 0.88, 0.3);
  addPart(navLight, 'cabin');

  const navLightG = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x22ff44, emissive: 0x00ff22, emissiveIntensity: 1.5 })
  );
  navLightG.position.set(4.9, 0.88, -0.3);
  addPart(navLightG, 'cabin');

  // ── WATER SURFACE ──────────────────────────────────────────────────────
  const waterGeo = new THREE.PlaneGeometry(80, 80, 100, 100);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x07213d,
    metalness: 0.85,
    roughness: 0.04,
    transparent: true,
    opacity: 0.88,
    reflectivity: 0.9
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI / 2;
  waterMesh.position.y = 0.03;
  waterMesh.receiveShadow = true;
  scene.add(waterMesh);

  // Horizon glow
  const horizonGeo = new THREE.PlaneGeometry(80, 12);
  const horizonMat = new THREE.MeshBasicMaterial({
    color: 0x0a2040,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
  });
  const horizon = new THREE.Mesh(horizonGeo, horizonMat);
  horizon.rotation.y = 0.3;
  horizon.position.set(0, 4, -25);
  scene.add(horizon);

  // Stars
  const starPositions = [];
  for (let i = 0; i < 500; i++) {
    starPositions.push(
      (Math.random() - 0.5) * 100,
      Math.random() * 25 + 8,
      (Math.random() - 0.5) * 100
    );
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06 })));

  // ── HIDE LOADING ───────────────────────────────────────────────────────
  const loadingEl = document.getElementById('boat-loading');
  if (loadingEl) loadingEl.style.display = 'none';

  // ── STATE ──────────────────────────────────────────────────────────────
  let explodeProgress = 0;
  let targetExplode = 0;
  let hoveredKey = null;
  let activeKey = null;
  let autoRotate = true;
  let rotY = 0.35;
  let userRotating = false;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);
  const clock = new THREE.Clock();

  // Explosion Y offsets per section
  const EXPLODE = { bottom: -2.2, hull: 0, deck: 2.0, cabin: 4.0 };

  // ── SCROLL TRIGGER ────────────────────────────────────────────────────
  const section3d = document.querySelector('.boat-3d-section');
  window.addEventListener('scroll', () => {
    if (!section3d) return;
    const rect = section3d.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = (vh - rect.top) / (vh + rect.height);
    targetExplode = Math.max(0, Math.min(1, (p - 0.2) / 0.55));
  }, { passive: true });

  // ── MOUSE INTERACTION ──────────────────────────────────────────────────
  renderer.domElement.addEventListener('mousemove', e => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });

  renderer.domElement.addEventListener('click', () => {
    if (hoveredKey) {
      activeKey = (activeKey === hoveredKey) ? null : hoveredKey;
      updateInfoPanel();
    }
  });

  // Drag to rotate
  let dragStart = null;
  let rotYAtDrag = 0;
  renderer.domElement.addEventListener('mousedown', e => {
    dragStart = e.clientX;
    rotYAtDrag = rotY;
    autoRotate = false;
  });
  window.addEventListener('mouseup', () => {
    dragStart = null;
    setTimeout(() => { autoRotate = true; }, 5000);
  });
  window.addEventListener('mousemove', e => {
    if (dragStart !== null) {
      rotY = rotYAtDrag + (e.clientX - dragStart) * 0.008;
    }
  });

  // ── INFO PANEL ────────────────────────────────────────────────────────
  const infoPanel = document.getElementById('boat-info-panel');
  function updateInfoPanel() {
    if (!infoPanel) return;
    if (activeKey && SECTIONS[activeKey]) {
      const s = SECTIONS[activeKey];
      document.getElementById('bip-label').textContent = s.label;
      document.getElementById('bip-price').textContent = s.price;
      document.getElementById('bip-desc').textContent = s.desc;
      infoPanel.classList.add('active');
    } else {
      infoPanel.classList.remove('active');
    }
  }
  const closeBtn = document.getElementById('bip-close');
  if (closeBtn) closeBtn.addEventListener('click', () => { activeKey = null; updateInfoPanel(); });

  // ── LABEL OVERLAY ─────────────────────────────────────────────────────
  // Label anchor points in 3D (shown when exploded)
  const labelAnchors = {
    bottom: new THREE.Vector3(0, -1.8, 1.5),
    hull:   new THREE.Vector3(2, 0.3, 1.5),
    deck:   new THREE.Vector3(1, 2.3, 1.5),
    cabin:  new THREE.Vector3(-1, 4.2, 1.5)
  };
  const labelEls = {};
  const labelsContainer = document.getElementById('boat-labels');
  if (labelsContainer) {
    Object.entries(SECTIONS).forEach(([key, data]) => {
      const el = document.createElement('div');
      el.className = 'boat-label';
      el.textContent = data.label;
      el.dataset.key = key;
      el.addEventListener('click', () => {
        activeKey = (activeKey === key) ? null : key;
        updateInfoPanel();
      });
      labelsContainer.appendChild(el);
      labelEls[key] = el;
    });
  }

  function updateLabels() {
    if (!labelsContainer) return;
    const show = explodeProgress > 0.35;
    labelsContainer.style.opacity = show ? Math.min(1, (explodeProgress - 0.35) / 0.2) : 0;

    Object.entries(labelAnchors).forEach(([key, pos3d]) => {
      const el = labelEls[key];
      if (!el) return;
      // Project 3D point to screen
      const worldPos = pos3d.clone();
      worldPos.y += (EXPLODE[key] || 0) * explodeProgress;
      // Rotate by boat group Y
      worldPos.applyEuler(new THREE.Euler(0, rotY, 0));
      const screenPos = worldPos.clone().project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      const x = (screenPos.x * 0.5 + 0.5) * rect.width;
      const y = (-screenPos.y * 0.5 + 0.5) * rect.height;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.classList.toggle('active', key === hoveredKey || key === activeKey);
    });
  }

  // ── ANIMATE ───────────────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.getElapsedTime();

    explodeProgress += (targetExplode - explodeProgress) * 0.045;
    if (autoRotate) rotY += dt * 0.14;
    boatGroup.rotation.y = rotY;

    // Gentle bob
    boatGroup.position.y = Math.sin(t * 0.5) * 0.06;
    boatGroup.rotation.z = Math.sin(t * 0.4) * 0.012;

    // Apply explosion
    meshKeys.forEach((key, mesh) => {
      const orig = originalPos.get(mesh);
      if (!orig) return;
      const offsetY = (EXPLODE[key] || 0) * explodeProgress;
      const targetY = orig.y + offsetY;
      mesh.position.y += (targetY - mesh.position.y) * 0.08;
    });

    // Raycast hover
    raycaster.setFromCamera(mouse, camera);
    const meshList = [];
    meshKeys.forEach((k, m) => meshList.push(m));
    const hits = raycaster.intersectObjects(meshList, false);
    const newHover = hits.length > 0 && meshKeys.has(hits[0].object)
      ? meshKeys.get(hits[0].object) : null;

    if (newHover !== hoveredKey) {
      hoveredKey = newHover;
      renderer.domElement.style.cursor = hoveredKey ? 'pointer' : 'default';
    }

    // Emissive highlight
    meshKeys.forEach((key, mesh) => {
      if (!mesh.material || !mesh.material.emissive) return;
      const isActive = key === hoveredKey || key === activeKey;
      const target = isActive
        ? new THREE.Color(0xC9A84C).multiplyScalar(0.35)
        : new THREE.Color(0x000000);
      mesh.material.emissive.lerp(target, 0.12);
    });

    // Animate water
    const wPos = waterGeo.attributes.position;
    for (let i = 0; i < wPos.count; i++) {
      const x = wPos.getX(i), z = wPos.getZ(i);
      wPos.setY(i,
        Math.sin(x * 0.35 + t * 0.9) * 0.14 +
        Math.cos(z * 0.28 + t * 0.65) * 0.10 +
        Math.sin((x + z) * 0.15 + t * 1.1) * 0.06
      );
    }
    wPos.needsUpdate = true;

    updateLabels();
    renderer.render(scene, camera);
  }

  animate();

  // ── RESIZE ────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

})();
