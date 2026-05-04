(function () {
  const container = document.getElementById('boat-3d');
  if (!container) return;

  const SECTIONS = {
    bottom: { label: 'Bundmaling',        price: 'Fra 6.500 DKK', desc: 'Professionel afrensning og påføring af miljøvenlig bundmaling. Alt materialer inkluderet.' },
    hull:   { label: 'Udvendig Rengøring',price: 'Fra 1.800 DKK', desc: 'Skrog og gelcoat vaskes, poleres og beskyttes med premium marine-voks.' },
    deck:   { label: 'Polering & Dæk',   price: 'Fra 3.200 DKK', desc: 'Maskinpolering der fjerner oxidering og genskaber glansen i din gelcoat.' },
    cabin:  { label: 'Indvendig Rengøring',price:'Fra 1.200 DKK', desc: 'Komplet rengøring af kahyt, salon, pantry og hoveder.' }
  };

  // ── SCENE ─────────────────────────────────────────────────────────────
  const scene    = new THREE.Scene();
  scene.background = new THREE.Color(0x04080f);
  scene.fog        = new THREE.FogExp2(0x04080f, 0.025);

  const W = container.clientWidth, H = container.clientHeight;
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 200);
  camera.position.set(10, 6, 12);
  camera.lookAt(0, 0.8, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // ── LIGHTS ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x1a3a60, 2.5));
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.5);
  sun.position.set(6, 14, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 60;
  sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x4488bb, 1.2);
  fill.position.set(-5, 5, -6);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x88bbee, 0.6);
  rim.position.set(0, -4, -10);
  scene.add(rim);

  // ── MATERIALS ─────────────────────────────────────────────────────────
  const M = {
    bottom : new THREE.MeshStandardMaterial({ color: 0x1b5280, roughness: 0.50, metalness: 0.10 }),
    hull   : new THREE.MeshStandardMaterial({ color: 0xEFECE1, roughness: 0.12, metalness: 0.03 }),
    deck   : new THREE.MeshStandardMaterial({ color: 0x7b5432, roughness: 0.88 }),
    deckL  : new THREE.MeshStandardMaterial({ color: 0xcfaa7a, roughness: 0.90 }),
    cabin  : new THREE.MeshStandardMaterial({ color: 0x0c3356, roughness: 0.28, metalness: 0.12 }),
    glass  : new THREE.MeshPhysicalMaterial({ color: 0x99bbdd, roughness: 0.0, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
    chrome : new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.08, metalness: 0.95 }),
    gold   : new THREE.MeshStandardMaterial({ color: 0xC9A84C, roughness: 0.20, metalness: 0.80 }),
    rubber : new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.95 }),
    dark   : new THREE.MeshStandardMaterial({ color: 0x0c1520, roughness: 0.95 }),
  };

  // ── HULL GEOMETRY FROM CROSS-SECTIONS ─────────────────────────────────
  // Each station: x = position along boat (bow +, stern -)
  // profile = half-section points from keel (z≈0) outward to sheer (z=max)
  // {y = height, z = half-beam}
  const STATIONS = [
    { x: 4.50, profile:[{y:.18,z:.001},{y:.22,z:.04},{y:.32,z:.07},{y:.46,z:.09},{y:.60,z:.11}] },
    { x: 4.00, profile:[{y:-.10,z:.001},{y:-.02,z:.14},{y:.12,z:.24},{y:.36,z:.32},{y:.56,z:.36}] },
    { x: 3.20, profile:[{y:-.48,z:.001},{y:-.32,z:.40},{y:-.05,z:.62},{y:.24,z:.74},{y:.54,z:.80}] },
    { x: 2.20, profile:[{y:-.78,z:.001},{y:-.57,z:.68},{y:-.20,z:.96},{y:.14,z:1.10},{y:.50,z:1.18}] },
    { x: 1.00, profile:[{y:-.86,z:.001},{y:-.64,z:.78},{y:-.27,z:1.05},{y:.07,z:1.22},{y:.48,z:1.30}] },
    { x:  .00, profile:[{y:-.90,z:.001},{y:-.68,z:.82},{y:-.30,z:1.10},{y:.05,z:1.26},{y:.46,z:1.33}] },
    { x:-1.00, profile:[{y:-.88,z:.001},{y:-.66,z:.80},{y:-.28,z:1.07},{y:.06,z:1.22},{y:.44,z:1.28}] },
    { x:-2.00, profile:[{y:-.84,z:.001},{y:-.62,z:.77},{y:-.24,z:1.03},{y:.06,z:1.17},{y:.42,z:1.23}] },
    { x:-3.00, profile:[{y:-.79,z:.001},{y:-.57,z:.73},{y:-.19,z:.98},{y:.07,z:1.11},{y:.40,z:1.17}] },
    { x:-3.65, profile:[{y:-.73,z:.001},{y:-.51,z:.69},{y:-.14,z:.92},{y:.08,z:1.05},{y:.38,z:1.12}] },
  ];

  function lerp(a, b, t) { return a + t * (b - a); }

  // Interpolate profile at y = target (for waterline split)
  function addWLPoint(profile, WL) {
    const out = [];
    for (let i = 0; i < profile.length; i++) {
      const p = profile[i], prev = profile[i - 1];
      if (i > 0 && ((prev.y < WL && p.y >= WL) || (prev.y >= WL && p.y < WL))) {
        const t = (WL - prev.y) / (p.y - prev.y);
        out.push({ y: WL, z: lerp(prev.z, p.z, t) });
      }
      out.push(p);
    }
    return out;
  }

  // Resample profile to exactly N points
  function resample(pts, N) {
    if (pts.length === 0) return [];
    if (pts.length === 1) return Array.from({length: N}, () => ({...pts[0]}));
    const res = [];
    for (let i = 0; i < N; i++) {
      const t   = (i / (N - 1)) * (pts.length - 1);
      const lo  = Math.floor(t), hi = Math.min(lo + 1, pts.length - 1);
      const f   = t - lo;
      res.push({ y: lerp(pts[lo].y, pts[hi].y, f), z: lerp(pts[lo].z, pts[hi].z, f) });
    }
    return res;
  }

  // Split stations at waterline and resample both halves
  const WL = 0;
  const splitSt = STATIONS.map(st => {
    const full = addWLPoint(st.profile, WL);
    const below = resample(full.filter(p => p.y <= WL + 0.001), 5);
    const above = resample(full.filter(p => p.y >= WL - 0.001), 4);
    return { x: st.x, below, above };
  });

  // Build surface geometry from station profiles (port + starboard)
  function buildSurface(stations, key) { // key: 'below'|'above'
    const verts = [], idx = [];
    function addQuad(a, b, c, d, flip) {
      const base = verts.length / 3;
      verts.push(...a, ...b, ...c, ...d);
      if (!flip) idx.push(base,base+1,base+2, base,base+2,base+3);
      else        idx.push(base,base+2,base+1, base,base+3,base+2);
    }
    for (let s = 0; s < stations.length - 1; s++) {
      const P0 = stations[s][key], P1 = stations[s+1][key];
      if (!P0 || !P1 || P0.length < 2 || P1.length < 2) continue;
      const n = Math.min(P0.length, P1.length);
      for (let i = 0; i < n - 1; i++) {
        // port side +z
        addQuad(
          [stations[s].x,   P0[i].y,   P0[i].z],
          [stations[s+1].x, P1[i].y,   P1[i].z],
          [stations[s+1].x, P1[i+1].y, P1[i+1].z],
          [stations[s].x,   P0[i+1].y, P0[i+1].z],
          false
        );
        // starboard -z (reversed winding)
        addQuad(
          [stations[s].x,   P0[i].y,   -P0[i].z],
          [stations[s+1].x, P1[i].y,   -P1[i].z],
          [stations[s+1].x, P1[i+1].y, -P1[i+1].z],
          [stations[s].x,   P0[i+1].y, -P0[i+1].z],
          true
        );
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  // Build flat transom panel
  function buildTransom(st, key) {
    const prof = st[key]; if (!prof || prof.length < 2) return null;
    const x = st.x, verts = [], idx = [];
    for (let i = 0; i < prof.length - 1; i++) {
      const b = verts.length / 3;
      verts.push(x,prof[0].y,0, x,prof[i].y,prof[i].z, x,prof[i+1].y,prof[i+1].z);
      idx.push(b,b+1,b+2);
      verts.push(x,prof[0].y,0, x,prof[i].y,-prof[i].z, x,prof[i+1].y,-prof[i+1].z);
      const b2 = verts.length/3-3; idx.push(b2,b2+2,b2+1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  }

  // Deck outline using THREE.Shape (top-down XZ, then rotated)
  function buildDeckGeo() {
    const shape = new THREE.Shape();
    // Outline: bow → port sheer → stern → starboard sheer → bow
    const pts = [
      [4.45,  0.00], [4.00,  0.10], [3.20,  0.55],
      [2.20,  0.95], [1.00,  1.16], [0.00,  1.22],
      [-1.00, 1.18], [-2.00, 1.14], [-3.00, 1.10],
      [-3.65, 1.05],// stern port
      [-3.65,-1.05],// stern starboard
      [-3.00,-1.10], [-2.00,-1.14], [-1.00,-1.18],
      [0.00, -1.22], [1.00,-1.16], [2.20,-0.95],
      [3.20, -0.55], [4.00,-0.10],
    ];
    shape.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(p => shape.lineTo(p[0], p[1]));
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape, 2);
    // Rotate so XY plane → XZ (lying flat)
    geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2));
    return geo;
  }

  // ── BOAT GROUP ────────────────────────────────────────────────────────
  const boatGroup = new THREE.Group();
  scene.add(boatGroup);
  const meshKeys = new Map(), origPos = new Map();

  function add(mesh, key) {
    mesh.castShadow = mesh.receiveShadow = true;
    boatGroup.add(mesh);
    meshKeys.set(mesh, key);
    origPos.set(mesh, mesh.position.clone());
  }

  // ── HULL BOTTOM (bundmaling) ──────────────────────────────────────────
  const botGeo = buildSurface(splitSt, 'below');
  add(new THREE.Mesh(botGeo, M.bottom), 'bottom');

  // Transom bottom
  const tBot = buildTransom(splitSt[splitSt.length - 1], 'below');
  if (tBot) add(new THREE.Mesh(tBot, M.bottom), 'bottom');

  // Keel strip
  const keelMesh = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.10, 0.06), M.bottom);
  keelMesh.position.set(-0.1, -0.88, 0);
  add(keelMesh, 'bottom');

  // Waterline stripe (gold)
  const wlStripeGeo = buildSurface(
    splitSt.map(st => ({
      x: st.x,
      stripe: resample(st.above.slice(0, 2), 2)
    })).map(s => ({...s, above: resample([{y:0,z:s.stripe[0].z},{y:0.06,z:s.stripe[0].z}], 2)})),
    'above'
  );
  const wlStripe = new THREE.Mesh(wlStripeGeo, M.gold);
  add(wlStripe, 'bottom');

  // ── HULL TOPSIDES (udvendig) ──────────────────────────────────────────
  const topGeo = buildSurface(splitSt, 'above');
  add(new THREE.Mesh(topGeo, M.hull), 'hull');

  const tTop = buildTransom(splitSt[splitSt.length - 1], 'above');
  if (tTop) add(new THREE.Mesh(tTop, M.hull), 'hull');

  // Rubrails
  [0.58, -0.58].forEach(side => {
    const rr = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 8.0, 8), M.rubber);
    rr.rotation.z = Math.PI / 2; rr.position.set(-0.1, 0.16, side * 1.9);
    add(rr, 'hull');
  });

  // ── DECK (polering) ───────────────────────────────────────────────────
  const deckGeo = buildDeckGeo();
  const deckMesh = new THREE.Mesh(deckGeo, M.deck);
  deckMesh.position.y = 0.50;
  add(deckMesh, 'deck');

  // Deck cap rail (thin white strip around edge)
  const capGeo = buildDeckGeo();
  capGeo.applyMatrix4(new THREE.Matrix4().makeScale(1.015, 1, 1.015));
  const capMesh = new THREE.Mesh(capGeo, M.hull);
  capMesh.position.y = 0.44;
  add(capMesh, 'deck');

  // Foredeck teak inlay
  const foreDeckShape = new THREE.Shape();
  foreDeckShape.moveTo(4.3,0); foreDeckShape.lineTo(1.1,.82); foreDeckShape.lineTo(1.1,-.82); foreDeckShape.closePath();
  const fdGeo = new THREE.ShapeGeometry(foreDeckShape);
  fdGeo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI/2));
  const foreDeckMesh = new THREE.Mesh(fdGeo, M.deckL);
  foreDeckMesh.position.y = 0.51;
  add(foreDeckMesh, 'deck');

  // Anchor roller (bow)
  const ar = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.28,8), M.chrome);
  ar.rotation.z = Math.PI/2; ar.position.set(4.5,0.62,0);
  add(ar, 'deck');

  // Stanchions + lifeline wire
  for (let x = -2.5; x <= 2.5; x += 1.2) {
    [1.05, -1.05].forEach(z => {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.38,6), M.chrome);
      st.position.set(x, 0.69, z); add(st, 'deck');
    });
  }
  [1.05,-1.05].forEach(z => {
    const lr = new THREE.Mesh(new THREE.CylinderGeometry(0.011,0.011,6.5,6), M.chrome);
    lr.rotation.z = Math.PI/2; lr.position.set(-0.3, 0.86, z); add(lr, 'deck');
  });

  // Cleats
  [-2, -0.5, 1.0, 2.5].forEach(x => {
    [0.85,-0.85].forEach(z => {
      const cl = new THREE.Mesh(new THREE.BoxGeometry(0.20,0.06,0.09), M.chrome);
      cl.position.set(x, 0.56, z); add(cl, 'deck');
    });
  });

  // ── CABIN / COCKPIT (indvendig) ────────────────────────────────────────
  // Forward cabin housing (cuddy / v-berth hatch)
  const cuddy = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 1.70), M.hull);
  cuddy.position.set(2.2, 0.82, 0); add(cuddy, 'cabin');

  // Cabin top (hardtop)
  const hardtop = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.09, 2.10), M.hull);
  hardtop.position.set(-0.2, 1.84, 0); add(hardtop, 'cabin');

  // Cabin sides
  [-1.04, 1.04].forEach(z => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.18, 0.07), M.cabin);
    side.position.set(-0.2, 1.24, z); add(side, 'cabin');
    // Side window
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.55, 0.04), M.glass);
    win.position.set(-0.2, 1.32, z); add(win, 'cabin');
  });

  // Cabin front & back
  const cabFront = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.30, 2.15), M.cabin);
  cabFront.position.set(1.22, 1.20, 0); add(cabFront, 'cabin');

  // Windshield glass
  const ws = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.82, 1.88), M.glass);
  ws.position.set(1.23, 1.22, 0); ws.rotation.z = -0.18; add(ws, 'cabin');

  // Helm console
  const cons = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.75), M.cabin);
  cons.position.set(-0.55, 1.15, 0); add(cons, 'cabin');

  // Steering wheel
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.022, 8, 28), M.chrome);
  wheel.rotation.x = 1.0; wheel.position.set(-0.55, 1.62, 0.0); add(wheel, 'cabin');

  // Cockpit
  const cpit = new THREE.Mesh(new THREE.BoxGeometry(2.10, 0.70, 2.05), M.dark);
  cpit.position.set(-2.20, 1.18, 0); add(cpit, 'cabin');

  // Swim platform
  const swim = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.08, 2.10), M.deck);
  swim.position.set(-4.10, 0.25, 0); add(swim, 'cabin');

  // Dual outboards
  [0.40, -0.40].forEach(z => {
    const eng = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.82, 0.36), M.chrome);
    eng.position.set(-4.0, 0.12, z); add(eng, 'cabin');
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.44, 0.16), M.chrome);
    leg.position.set(-4.0,-0.28, z); add(leg, 'cabin');
    const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.06,3), M.chrome);
    prop.position.set(-4.0,-0.52, z); add(prop, 'cabin');
  });

  // Nav lights
  const mkLight = (col, x, z) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.04,8,8),
      new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:2}));
    m.position.set(x,0.62,z); add(m,'cabin');
  };
  mkLight(0xff2200, 4.52, 0.18);
  mkLight(0x00ee44, 4.52,-0.18);
  mkLight(0xffffff,-3.60, 0);

  // ── WATER ─────────────────────────────────────────────────────────────
  const waterGeo = new THREE.PlaneGeometry(90, 90, 120, 120);
  const waterMat = new THREE.MeshPhysicalMaterial({
    color:0x061e38, metalness:0.88, roughness:0.04, transparent:true, opacity:0.90
  });
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.rotation.x = -Math.PI/2; waterMesh.position.y = 0.01;
  waterMesh.receiveShadow = true; scene.add(waterMesh);

  // Stars
  const sp = [];
  for (let i=0;i<600;i++) sp.push((Math.random()-.5)*120, Math.random()*30+10, (Math.random()-.5)*120);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp,3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff,size:.055})));

  // Hide loading indicator
  const loadEl = document.getElementById('boat-loading');
  if (loadEl) loadEl.style.display = 'none';

  // ── STATE ─────────────────────────────────────────────────────────────
  let explode=0, targetExplode=0, hoveredKey=null, activeKey=null;
  let rotY=0.35, autoRotate=true;
  const EXPLODE = {bottom:-2.4, hull:0, deck:2.1, cabin:4.3};
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(-10,-10);
  const clock  = new THREE.Clock();

  // Scroll explode
  const sec3d = document.querySelector('.boat-3d-section');
  window.addEventListener('scroll', () => {
    if (!sec3d) return;
    const r = sec3d.getBoundingClientRect();
    const p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
    targetExplode = Math.max(0, Math.min(1, (p - 0.18) / 0.58));
  }, {passive:true});

  // Mouse interaction
  renderer.domElement.addEventListener('mousemove', e => {
    const r = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX-r.left)/r.width)*2-1;
    mouse.y = -((e.clientY-r.top)/r.height)*2+1;
  });
  renderer.domElement.addEventListener('click', () => {
    if (hoveredKey) { activeKey = activeKey===hoveredKey ? null : hoveredKey; updatePanel(); }
  });

  // Drag rotate
  let dragX=null, rotY0=0;
  renderer.domElement.addEventListener('mousedown', e => { dragX=e.clientX; rotY0=rotY; autoRotate=false; });
  window.addEventListener('mouseup', () => { dragX=null; setTimeout(()=>{autoRotate=true;},5000); });
  window.addEventListener('mousemove', e => { if(dragX!==null) rotY=rotY0+(e.clientX-dragX)*0.007; });

  // Touch rotate (mobile)
  let touchX=null;
  renderer.domElement.addEventListener('touchstart', e => { touchX=e.touches[0].clientX; rotY0=rotY; autoRotate=false; });
  renderer.domElement.addEventListener('touchmove', e => { if(touchX!==null) rotY=rotY0+(e.touches[0].clientX-touchX)*0.007; });
  renderer.domElement.addEventListener('touchend', () => { touchX=null; setTimeout(()=>{autoRotate=true;},5000); });

  // ── INFO PANEL ────────────────────────────────────────────────────────
  const panel = document.getElementById('boat-info-panel');
  function updatePanel() {
    if (!panel) return;
    if (activeKey && SECTIONS[activeKey]) {
      const s = SECTIONS[activeKey];
      document.getElementById('bip-label').textContent = s.label;
      document.getElementById('bip-price').textContent = s.price;
      document.getElementById('bip-desc').textContent  = s.desc;
      panel.classList.add('active');
    } else panel.classList.remove('active');
  }
  const closeBtn = document.getElementById('bip-close');
  if (closeBtn) closeBtn.addEventListener('click', () => { activeKey=null; updatePanel(); });

  // ── LABELS ────────────────────────────────────────────────────────────
  const labelAnchors = {
    bottom: new THREE.Vector3(-0.5,-1.5, 2.0),
    hull:   new THREE.Vector3( 2.5, 0.3, 2.0),
    deck:   new THREE.Vector3( 1.0, 2.0, 1.8),
    cabin:  new THREE.Vector3(-0.5, 4.0, 1.8),
  };
  const labelEls={}, labCont=document.getElementById('boat-labels');
  if (labCont) {
    Object.entries(SECTIONS).forEach(([key,data])=>{
      const el=document.createElement('div');
      el.className='boat-label'; el.textContent=data.label; el.dataset.key=key;
      el.addEventListener('click',()=>{ activeKey=activeKey===key?null:key; updatePanel(); });
      labCont.appendChild(el); labelEls[key]=el;
    });
  }

  function updateLabels() {
    if (!labCont) return;
    const show = explode > 0.3;
    labCont.style.opacity = show ? Math.min(1,(explode-0.3)/0.2) : 0;
    const rect = renderer.domElement.getBoundingClientRect();
    Object.entries(labelAnchors).forEach(([key,anchor])=>{
      const el=labelEls[key]; if(!el) return;
      const wp = anchor.clone();
      wp.y += (EXPLODE[key]||0)*explode;
      wp.applyEuler(new THREE.Euler(0,rotY,0));
      const sp = wp.project(camera);
      el.style.left = ((sp.x*.5+.5)*rect.width)+'px';
      el.style.top  = ((-sp.y*.5+.5)*rect.height)+'px';
      el.classList.toggle('active', key===hoveredKey||key===activeKey);
    });
  }

  // ── ANIMATE ───────────────────────────────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t  = clock.getElapsedTime();

    explode += (targetExplode - explode) * 0.045;
    if (autoRotate) rotY += dt * 0.13;
    boatGroup.rotation.y = rotY;
    boatGroup.position.y = Math.sin(t * 0.45) * 0.07;
    boatGroup.rotation.z = Math.sin(t * 0.38) * 0.011;

    // Explode sections
    meshKeys.forEach((key,mesh)=>{
      const orig = origPos.get(mesh);
      if (!orig) return;
      const ty = orig.y + (EXPLODE[key]||0) * explode;
      mesh.position.y += (ty - mesh.position.y) * 0.08;
    });

    // Raycast hover
    raycaster.setFromCamera(mouse, camera);
    const meshList=[];
    meshKeys.forEach((_,m)=>meshList.push(m));
    const hits = raycaster.intersectObjects(meshList, false);
    const newH = hits.length>0 && meshKeys.has(hits[0].object) ? meshKeys.get(hits[0].object) : null;
    if (newH!==hoveredKey) {
      hoveredKey=newH;
      renderer.domElement.style.cursor = hoveredKey ? 'pointer' : 'default';
    }

    // Emissive highlight
    meshKeys.forEach((key,mesh)=>{
      if (!mesh.material?.emissive) return;
      const on = key===hoveredKey||key===activeKey;
      mesh.material.emissive.lerp(
        on ? new THREE.Color(0xC9A84C).multiplyScalar(0.32) : new THREE.Color(0),
        0.12
      );
    });

    // Animate water
    const wpos = waterGeo.attributes.position;
    for (let i=0;i<wpos.count;i++){
      const x=wpos.getX(i), z=wpos.getZ(i);
      wpos.setY(i, Math.sin(x*.32+t*.85)*.15 + Math.cos(z*.26+t*.62)*.11 + Math.sin((x+z)*.13+t*1.1)*.06);
    }
    wpos.needsUpdate=true;

    updateLabels();
    renderer.render(scene, camera);
  }
  animate();

  // ── RESIZE ────────────────────────────────────────────────────────────
  window.addEventListener('resize', ()=>{
    const w=container.clientWidth, h=container.clientHeight;
    camera.aspect=w/h; camera.updateProjectionMatrix();
    renderer.setSize(w,h);
  });
})();
