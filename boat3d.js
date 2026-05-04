(function () {
  const container = document.getElementById('boat-3d');
  if (!container) return;

  const SECTIONS = {
    bottom: { label: 'Bundmaling', price: 'Fra 6.500 DKK', desc: 'Professionel afrensning og påføring af miljøvenlig bundmaling.' },
    hull:   { label: 'Udvendig Rengøring', price: 'Fra 1.800 DKK', desc: 'Skrog, dæk og gelcoat vaskes, poleres og beskyttes.' },
    deck:   { label: 'Polering & Dæk', price: 'Fra 3.200 DKK', desc: 'Maskinpolering der fjerner oxidering og genskaber glansen.' },
    cabin:  { label: 'Indvendig Rengøring', price: 'Fra 1.200 DKK', desc: 'Komplet rengøring af kahyt, salon, pantry og hoveder.' }
  };

  // Scene setup
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050a12, 0.04);
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(6, 4, 8);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffeedd, 1.5);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);
  const fillLight = new THREE.DirectionalLight(0x6688cc, 0.8);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);

  let boatGroup = new THREE.Group();
  scene.add(boatGroup);

  // We will store original positions for the explosion animation
  const originalPositions = new Map();
  // We will map meshes to keys ('hull', 'bottom', etc.) for interaction
  const meshKeys = new Map();
  
  let hasRealModel = false;

  // Attempt to load GLTF
  const loader = new THREE.GLTFLoader();
  const modelUrl = 'assets/models/yacht.glb';
  
  document.getElementById('boat-loading').style.display = 'block';

  loader.load(
    modelUrl,
    function (gltf) {
      document.getElementById('boat-loading').style.display = 'none';
      hasRealModel = true;
      const model = gltf.scene;
      
      // Auto scale and center
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 5 / maxDim;
      model.scale.set(scale, scale, scale);
      model.position.sub(center.multiplyScalar(scale));
      
      boatGroup.add(model);
      
      // Map meshes for explosion
      // In a real model, we would look for specific names (e.g. child.name.includes('hull')).
      // Here we just map random parts to make it interactive if names aren't perfect.
      let i = 0;
      const keys = ['bottom', 'hull', 'deck', 'cabin'];
      model.traverse((child) => {
        if (child.isMesh) {
          // Store original local position
          originalPositions.set(child, child.position.clone());
          
          // Assign a section key for interaction
          let assignedKey = keys[i % keys.length];
          const name = child.name.toLowerCase();
          if (name.includes('hull') || name.includes('skrog')) assignedKey = 'hull';
          if (name.includes('deck') || name.includes('dæk')) assignedKey = 'deck';
          if (name.includes('cabin') || name.includes('glass')) assignedKey = 'cabin';
          if (name.includes('bottom') || name.includes('bund')) assignedKey = 'bottom';
          
          meshKeys.set(child, assignedKey);
          i++;
        }
      });
    },
    undefined,
    function (error) {
      // Fallback: Create placeholder geometries if no model is found
      document.getElementById('boat-loading').textContent = 'Placeholder model (Download en .glb model og læg den i assets/models/yacht.glb)';
      console.warn("Could not load assets/models/yacht.glb. Using fallback placeholder.");
      createFallbackBoat();
    }
  );

  function createFallbackBoat() {
    // A simplified 3D representation just so the interaction works while waiting for a real model
    const matBottom = new THREE.MeshStandardMaterial({ color: 0x1B6CA8, roughness: 0.3 });
    const matHull = new THREE.MeshStandardMaterial({ color: 0x0D3B66, roughness: 0.2 });
    const matDeck = new THREE.MeshStandardMaterial({ color: 0xE8E4D8, roughness: 0.7 });
    const matCabin = new THREE.MeshStandardMaterial({ color: 0xC9A84C, metalness: 0.6, roughness: 0.2 });

    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.1, 4, 16), matBottom);
    bottom.rotation.z = Math.PI / 2; bottom.position.y = -0.5;
    
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.8, 4.2, 16), matHull);
    hull.rotation.z = Math.PI / 2; hull.position.y = 0.5;

    const deck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 2), matDeck);
    deck.position.y = 1.1;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1.5), matCabin);
    cabin.position.y = 1.7; cabin.position.x = -0.5;

    const parts = [
      { mesh: bottom, key: 'bottom' },
      { mesh: hull, key: 'hull' },
      { mesh: deck, key: 'deck' },
      { mesh: cabin, key: 'cabin' }
    ];

    parts.forEach(p => {
      originalPositions.set(p.mesh, p.mesh.position.clone());
      meshKeys.set(p.mesh, p.key);
      boatGroup.add(p.mesh);
    });
  }

  // Water effect
  const waterGeo = new THREE.PlaneGeometry(50, 50, 50, 50);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a2540, metalness: 0.9, roughness: 0.1,
    transparent: true, opacity: 0.8, side: THREE.DoubleSide
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -1;
  scene.add(water);

  // State
  let explodeProgress = 0, targetExplode = 0;
  let hoveredKey = null, activeKey = null;
  let autoRotate = true, rotationY = 0;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10, -10);
  let clock = new THREE.Clock();

  // Scroll explosion
  const section3d = document.querySelector('.boat-3d-section');
  window.addEventListener('scroll', () => {
    if (!section3d) return;
    const rect = section3d.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
    targetExplode = Math.max(0, Math.min(1, (progress - 0.3) / 0.4));
  }, { passive: true });

  // Interaction
  renderer.domElement.addEventListener('mousemove', (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  });
  
  renderer.domElement.addEventListener('click', () => {
    if (hoveredKey) {
      activeKey = activeKey === hoveredKey ? null : hoveredKey;
      updateInfoPanel();
    }
  });

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

  if(document.getElementById('bip-close')) {
     document.getElementById('bip-close').addEventListener('click', () => {
       activeKey = null;
       updateInfoPanel();
     });
  }

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    explodeProgress += (targetExplode - explodeProgress) * 0.05;

    if (autoRotate) rotationY += dt * 0.2;
    boatGroup.rotation.y = rotationY;

    // Explode meshes
    boatGroup.traverse((child) => {
      if (child.isMesh && originalPositions.has(child)) {
        const orig = originalPositions.get(child);
        const key = meshKeys.get(child);
        
        // Calculate explosion offset based on key (or local center if generic)
        let offset = new THREE.Vector3(0,0,0);
        if (key === 'bottom') offset.y = -2;
        else if (key === 'hull') offset.y = 0;
        else if (key === 'deck') offset.y = 2;
        else if (key === 'cabin') offset.y = 4;
        
        child.position.lerpVectors(orig, orig.clone().add(offset.multiplyScalar(explodeProgress)), 0.1);
      }
    });

    // Raycast
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(boatGroup, true);
    const newHovered = hits.length > 0 && meshKeys.has(hits[0].object) ? meshKeys.get(hits[0].object) : null;
    
    if (newHovered !== hoveredKey) {
      hoveredKey = newHovered;
      renderer.domElement.style.cursor = hoveredKey ? 'pointer' : 'default';
    }

    // Highlight
    boatGroup.traverse((child) => {
      if (child.isMesh && meshKeys.has(child)) {
        const key = meshKeys.get(child);
        const isActive = key === hoveredKey || key === activeKey;
        if (child.material) {
           // Emissive highlight if material supports it
           if(child.material.emissive) {
             const targetColor = isActive ? new THREE.Color(0xC9A84C).multiplyScalar(0.5) : new THREE.Color(0x000000);
             child.material.emissive.lerp(targetColor, 0.1);
           }
        }
      }
    });

    // Animate water
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, Math.sin(x * 0.5 + time) * 0.1 + Math.cos(z * 0.3 + time * 0.7) * 0.1);
    }
    pos.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
})();
