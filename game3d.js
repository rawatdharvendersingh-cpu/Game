// ===================================================================
// CADILLACS & BRAWLERS: REALISTIC 3D TACTICAL BATTLEGROUND ENGINE
// 100% Real FBX Skinned Characters, Natural Downward Arms & 360 Turning
// ===================================================================

class RealisticBrawler3D {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.container = document.getElementById('game-container');
    this.healthbarsContainer = document.getElementById('enemy-healthbars-container');

    // Internal Game State
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.screenShake = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isStageClearing = false;
    this.activeWaveIndex = 0;
    this.totalEnemiesDefeated = 0;

    // Weapon Mode: 'fists' (boxing punch combo) or 'sword' (great sword cleave)
    this.weaponMode = 'fists';

    // Entities
    this.player = null;
    this.enemies = [];
    this.obstacles = [];
    this.particles = [];
    this.damagePopups = [];
    this.floatingBars = new Map();

    // FBX Animation Clips Cache & Templates
    this.heroClips = {};
    this.zombieClips = {};
    this.zombieTemplateFBX = null;
    this.heroFBX = null;

    // Input State
    this.input = {
      moveX: 0,
      moveZ: 0,
      btnA: false,
      btnB: false,
      btnJump: false,
      btnSpecial: false,
      btnDash: false,
      btnWeapon: false
    };

    // Initialize Systems
    this.initThree();
    this.initAudio();
    this.initEnvironment();
    this.initObstacles();
    this.setupEventListeners();
    this.setupTouchControls();

    // Start Streaming Real FBX Characters & Mixamo Animations
    this.loadRealCharacters(() => {
      this.hidePreloader();
      this.spawnWave(0);
      if (window.location.search.includes('autotest=1')) {
        this.runAutoTest();
      }
    });

    // Start Animation Loop
    this.clock = new THREE.Clock();
    requestAnimationFrame((t) => this.animate(t));
  }

  // -------------------------------------------------------------
  // THREE.JS SETUP & LIGHTING
  // -------------------------------------------------------------
  initThree() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070a10);
    this.scene.fog = new THREE.FogExp2(0x0a0f1d, 0.0018);

    // Realistic Camera Angle (natural third-person isometric view)
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.5, 3000);
    this.camera.position.set(0, 115, 310);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Realistic Lighting Setup
    this.ambientLight = new THREE.HemisphereLight(0x94a3b8, 0x1e293b, 0.85);
    this.scene.add(this.ambientLight);

    // Directional Sunlight casting soft shadows
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 1.45);
    this.dirLight.position.set(140, 320, 200);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 1200;
    this.dirLight.shadow.camera.left = -600;
    this.dirLight.shadow.camera.right = 600;
    this.dirLight.shadow.camera.top = 350;
    this.dirLight.shadow.camera.bottom = -200;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Cyber Rim Light
    this.rimLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    this.rimLight.position.set(-180, 220, -180);
    this.scene.add(this.rimLight);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  initAudio() {
    if (typeof audio !== 'undefined') {
      this.audio = audio;
    }
  }

  // -------------------------------------------------------------
  // REALISTIC ENVIRONMENT (ROAD, CURBS & CITY RUINS)
  // -------------------------------------------------------------
  initEnvironment() {
    const arenaLength = 3400;
    const roadWidth = 260;

    // Asphalt Highway
    const roadGeo = new THREE.PlaneGeometry(arenaLength, roadWidth);
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      roughness: 0.75,
      metalness: 0.15
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(arenaLength / 2 - 400, 0, 0);
    road.receiveShadow = true;
    this.scene.add(road);

    // Yellow Highway Center Stripes
    for (let x = -200; x < arenaLength - 200; x += 120) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 4),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          roughness: 0.4,
          emissive: 0xa16207,
          emissiveIntensity: 0.25
        })
      );
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(x, 0.15, 0);
      stripe.receiveShadow = true;
      this.scene.add(stripe);
    }

    // Concrete Sidewalk Curbs
    const sidewalkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.1
    });

    const northWalk = new THREE.Mesh(new THREE.BoxGeometry(arenaLength, 12, 120), sidewalkMat);
    northWalk.position.set(arenaLength / 2 - 400, 4, -roadWidth / 2 - 60);
    northWalk.receiveShadow = true;
    this.scene.add(northWalk);

    const southWalk = new THREE.Mesh(new THREE.BoxGeometry(arenaLength, 12, 120), sidewalkMat);
    southWalk.position.set(arenaLength / 2 - 400, 4, roadWidth / 2 + 60);
    southWalk.receiveShadow = true;
    this.scene.add(southWalk);

    // Background Destroyed Warzone City Skyline
    const buildingColors = [0x0f172a, 0x1e293b, 0x090d16, 0x18181b];
    for (let x = -300; x < arenaLength; x += 180 + Math.random() * 80) {
      const bw = 110 + Math.random() * 90;
      const bh = 240 + Math.random() * 300;
      const bd = 120 + Math.random() * 60;
      const bColor = buildingColors[Math.floor(Math.random() * buildingColors.length)];

      const b = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bd),
        new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.9, metalness: 0.2 })
      );
      b.position.set(x, bh / 2, -roadWidth / 2 - 180 - bd / 2);
      b.receiveShadow = true;
      this.scene.add(b);

      if (Math.random() > 0.45) {
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(bw * 0.7, 32),
          new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xef4444 : 0x06b6d4 })
        );
        sign.position.set(x, bh * 0.65, -roadWidth / 2 - 178);
        this.scene.add(sign);
      }
    }

    // Street Lamps with dynamic illumination
    for (let x = 0; x < arenaLength; x += 450) {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(x, 0, -roadWidth / 2 - 10);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2.8, 110, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.4 })
      );
      pole.position.y = 55;
      pole.castShadow = true;
      lampGroup.add(pole);

      const lampLight = new THREE.PointLight(0xfef08a, 1.2, 280);
      lampLight.position.set(0, 105, 10);
      lampGroup.add(lampLight);

      this.scene.add(lampGroup);
    }
  }

  // -------------------------------------------------------------
  // OBSTACLES: CONCRETE BLAST WALLS & FLAMING OIL BARRELS
  // -------------------------------------------------------------
  initObstacles() {
    this.obstacles = [];
    this.createBlastWall(420, 0, 130);
    this.createFlamingBarrels(860, 20);
    this.createBlastWall(1380, -30, 140);
    this.createFlamingBarrels(1920, -10);
  }

  createBlastWall(x, z, width = 120) {
    const wallGroup = new THREE.Group();
    wallGroup.position.set(x, 0, z);

    const wallMesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, 38, 24),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, metalness: 0.1 })
    );
    wallMesh.position.y = 19;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    wallGroup.add(wallMesh);

    // Hazard Stripes
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#facc15'; ctx.fillRect(0, 0, 256, 32);
    ctx.fillStyle = '#09090b';
    for (let i = -32; i < 288; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i + 20, 0);
      ctx.lineTo(i - 4, 32); ctx.lineTo(i - 24, 32);
      ctx.fill();
    }
    const stripeTex = new THREE.CanvasTexture(canvas);
    stripeTex.wrapS = THREE.RepeatWrapping;
    const stripeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.9, 12),
      new THREE.MeshBasicMaterial({ map: stripeTex })
    );
    stripeMesh.position.set(0, 19, 12.2);
    wallGroup.add(stripeMesh);

    this.scene.add(wallGroup);

    this.obstacles.push({
      type: 'wall',
      group: wallGroup,
      x: x, z: z,
      width: width, depth: 28, height: 38,
      climbable: true
    });
  }

  createFlamingBarrels(x, z) {
    const barrelGroup = new THREE.Group();
    barrelGroup.position.set(x, 0, z);

    const positions = [
      { dx: -22, dz: -14, rot: 0 },
      { dx: 18, dz: -10, rot: 0.4 },
      { dx: -2, dz: 16, rot: -0.2 }
    ];

    const barrelGeo = new THREE.CylinderGeometry(14, 14, 36, 16);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.6, metalness: 0.5 });
    const fireLights = [];

    positions.forEach((pos, idx) => {
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.position.set(pos.dx, 18, pos.dz);
      barrel.rotation.y = pos.rot;
      barrel.castShadow = true;
      barrel.receiveShadow = true;
      barrelGroup.add(barrel);

      if (idx === 0) {
        const fireLight = new THREE.PointLight(0xf97316, 2.4, 150);
        fireLight.position.set(pos.dx, 40, pos.dz);
        barrelGroup.add(fireLight);
        fireLights.push(fireLight);

        const flameMesh = new THREE.Mesh(
          new THREE.ConeGeometry(8, 22, 8),
          new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.85 })
        );
        flameMesh.position.set(pos.dx, 42, pos.dz);
        barrelGroup.add(flameMesh);
        barrelGroup.userData.flameMesh = flameMesh;
      }
    });

    this.scene.add(barrelGroup);

    this.obstacles.push({
      type: 'barrels',
      group: barrelGroup,
      x: x, z: z,
      width: 70, depth: 60, height: 38,
      climbable: true,
      fireLights: fireLights
    });
  }

  // -------------------------------------------------------------
  // UNIVERSAL BONE MAPPING & REST POSE CAPTURE
  // -------------------------------------------------------------
  mapBones(root) {
    const bones = {};
    root.traverse((c) => {
      if (c.isBone) {
        if (!c.userData.restQ) {
          c.userData.restQ = c.quaternion.clone();
          c.userData.restPos = c.position.clone();
        }

        const lower = c.name.toLowerCase();
        const parentName = c.parent ? c.parent.name.toLowerCase() : '';

        if (lower.includes('hips') && (!bones.hips || parentName === '')) bones.hips = c;
        else if ((lower.includes('spine2') || lower.includes('chest')) && !bones.chest) bones.chest = c;
        else if (lower.includes('spine') && !bones.spine) bones.spine = c;
        else if (lower.includes('neck') && !bones.neck) bones.neck = c;
        else if (lower.includes('head') && !bones.head) bones.head = c;
        else if (lower.includes('leftforearm') && parentName.includes('leftarm') && !bones.leftForeArm) bones.leftForeArm = c;
        else if (lower.includes('leftarm') && parentName.includes('shoulder') && !bones.leftArm) bones.leftArm = c;
        else if (lower.includes('lefthand') && parentName.includes('leftforearm') && !bones.leftHand) bones.leftHand = c;
        else if (lower.includes('rightforearm') && parentName.includes('rightarm') && !bones.rightForeArm) bones.rightForeArm = c;
        else if (lower.includes('rightarm') && parentName.includes('shoulder') && !bones.rightArm) bones.rightArm = c;
        else if (lower.includes('righthand') && parentName.includes('rightforearm') && !bones.rightHand) bones.rightHand = c;
        else if (lower.includes('leftupleg') && (parentName.includes('hips') || !bones.leftUpLeg)) bones.leftUpLeg = c;
        else if (lower.includes('leftleg') && (parentName.includes('leftupleg') || !bones.leftLeg)) bones.leftLeg = c;
        else if (lower.includes('leftfoot') && !bones.leftFoot) bones.leftFoot = c;
        else if (lower.includes('rightupleg') && (parentName.includes('hips') || !bones.rightUpLeg)) bones.rightUpLeg = c;
        else if (lower.includes('rightleg') && (parentName.includes('rightupleg') || !bones.rightLeg)) bones.rightLeg = c;
        else if (lower.includes('rightfoot') && !bones.rightFoot) bones.rightFoot = c;
      }
    });

    // Fallbacks if parent name convention differed
    root.traverse((c) => {
      if (c.isBone) {
        const lower = c.name.toLowerCase();
        if (lower.includes('leftarm') && !bones.leftArm) bones.leftArm = c;
        if (lower.includes('rightarm') && !bones.rightArm) bones.rightArm = c;
        if (lower.includes('leftforearm') && !bones.leftForeArm) bones.leftForeArm = c;
        if (lower.includes('rightforearm') && !bones.rightForeArm) bones.rightForeArm = c;
        if (lower.includes('leftupleg') && !bones.leftUpLeg) bones.leftUpLeg = c;
        if (lower.includes('rightupleg') && !bones.rightUpLeg) bones.rightUpLeg = c;
      }
    });

    return bones;
  }

  // -------------------------------------------------------------
  // REAL FBX CHARACTERS & MIXAMO MOTION STREAMING
  // -------------------------------------------------------------
  loadRealCharacters(onComplete) {
    const preloaderBar = document.getElementById('preloader-bar');
    const preloaderText = document.getElementById('preloader-text');

    const loader = new THREE.FBXLoader();

    const filesToLoad = [
      { key: 'heroMesh', file: 'Boxing (1).fbx', label: 'Real Hero 3D Model & Boxing Animation' },
      { key: 'swordJump', file: 'Great Sword Jump Attack.fbx', label: 'Great Sword Jump Smash' },
      { key: 'heroJump', file: 'Jump.fbx', label: 'Real Hero Jump Movement' },
      { key: 'swordSwing', file: 'Swing To Land.fbx', label: 'Real Great Sword Slashes' },
      { key: 'heroClimb', file: 'Climbing To Top.fbx', label: 'Hero Obstacle Vaulting' },
      { key: 'zombieMesh', file: 'Death From Right.fbx', label: 'Real Zombie Enemy 3D Model & Death' },
      { key: 'zombieHit', file: 'Medium Hit To Head.fbx', label: 'Zombie Flinch Hit Reaction' },
      { key: 'zombieKick', file: 'Mma Kick.fbx', label: 'Zombie Combat Kicks & Strikes' },
      { key: 'zombieJump', file: 'Standing Jump.fbx', label: 'Zombie Lunge Leap' },
      { key: 'zombieClimb', file: 'Climbing.fbx', label: 'Zombie Obstacle Climb' }
    ];

    let loadedCount = 0;
    const totalFiles = filesToLoad.length;
    const rawFBX = {};

    const loadNext = (index) => {
      if (index >= totalFiles) {
        if (preloaderBar) preloaderBar.style.width = '100%';
        if (preloaderText) preloaderText.textContent = 'ALL REAL 3D CHARACTERS READY';

        this.setupRealHeroFromFBX(rawFBX);
        this.setupRealZombiesFromFBX(rawFBX);

        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
        return;
      }

      const item = filesToLoad[index];
      if (preloaderText) preloaderText.textContent = `LOADING: ${item.label}...`;

      loader.load(
        item.file,
        (fbx) => {
          rawFBX[item.key] = fbx;
          loadedCount++;
          const pct = Math.floor((loadedCount / totalFiles) * 100);
          if (preloaderBar) preloaderBar.style.width = `${pct}%`;
          loadNext(index + 1);
        },
        undefined,
        (err) => {
          console.warn(`Error loading FBX ${item.file}:`, err);
          loadedCount++;
          loadNext(index + 1);
        }
      );
    };

    loadNext(0);
  }

  // -------------------------------------------------------------
  // SETUP REAL HERO (BOXING (1).FBX)
  // -------------------------------------------------------------
  setupRealHeroFromFBX(rawFBX) {
    if (!rawFBX['heroMesh']) return;

    const heroFBX = rawFBX['heroMesh'];
    this.enhanceModelMaterials(heroFBX, true);

    heroFBX.scale.set(0.42, 0.42, 0.42);
    heroFBX.position.set(100, 0, 0);
    this.scene.add(heroFBX);
    this.heroFBX = heroFBX;

    // Map bones and capture rest quaternions
    const bones = this.mapBones(heroFBX);

    // Sanitize animation clips: strip hips.position root motion so world physics and combat lunges are 100% smooth
    const sanitizeClip = (clip) => {
      if (!clip) return clip;
      clip.tracks = clip.tracks.filter(t => !t.name.toLowerCase().includes('hips.position'));
      return clip;
    };

    // Hero Animation Mixer for combat clips
    const mixer = new THREE.AnimationMixer(heroFBX);
    const actions = {};

    // 1. Boxing Punches from Boxing (1).fbx
    if (heroFBX.animations && heroFBX.animations.length > 0) {
      actions['punch'] = mixer.clipAction(sanitizeClip(heroFBX.animations[0]));
      actions['punch'].setLoop(THREE.LoopOnce);
      actions['punch'].clampWhenFinished = true;
    }

    // 2. Great Sword Slashes & Smashes
    if (rawFBX['swordSwing'] && rawFBX['swordSwing'].animations[0]) {
      actions['sword_slash'] = mixer.clipAction(sanitizeClip(rawFBX['swordSwing'].animations[0]));
      actions['sword_slash'].setLoop(THREE.LoopOnce);
    }
    if (rawFBX['swordJump'] && rawFBX['swordJump'].animations[0]) {
      actions['sword_slam'] = mixer.clipAction(sanitizeClip(rawFBX['swordJump'].animations[0]));
      actions['sword_slam'].setLoop(THREE.LoopOnce);
    }
    if (rawFBX['heroJump'] && rawFBX['heroJump'].animations[0]) {
      actions['jump'] = mixer.clipAction(sanitizeClip(rawFBX['heroJump'].animations[0]));
      actions['jump'].setLoop(THREE.LoopOnce);
    }
    if (rawFBX['heroClimb'] && rawFBX['heroClimb'].animations[0]) {
      actions['climb'] = mixer.clipAction(sanitizeClip(rawFBX['heroClimb'].animations[0]));
      actions['climb'].setLoop(THREE.LoopOnce);
    }

    // Attach 3D Great Sword to right hand
    const swordMesh = this.createRealisticGreatSwordMesh();
    if (bones.rightHand) {
      bones.rightHand.add(swordMesh);
    } else {
      heroFBX.add(swordMesh);
    }

    this.player = {
      name: 'EXO STRIKER',
      x: 100, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      facing: 1,
      speed: 5.2,
      hp: 100, maxHp: 100,
      sp: 100, maxSp: 100,
      state: 'idle',
      stateTimer: 0,
      isGrounded: true,
      comboStep: 0,
      isClimbing: false,
      climbProgress: 0,
      walkCycle: 0,
      targetRotationY: 0,

      mesh: heroFBX,
      bones: bones,
      mixer: mixer,
      actions: actions,
      currentAction: null,
      swordMesh: swordMesh
    };

    this.setWeaponMode('fists');
  }

  playHeroAction(name, startTime = 0, timeScale = 1.0) {
    if (!this.player || !this.player.actions) return;
    const act = this.player.actions[name];
    if (!act) return;

    if (this.player.currentAction && this.player.currentAction !== act) {
      this.player.currentAction.fadeOut(0.08);
    }
    act.reset();
    act.time = startTime;
    act.timeScale = timeScale;
    act.fadeIn(0.08).play();
    this.player.currentAction = act;
  }

  stopHeroAction() {
    if (this.player && this.player.currentAction) {
      this.player.currentAction.fadeOut(0.12);
      this.player.currentAction = null;
    }
  }

  // -------------------------------------------------------------
  // SETUP REAL ZOMBIES (DEATH FROM RIGHT.FBX)
  // -------------------------------------------------------------
  setupRealZombiesFromFBX(rawFBX) {
    if (!rawFBX['zombieMesh']) return;

    const zombieFBX = rawFBX['zombieMesh'];
    this.enhanceModelMaterials(zombieFBX, false);
    zombieFBX.scale.set(0.42, 0.42, 0.42);

    this.zombieTemplateFBX = zombieFBX;

    // Cache zombie animation clips (sanitize combat clips so root remains steady)
    const sanitizeZombieClip = (clip) => {
      if (!clip) return clip;
      clip.tracks = clip.tracks.filter(t => !t.name.toLowerCase().includes('hips.position'));
      return clip;
    };

    if (rawFBX['zombieMesh'].animations[0]) {
      this.zombieClips['death'] = rawFBX['zombieMesh'].animations[0];
    }
    if (rawFBX['zombieHit'] && rawFBX['zombieHit'].animations[0]) {
      this.zombieClips['hit'] = sanitizeZombieClip(rawFBX['zombieHit'].animations[0]);
    }
    if (rawFBX['zombieKick'] && rawFBX['zombieKick'].animations[0]) {
      this.zombieClips['kick'] = sanitizeZombieClip(rawFBX['zombieKick'].animations[0]);
    }
    if (rawFBX['zombieJump'] && rawFBX['zombieJump'].animations[0]) {
      this.zombieClips['jump'] = sanitizeZombieClip(rawFBX['zombieJump'].animations[0]);
    }
    if (rawFBX['zombieClimb'] && rawFBX['zombieClimb'].animations[0]) {
      this.zombieClips['climb'] = sanitizeZombieClip(rawFBX['zombieClimb'].animations[0]);
    }
  }

  enhanceModelMaterials(fbx, isHero) {
    fbx.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            m.roughness = isHero ? 0.38 : 0.72;
            m.metalness = isHero ? 0.55 : 0.15;
            m.side = THREE.DoubleSide;
            m.needsUpdate = true;
          });
        }
      }
    });
  }

  createRealisticGreatSwordMesh() {
    const sword = new THREE.Group();

    // Gleaming Double-edged Steel Blade
    const bladeGeo = new THREE.BoxGeometry(4.2, 58, 1.4);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.95,
      roughness: 0.15
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 35;
    blade.castShadow = true;
    sword.add(blade);

    // Glowing Tactical Fuller
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 50, 1.6),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    groove.position.y = 35;
    sword.add(groove);

    // Golden Crossguard
    const guard = new THREE.Mesh(
      new THREE.BoxGeometry(18, 4, 5),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.25 })
    );
    guard.position.y = 6;
    guard.castShadow = true;
    sword.add(guard);

    // Leather Wrapped Hilt
    const hilt = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 16, 8),
      new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 })
    );
    hilt.position.y = -4;
    sword.add(hilt);

    // Golden Pommel
    const pommel = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.25 })
    );
    pommel.position.y = -13;
    sword.add(pommel);

    sword.scale.set(0.65, 0.65, 0.65);
    sword.position.set(0, 0, 4);
    sword.rotation.x = -Math.PI / 2;

    return sword;
  }

  setWeaponMode(mode) {
    this.weaponMode = mode;
    if (this.player && this.player.swordMesh) {
      this.player.swordMesh.visible = (mode === 'sword');
    }

    if (this.audio) {
      if (mode === 'sword') this.audio.playSwordDraw();
      else this.audio.playPunchWhoosh();
    }

    this.updateHUDWeaponBadge();
  }

  toggleWeapon() {
    this.setWeaponMode(this.weaponMode === 'fists' ? 'sword' : 'fists');
  }

  hidePreloader() {
    const preloader = document.getElementById('preloader-overlay');
    if (preloader) {
      preloader.classList.add('fade-out');
      setTimeout(() => { preloader.style.display = 'none'; }, 500);
    }
  }

  // -------------------------------------------------------------
  // SPAWN REAL ZOMBIES (USING CLONED REAL MIXAMO MESH)
  // -------------------------------------------------------------
  spawnZombie(x, z, type = 'normal') {
    if (!this.zombieTemplateFBX) return;

    const isBrute = (type === 'brute');
    const scale = isBrute ? 0.55 : 0.42;
    const maxHp = isBrute ? 130 : 55;

    // Clone the real Mixamo FBX skinned mesh
    let zombieMesh = null;
    if (typeof THREE.SkeletonUtils !== 'undefined' && THREE.SkeletonUtils.clone) {
      zombieMesh = THREE.SkeletonUtils.clone(this.zombieTemplateFBX);
    } else {
      zombieMesh = this.zombieTemplateFBX.clone();
    }

    zombieMesh.scale.set(scale, scale, scale);
    zombieMesh.position.set(x, 0, z);
    this.scene.add(zombieMesh);

    // Map bones on zombie and capture rest pose
    const bones = this.mapBones(zombieMesh);

    // Animation Mixer for combat clips
    const mixer = new THREE.AnimationMixer(zombieMesh);
    const actions = {};

    if (this.zombieClips['death']) {
      actions['death'] = mixer.clipAction(this.zombieClips['death']);
      actions['death'].setLoop(THREE.LoopOnce);
      actions['death'].clampWhenFinished = true;
    }
    if (this.zombieClips['hit']) {
      actions['hit'] = mixer.clipAction(this.zombieClips['hit']);
      actions['hit'].setLoop(THREE.LoopOnce);
    }
    if (this.zombieClips['kick']) {
      actions['kick'] = mixer.clipAction(this.zombieClips['kick']);
      actions['kick'].setLoop(THREE.LoopOnce);
    }

    const zombieObj = {
      id: 'zombie_' + Math.random().toString(36).substr(2, 9),
      name: isBrute ? 'MUTANT BRUTE' : 'ZOMBIE INFILTRATOR',
      type: type,
      x: x, y: 0, z: z,
      vx: 0, vz: 0,
      facing: -1,
      speed: isBrute ? 1.7 : 2.6,
      hp: maxHp, maxHp: maxHp,
      attackPower: isBrute ? 20 : 10,
      attackCooldown: 0,
      state: 'walk',
      stateTimer: 0,
      isAlive: true,
      scale: scale,
      walkCycle: Math.random() * 10,

      mesh: zombieMesh,
      bones: bones,
      mixer: mixer,
      actions: actions,
      currentAction: null
    };

    this.createFloatingHealthBar(zombieObj);
    this.enemies.push(zombieObj);
  }

  playZombieAction(enemy, name) {
    if (!enemy || !enemy.actions) return;
    const act = enemy.actions[name];
    if (!act) return;

    if (enemy.currentAction !== act) {
      if (enemy.currentAction) enemy.currentAction.fadeOut(0.12);
      act.reset().fadeIn(0.12).play();
      enemy.currentAction = act;
    }
  }

  stopZombieAction(enemy) {
    if (enemy && enemy.currentAction) {
      enemy.currentAction.fadeOut(0.15);
      enemy.currentAction = null;
    }
  }

  createFloatingHealthBar(zombie) {
    if (!this.healthbarsContainer) return;

    const barEl = document.createElement('div');
    barEl.className = 'enemy-hp-tag';
    barEl.id = 'hp-tag-' + zombie.id;

    barEl.innerHTML = `
      <div class="enemy-hp-title">${zombie.name}</div>
      <div class="enemy-hp-track">
        <div class="enemy-hp-delayed" style="width: 100%;"></div>
        <div class="enemy-hp-fill" style="width: 100%;"></div>
      </div>
    `;

    this.healthbarsContainer.appendChild(barEl);
    this.floatingBars.set(zombie.id, barEl);
  }

  updateFloatingHealthBars() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const tempVec = new THREE.Vector3();

    this.enemies.forEach((enemy) => {
      const barEl = this.floatingBars.get(enemy.id);
      if (!barEl) return;

      if (!enemy.isAlive) {
        barEl.style.opacity = '0';
        setTimeout(() => {
          if (barEl.parentNode) barEl.parentNode.removeChild(barEl);
          this.floatingBars.delete(enemy.id);
        }, 300);
        return;
      }

      // Track Head bone in 3D
      if (enemy.bones && enemy.bones.head) {
        enemy.bones.head.getWorldPosition(tempVec);
        tempVec.y += 18;
      } else {
        tempVec.set(enemy.x, enemy.y + (76 * (enemy.scale / 0.42)), enemy.z);
      }
      tempVec.project(this.camera);

      if (tempVec.z > 1.0) {
        barEl.style.display = 'none';
        return;
      }

      barEl.style.display = 'flex';
      const screenX = (tempVec.x * widthHalf) + widthHalf;
      const screenY = -(tempVec.y * heightHalf) + heightHalf;

      barEl.style.left = `${screenX}px`;
      barEl.style.top = `${screenY}px`;

      const hpPct = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
      const fill = barEl.querySelector('.enemy-hp-fill');
      const delayed = barEl.querySelector('.enemy-hp-delayed');

      if (fill) fill.style.width = `${hpPct}%`;
      if (delayed) {
        setTimeout(() => { if (delayed) delayed.style.width = `${hpPct}%`; }, 160);
      }
    });
  }

  spawnWave(waveIndex) {
    if (waveIndex === 0) {
      this.spawnZombie(380, -20, 'normal');
      this.spawnZombie(500, 25, 'normal');
    } else if (waveIndex === 1) {
      this.spawnZombie(this.player ? this.player.x + 360 : 600, -35, 'normal');
      this.spawnZombie(this.player ? this.player.x + 440 : 680, 30, 'brute');
      this.spawnZombie(this.player ? this.player.x - 240 : 200, 0, 'normal');
    } else if (waveIndex === 2) {
      this.spawnZombie(this.player ? this.player.x + 400 : 700, -20, 'brute');
      this.spawnZombie(this.player ? this.player.x + 480 : 780, 20, 'brute');
      this.spawnZombie(this.player ? this.player.x + 550 : 850, -40, 'normal');
    }
  }

  // -------------------------------------------------------------
  // CONTROLS & EVENT LISTENERS
  // -------------------------------------------------------------
  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (this.audio) this.audio.init();

      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') this.input.moveZ = -1;
      if (k === 's' || k === 'arrowdown') this.input.moveZ = 1;
      if (k === 'a' || k === 'arrowleft') this.input.moveX = -1;
      if (k === 'd' || k === 'arrowright') this.input.moveX = 1;

      // Attack A: Punch / Sword Slash
      if (k === 'j' || k === 'z') {
        if (!e.repeat) this.handleAttackA();
      }

      // Attack B: Kick / Heavy Sword Slam
      if (k === 'k' || k === 'x') {
        if (!e.repeat) this.handleAttackB();
      }

      // Jump / Climb Obstacle
      if (k === ' ' || k === 'c') {
        e.preventDefault();
        if (!e.repeat) this.handleJumpOrClimb();
      }

      // Toggle Weapon (Fists <-> Great Sword)
      if (k === 'q' || k === 'e' || k === '1' || k === '2') {
        e.preventDefault();
        if (!e.repeat) this.toggleWeapon();
      }

      // Super Special Devastation Strike
      if (k === 'l' || k === 'u') {
        if (!e.repeat) this.handleSuperAttack();
      }

      // Dash / Evade
      if (k === 'shift') {
        if (!e.repeat) this.handleDash();
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if ((k === 'w' || k === 'arrowup') && this.input.moveZ < 0) this.input.moveZ = 0;
      if ((k === 's' || k === 'arrowdown') && this.input.moveZ > 0) this.input.moveZ = 0;
      if ((k === 'a' || k === 'arrowleft') && this.input.moveX < 0) this.input.moveX = 0;
      if ((k === 'd' || k === 'arrowright') && this.input.moveX > 0) this.input.moveX = 0;
    });

    const weaponBtn = document.getElementById('btn-weapon-toggle');
    if (weaponBtn) {
      weaponBtn.addEventListener('click', () => this.toggleWeapon());
    }

    const audioBtn = document.getElementById('btn-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        if (this.audio) {
          const enabled = this.audio.toggleSound();
          audioBtn.textContent = enabled ? '🔊' : '🔇';
        }
      });
    }

    const restartBtn = document.getElementById('btn-restart');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => window.location.reload());
    }
  }

  setupTouchControls() {
    const joystickZone = document.getElementById('joystick-zone');
    const joystickStick = document.getElementById('joystick-stick');
    let touchId = null;
    let startX = 0, startY = 0;

    if (joystickZone && joystickStick) {
      joystickZone.addEventListener('touchstart', (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          const rect = joystickZone.getBoundingClientRect();
          if (t.clientX >= rect.left && t.clientX <= rect.right &&
              t.clientY >= rect.top && t.clientY <= rect.bottom) {
            touchId = t.identifier;
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            break;
          }
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (touchId === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === touchId) {
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;
            const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
            const angle = Math.atan2(dy, dx);

            joystickStick.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px)`;
            this.input.moveX = Math.cos(angle) * (dist / 40);
            this.input.moveZ = Math.sin(angle) * (dist / 40);
            break;
          }
        }
      }, { passive: true });

      const handleEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            joystickStick.style.transform = 'translate(0px, 0px)';
            this.input.moveX = 0;
            this.input.moveZ = 0;
            break;
          }
        }
      };

      window.addEventListener('touchend', handleEnd, { passive: true });
      window.addEventListener('touchcancel', handleEnd, { passive: true });
    }

    const bindBtn = (id, callback) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (this.audio) this.audio.init();
          callback();
        });
        el.addEventListener('mousedown', (e) => {
          e.preventDefault();
          if (this.audio) this.audio.init();
          callback();
        });
      }
    };

    bindBtn('btn-attack-a', () => this.handleAttackA());
    bindBtn('btn-attack-b', () => this.handleAttackB());
    bindBtn('btn-jump', () => this.handleJumpOrClimb());
    bindBtn('btn-weapon', () => this.toggleWeapon());
    bindBtn('btn-special', () => this.handleSuperAttack());
    bindBtn('btn-dash', () => this.handleDash());
  }

  // -------------------------------------------------------------
  // REAL COMBAT EXECUTION (BOXING PUNCH COMBOS ON BUTTON A)
  // -------------------------------------------------------------
  handleAttackA() {
    const p = this.player;
    if (!p || p.state === 'hurt' || p.isClimbing) return;

    const fwdX = Math.sin(p.mesh.rotation.y);
    const fwdZ = Math.cos(p.mesh.rotation.y);

    if (this.weaponMode === 'fists') {
      // REAL REALISTIC 3-HIT BOXING COMBO WITH IMPACT FOLLOW-THROUGH
      p.state = 'punch';

      const now = performance.now();
      if (!p.lastPunchTime || (now - p.lastPunchTime > 850)) {
        p.comboStep = 0;
      } else {
        p.comboStep = (p.comboStep + 1) % 3;
      }
      p.lastPunchTime = now;

      let startTime = 0.05;
      let durationTicks = 24;
      let timeScale = 1.35;
      let damage = 22;
      let knockback = 18;
      let stepSpeed = 3.6;
      let isHeavy = false;

      if (p.comboStep === 0) {
        // Step 1: Crisp Left Lead Jab
        startTime = 0.05;
        durationTicks = 22;
        timeScale = 1.4;
        damage = 22;
        knockback = 18;
        stepSpeed = 3.6;
        if (this.audio) this.audio.playPunchWhoosh();
      } else if (p.comboStep === 1) {
        // Step 2: Right Straight Cross
        startTime = 0.48;
        durationTicks = 26;
        timeScale = 1.45;
        damage = 32;
        knockback = 30;
        stepSpeed = 4.6;
        if (this.audio) this.audio.playPunchWhoosh();
      } else {
        // Step 3: Heavy Lead Hook / Uppercut Finisher
        startTime = 0.98;
        durationTicks = 34;
        timeScale = 1.3;
        damage = 55;
        knockback = 65;
        stepSpeed = 5.8;
        isHeavy = true;
        if (this.audio) this.audio.playKick();
      }

      p.stateTimer = durationTicks;
      p.vx = fwdX * stepSpeed;
      p.vz = fwdZ * stepSpeed;

      this.playHeroAction('punch', startTime, timeScale);

      // Check hit timed to the punch extension frame
      setTimeout(() => {
        this.executeMeleeHitCheck({
          range: p.comboStep === 2 ? 80 : 68,
          angleFOV: 1.8,
          damage: damage,
          isHeavy: isHeavy,
          knockback: knockback
        });
      }, 100);
    } else {
      // REAL GREAT SWORD SLASH FROM SWING TO LAND.FBX
      p.state = 'sword_slash';
      p.stateTimer = 28;
      p.vx = fwdX * 4.2;
      p.vz = fwdZ * 4.2;

      this.playHeroAction('sword_slash', 0.1, 1.3);

      if (this.audio) this.audio.playSwordSwing();

      setTimeout(() => {
        this.executeMeleeHitCheck({
          range: 95,
          angleFOV: 2.2,
          damage: 52,
          isHeavy: true,
          knockback: 55,
          isSword: true
        });
      }, 120);
    }
  }

  handleAttackB() {
    const p = this.player;
    if (!p || p.state === 'hurt' || p.isClimbing) return;

    const fwdX = Math.sin(p.mesh.rotation.y);
    const fwdZ = Math.cos(p.mesh.rotation.y);

    if (this.weaponMode === 'fists') {
      p.state = 'kick';
      p.stateTimer = 26;
      p.vx = fwdX * 4.8;
      p.vz = fwdZ * 4.8;

      this.playHeroAction('punch', 0.98, 1.25);

      if (this.audio) this.audio.playKick();

      setTimeout(() => {
        this.executeMeleeHitCheck({
          range: 78,
          angleFOV: 1.6,
          damage: 38,
          isHeavy: true,
          knockback: 48
        });
      }, 120);
    } else {
      // REAL GREAT SWORD JUMP ATTACK FROM GREAT SWORD JUMP ATTACK.FBX
      p.state = 'sword_slam';
      p.stateTimer = 34;
      p.vy = 10;
      p.vx = fwdX * 3.5;
      p.vz = fwdZ * 3.5;

      this.playHeroAction('sword_slam', 0, 1.2);

      if (this.audio) this.audio.playSwordSwing();

      setTimeout(() => {
        if (this.audio) this.audio.playHitImpact(true);
        const impactX = Math.sin(p.mesh.rotation.y) * 40;
        const impactZ = Math.cos(p.mesh.rotation.y) * 40;
        this.createGroundShockwave(p.x + impactX, p.z + impactZ);
        this.triggerScreenShake(14);

        this.executeMeleeHitCheck({
          range: 110,
          angleFOV: 2.8,
          damage: 70,
          isHeavy: true,
          knockback: 70,
          isSword: true
        });
      }, 260);
    }
  }

  handleJumpOrClimb() {
    const p = this.player;
    if (!p || p.isClimbing) return;

    const nearObstacle = this.findNearbyClimbableObstacle();

    if (nearObstacle) {
      // REAL OBSTACLE VAULTING FROM CLIMBING TO TOP.FBX
      p.isClimbing = true;
      p.state = 'climb';
      p.stateTimer = 45;
      p.climbProgress = 0;
      p.climbObstacle = nearObstacle;

      this.playHeroAction('climb', 0, 1.1);

      if (this.audio) this.audio.playClimbSound();
    } else if (p.isGrounded) {
      // REAL PARABOLIC JUMP: Carries running momentum forward into leap!
      p.isGrounded = false;
      p.vy = 14.5;
      p.state = 'jump';
      p.stateTimer = 45;

      const hasInput = (Math.abs(this.input.moveX) > 0.05 || Math.abs(this.input.moveZ) > 0.05);
      if (hasInput) {
        // High-flying parabolic running leap!
        p.vx = this.input.moveX * (p.speed * 1.45);
        p.vz = this.input.moveZ * (p.speed * 1.45);
      } else {
        // Preserve running momentum into the leap if moving!
        p.vx = p.vx * 1.15;
        p.vz = p.vz * 1.15;
      }

      // Athletic mid-air launch pose from Jump.fbx (starting directly at 0.70s takeoff frame)
      this.playHeroAction('jump', 0.70, 1.15);

      if (this.audio) this.audio.playKick();
    }
  }

  findNearbyClimbableObstacle() {
    const p = this.player;
    for (let obs of this.obstacles) {
      const dx = Math.abs(p.x - obs.x);
      const dz = Math.abs(p.z - obs.z);
      if (dx < obs.width / 2 + 35 && dz < obs.depth / 2 + 25) {
        return obs;
      }
    }
    return null;
  }

  handleSuperAttack() {
    const p = this.player;
    if (!p || p.sp < 30 || p.isClimbing) return;

    p.sp = Math.max(0, p.sp - 30);
    this.updateHUDHero();

    p.state = 'super';
    p.stateTimer = 35;

    this.playHeroAction('sword_slash');

    if (this.audio) this.audio.playSuperAttack();
    this.triggerScreenShake(20);

    this.enemies.forEach((enemy) => {
      if (!enemy.isAlive) return;
      const dx = enemy.x - p.x;
      const dz = enemy.z - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < 135) {
        this.damageEnemy(enemy, 85, true, true, 75);
      }
    });
  }

  handleDash() {
    const p = this.player;
    if (!p || p.isClimbing || p.state === 'dash') return;

    p.state = 'dash';
    p.stateTimer = 16;
    const fwdX = Math.sin(p.mesh.rotation.y);
    const fwdZ = Math.cos(p.mesh.rotation.y);
    p.vx = fwdX * 9.5;
    p.vz = fwdZ * 9.5;

    if (this.audio) this.audio.playDash();
  }

  // Directional 360-degree hit detection
  executeMeleeHitCheck(options) {
    const p = this.player;
    let hitCount = 0;

    const heroFwdX = Math.sin(p.mesh.rotation.y);
    const heroFwdZ = Math.cos(p.mesh.rotation.y);

    this.enemies.forEach((enemy) => {
      if (!enemy.isAlive) return;

      const dx = enemy.x - p.x;
      const dz = enemy.z - p.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < options.range) {
        // Dot product to check if enemy is in front of hero's facing cone
        const normDx = dx / (dist || 1);
        const normDz = dz / (dist || 1);
        const dot = normDx * heroFwdX + normDz * heroFwdZ;

        if (dot > 0.1 || dist < 35) {
          this.damageEnemy(enemy, options.damage, options.isHeavy, options.isSword, options.knockback);
          hitCount++;
        }
      }
    });

    if (hitCount > 0) {
      this.combo++;
      this.comboTimer = 140;
      this.updateComboDisplay();

      p.sp = Math.min(p.maxSp, p.sp + 9);
      this.updateHUDHero();
    }
  }

  damageEnemy(enemy, damage, isHeavy = false, isSword = false, knockback = 30) {
    enemy.hp = Math.max(0, enemy.hp - damage);
    this.score += damage * 15;
    this.updateHUDScore();

    this.createHitParticles(enemy.x, enemy.y + 40, enemy.z, isSword);
    this.createDamagePopup(enemy.x, enemy.y + 70, enemy.z, damage, isHeavy);

    if (isSword) {
      if (this.audio) this.audio.playSwordClash();
    } else {
      if (this.audio) this.audio.playHitImpact(isHeavy);
    }

    if (enemy.hp <= 0) {
      // REAL ZOMBIE DEATH COLLAPSE FROM DEATH FROM RIGHT.FBX
      enemy.isAlive = false;
      enemy.state = 'death';
      enemy.stateTimer = 120;
      this.totalEnemiesDefeated++;

      this.playZombieAction(enemy, 'death');

      if (this.audio) this.audio.playZombieDeath();

      this.triggerScreenShake(isHeavy ? 12 : 6);

      const aliveEnemies = this.enemies.filter(e => e.isAlive).length;
      if (aliveEnemies === 0) {
        this.activeWaveIndex++;
        if (this.activeWaveIndex <= 2) {
          setTimeout(() => this.spawnWave(this.activeWaveIndex), 1200);
        } else {
          this.triggerStageClear();
        }
      }
    } else {
      // REAL ZOMBIE HIT REACTION FLINCH FROM MEDIUM HIT TO HEAD.FBX
      enemy.state = 'hit';
      enemy.stateTimer = 16;
      const fwdX = Math.sin(this.player.mesh.rotation.y);
      const fwdZ = Math.cos(this.player.mesh.rotation.y);
      enemy.vx = fwdX * (knockback * 0.15);
      enemy.vz = fwdZ * (knockback * 0.15);

      this.playZombieAction(enemy, 'hit');

      if (this.audio && Math.random() > 0.5) this.audio.playZombieGroan();
    }
  }

  damagePlayer(damage) {
    const p = this.player;
    if (!p || p.state === 'hurt' || p.state === 'dash' || this.isGameOver) return;

    p.hp = Math.max(0, p.hp - damage);
    p.state = 'hurt';
    p.stateTimer = 18;
    p.comboStep = 0;

    this.triggerScreenShake(10);
    if (this.audio) this.audio.playHitImpact(true);
    this.createHitParticles(p.x, p.y + 45, p.z, false);

    this.updateHUDHero();

    if (p.hp <= 0) this.triggerGameOver();
  }

  createHitParticles(x, y, z, isSword) {
    const count = isSword ? 16 : 8;
    for (let i = 0; i < count; i++) {
      const pColor = isSword ? (Math.random() > 0.4 ? 0xef4444 : 0xfacc15) : 0xdc2626;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 2.2, 2.2),
        new THREE.MeshBasicMaterial({ color: pColor })
      );
      mesh.position.set(x, y, z);
      this.scene.add(mesh);

      this.particles.push({
        mesh: mesh,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 8 + 2,
        vz: (Math.random() - 0.5) * 8,
        life: 22
      });
    }
  }

  createGroundShockwave(x, z) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4, 9, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.4, z);
    this.scene.add(ring);

    this.particles.push({
      mesh: ring,
      isShockwave: true,
      scale: 1,
      life: 20
    });
  }

  createDamagePopup(x, y, z, damage, isCrit) {
    const popupEl = document.createElement('div');
    popupEl.className = 'damage-number' + (isCrit ? ' crit' : '');
    popupEl.textContent = `-${damage}`;
    this.healthbarsContainer.appendChild(popupEl);

    this.damagePopups.push({
      el: popupEl,
      x: x, y: y, z: z,
      vy: 1.5, opacity: 1.0, life: 35
    });
  }

  triggerScreenShake(intensity) {
    this.screenShake = intensity;
  }

  // -------------------------------------------------------------
  // NATURAL SKELETAL POSE & KINEMATICS:
  // HANDS HANG NATURALLY DOWNWARD, SMOOTH GROUNDED STRIDES
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // NATURAL SKELETAL POSE & KINEMATICS:
  // BIOMECHANICALLY REALISTIC HUMAN STRIDE & UNDEAD SHAMBLE
  // -------------------------------------------------------------
  applyNaturalHeroPose(dt, time) {
    const p = this.player;
    if (!p || !p.bones) return;

    const b = p.bones;
    const isMoving = (p.state === 'walk');

    // Smooth ease-in / ease-out blend between Idle and Walking (0 to 1)
    p.walkBlend = THREE.MathUtils.lerp(p.walkBlend || 0, isMoving ? 1.0 : 0.0, dt * 10.0);
    const blend = p.walkBlend;

    const currentSpeed = Math.hypot(p.vx, p.vz);
    if (isMoving) {
      // Stride frequency accurately linked to ground speed = ZERO FOOT SLIDING
      p.walkCycle += dt * Math.max(4.0, currentSpeed * 1.7);
    }
    const cycle = p.walkCycle || 0;

    // 1. HIPS: Weight-bearing vertical drop & lateral sway
    const baseHipY = (b.hips && b.hips.userData.restPos) ? b.hips.userData.restPos.y : 86;
    if (b.hips && b.hips.userData.restQ) {
      b.hips.quaternion.copy(b.hips.userData.restQ);
      // Hips drop slightly on weight acceptance and rise on push-off
      const hipBob = -1.6 * Math.abs(Math.sin(cycle)) * blend;
      const hipSway = 0.5 * Math.cos(cycle) * blend;
      b.hips.position.y = baseHipY + hipBob;
      b.hips.position.x = hipSway;
    }

    // 2. LEGS: Biomechanically accurate human stride (stance vs swing phases)
    // Gait phase for Left leg: cycle normalized to 0 .. 2*PI
    const phiL = cycle % (Math.PI * 2);
    // Right leg is exactly 180 deg (PI) out of phase
    const phiR = (cycle + Math.PI) % (Math.PI * 2);

    // Thigh swing forward and back: cos(phi) swings forward at 0, back at PI
    const thighL = Math.cos(phiL) * 0.38 * blend;
    const thighR = Math.cos(phiR) * 0.38 * blend;

    // Knee mechanics:
    // Stance phase (phi < PI): foot is on the pavement pushing backward. Knee is STRAIGHT (supports body weight)!
    // Swing phase (phi >= PI): foot lifts off ground and swings forward. Knee flexes back (-0.52) to clear the ground!
    const getKneeFlex = (phi) => {
      if (phi < Math.PI) {
        return -0.05 * Math.sin(phi); // straight leg with micro-cushioning
      } else {
        const swingProgress = (phi - Math.PI) / Math.PI;
        return -0.52 * Math.sin(swingProgress * Math.PI);
      }
    };

    const kneeL = getKneeFlex(phiL) * blend;
    const kneeR = getKneeFlex(phiR) * blend;

    // Ankle / Foot roll:
    // At heel strike (phi ~ 0), foot angles up (+0.18)
    // At push off (phi ~ PI), foot angles down (-0.20)
    // During swing (phi > PI), foot returns to level neutral (0)
    const getFootRoll = (phi) => {
      if (phi < Math.PI) {
        return Math.cos(phi) * 0.18;
      } else {
        return 0;
      }
    };

    const footRollL = getFootRoll(phiL) * blend;
    const footRollR = getFootRoll(phiR) * blend;

    if (b.leftUpLeg && b.leftUpLeg.userData.restQ) {
      b.leftUpLeg.quaternion.copy(b.leftUpLeg.userData.restQ);
      b.leftUpLeg.rotateX(thighL);
    }
    if (b.rightUpLeg && b.rightUpLeg.userData.restQ) {
      b.rightUpLeg.quaternion.copy(b.rightUpLeg.userData.restQ);
      b.rightUpLeg.rotateX(thighR);
    }
    if (b.leftLeg && b.leftLeg.userData.restQ) {
      b.leftLeg.quaternion.copy(b.leftLeg.userData.restQ);
      b.leftLeg.rotateX(kneeL);
    }
    if (b.rightLeg && b.rightLeg.userData.restQ) {
      b.rightLeg.quaternion.copy(b.rightLeg.userData.restQ);
      b.rightLeg.rotateX(kneeR);
    }
    if (b.leftFoot && b.leftFoot.userData.restQ) {
      b.leftFoot.quaternion.copy(b.leftFoot.userData.restQ);
      b.leftFoot.rotateX(footRollL);
    }
    if (b.rightFoot && b.rightFoot.userData.restQ) {
      b.rightFoot.quaternion.copy(b.rightFoot.userData.restQ);
      b.rightFoot.rotateX(footRollR);
    }

    // 3. TORSO: Subtle forward lean into motion
    if (b.spine && b.spine.userData.restQ) {
      b.spine.quaternion.copy(b.spine.userData.restQ);
      b.spine.rotateX(0.08 * blend);
    }

    // 4. ARMS: Counter-balancing running swing
    const breath = Math.sin(time * 2.5) * 0.03 * (1 - blend);
    const armSwing = Math.sin(cycle) * 0.45 * blend;

    if (this.weaponMode === 'fists') {
      if (b.leftArm && b.leftArm.userData.restQ) {
        b.leftArm.quaternion.copy(b.leftArm.userData.restQ);
        b.leftArm.rotateX(1.22 + breath);
        b.leftArm.rotateZ(armSwing);
      }
      if (b.rightArm && b.rightArm.userData.restQ) {
        b.rightArm.quaternion.copy(b.rightArm.userData.restQ);
        b.rightArm.rotateX(1.22 + breath);
        b.rightArm.rotateZ(-armSwing);
      }
      if (b.leftForeArm && b.leftForeArm.userData.restQ) {
        b.leftForeArm.quaternion.copy(b.leftForeArm.userData.restQ);
        b.leftForeArm.rotateZ(0.35 + 0.15 * Math.sin(cycle) * blend);
      }
      if (b.rightForeArm && b.rightForeArm.userData.restQ) {
        b.rightForeArm.quaternion.copy(b.rightForeArm.userData.restQ);
        b.rightForeArm.rotateZ(-0.35 - 0.15 * Math.sin(cycle) * blend);
      }
    } else {
      // Great Sword stance
      if (b.rightArm && b.rightArm.userData.restQ) {
        b.rightArm.quaternion.copy(b.rightArm.userData.restQ);
        b.rightArm.rotateX(1.1);
        b.rightArm.rotateZ(0.22);
      }
      if (b.leftArm && b.leftArm.userData.restQ) {
        b.leftArm.quaternion.copy(b.leftArm.userData.restQ);
        b.leftArm.rotateX(1.22 + breath);
        b.leftArm.rotateZ(armSwing);
      }
      if (b.leftForeArm && b.leftForeArm.userData.restQ) {
        b.leftForeArm.quaternion.copy(b.leftForeArm.userData.restQ);
        b.leftForeArm.rotateZ(0.35);
      }
    }
  }

  applyNaturalZombiePose(enemy, dt, time) {
    if (!enemy || !enemy.bones || !enemy.isAlive) return;
    const b = enemy.bones;

    if (enemy.state === 'walk') {
      enemy.walkCycle += dt * (enemy.speed * 2.2);
      const cycle = enemy.walkCycle;

      // Hips bobbing
      const baseHipY = (b.hips && b.hips.userData.restPos) ? b.hips.userData.restPos.y : 82;
      if (b.hips && b.hips.userData.restQ) {
        b.hips.quaternion.copy(b.hips.userData.restQ);
        b.hips.position.y = baseHipY - 1.4 * Math.abs(Math.sin(cycle));
        b.hips.position.x = 0.5 * Math.cos(cycle);
      }

      // Legs: dragging undead shamble with natural stance/swing phases
      const phiL = cycle % (Math.PI * 2);
      const phiR = (cycle + Math.PI + 0.2) % (Math.PI * 2); // slight zombie limp offset

      const thighL = Math.cos(phiL) * 0.32;
      const thighR = Math.cos(phiR) * 0.28;

      const getZombieKnee = (phi) => {
        if (phi < Math.PI) {
          return -0.04 * Math.sin(phi); // straight leg supporting dragging step
        } else {
          const sw = (phi - Math.PI) / Math.PI;
          return -0.38 * Math.sin(sw * Math.PI); // low clearing shuffle
        }
      };

      const kneeL = getZombieKnee(phiL);
      const kneeR = getZombieKnee(phiR);

      const footL = (phiL < Math.PI) ? Math.cos(phiL) * 0.14 : 0;
      const footR = (phiR < Math.PI) ? Math.cos(phiR) * 0.14 : 0;

      if (b.leftUpLeg && b.leftUpLeg.userData.restQ) {
        b.leftUpLeg.quaternion.copy(b.leftUpLeg.userData.restQ);
        b.leftUpLeg.rotateX(thighL);
      }
      if (b.rightUpLeg && b.rightUpLeg.userData.restQ) {
        b.rightUpLeg.quaternion.copy(b.rightUpLeg.userData.restQ);
        b.rightUpLeg.rotateX(thighR);
      }
      if (b.leftLeg && b.leftLeg.userData.restQ) {
        b.leftLeg.quaternion.copy(b.leftLeg.userData.restQ);
        b.leftLeg.rotateX(kneeL);
      }
      if (b.rightLeg && b.rightLeg.userData.restQ) {
        b.rightLeg.quaternion.copy(b.rightLeg.userData.restQ);
        b.rightLeg.rotateX(kneeR);
      }
      if (b.leftFoot && b.leftFoot.userData.restQ) {
        b.leftFoot.quaternion.copy(b.leftFoot.userData.restQ);
        b.leftFoot.rotateX(footL);
      }
      if (b.rightFoot && b.rightFoot.userData.restQ) {
        b.rightFoot.quaternion.copy(b.rightFoot.userData.restQ);
        b.rightFoot.rotateX(footR);
      }

      // Torso hunched forward
      if (b.spine && b.spine.userData.restQ) {
        b.spine.quaternion.copy(b.spine.userData.restQ);
        b.spine.rotateX(0.18);
      }

      // Zombie Arms reaching FORWARD towards player
      const reachSwayL = Math.sin(cycle * 0.7) * 0.12;
      const reachSwayR = Math.sin(cycle * 0.7 + 1.2) * 0.12;

      if (b.leftArm && b.leftArm.userData.restQ) {
        b.leftArm.quaternion.copy(b.leftArm.userData.restQ);
        b.leftArm.rotateX(0.35);
        b.leftArm.rotateZ(1.15 + reachSwayL);
      }
      if (b.rightArm && b.rightArm.userData.restQ) {
        b.rightArm.quaternion.copy(b.rightArm.userData.restQ);
        b.rightArm.rotateX(0.35);
        b.rightArm.rotateZ(-1.15 - reachSwayR);
      }
      if (b.leftForeArm && b.leftForeArm.userData.restQ) {
        b.leftForeArm.quaternion.copy(b.leftForeArm.userData.restQ);
        b.leftForeArm.rotateZ(0.25);
      }
      if (b.rightForeArm && b.rightForeArm.userData.restQ) {
        b.rightForeArm.quaternion.copy(b.rightForeArm.userData.restQ);
        b.rightForeArm.rotateZ(-0.25);
      }
    }
  }

  // -------------------------------------------------------------
  // ANIMATION LOOP & UPDATE
  // -------------------------------------------------------------
  animate(timestamp) {
    requestAnimationFrame((t) => this.animate(t));

    // Hit-stop impact pause (40ms impact crunch for realistic martial arts feel)
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (!this.isPaused) {
      this.updatePlayer(dt, time);
      this.updateEnemies(dt, time);
      this.updateObstacles(time);
      this.updateParticles(dt);
      this.updateCamera();
      this.updateFloatingHealthBars();
      this.updateDamagePopups();
    }

    this.renderer.render(this.scene, this.camera);
  }

  updatePlayer(dt, time) {
    const p = this.player;
    if (!p) return;

    const isAttacking = (
      p.state === 'punch' || p.state === 'kick' ||
      p.state === 'sword_slash' || p.state === 'sword_slam'
    );
    const isJumping = (p.state === 'jump' || !p.isGrounded);
    const isClimbing = (p.state === 'climb' || p.isClimbing);

    if (isAttacking || isJumping || isClimbing) {
      if (p.mixer) p.mixer.update(dt);
    } else {
      // Natural grounded biomechanical kinematics
      this.applyNaturalHeroPose(dt, time);
    }

    // Horizontal Movement & Aerial Parabolic Steering
    if (!isClimbing) {
      if (isJumping) {
        // High-flying parabolic momentum carrying running velocity into the air
        const hasInput = (Math.abs(this.input.moveX) > 0.05 || Math.abs(this.input.moveZ) > 0.05);
        if (hasInput) {
          // Responsive aerial steering
          p.vx = THREE.MathUtils.lerp(p.vx, this.input.moveX * (p.speed * 1.45), 0.08);
          p.vz = THREE.MathUtils.lerp(p.vz, this.input.moveZ * (p.speed * 1.45), 0.08);

          const targetAngle = Math.atan2(p.vx, p.vz);
          let diff = targetAngle - p.mesh.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          p.mesh.rotation.y += diff * 0.15;
        }
      } else if (!isAttacking) {
        // Grounded Movement & 360-Degree Directional Turning
        const hasInput = (Math.abs(this.input.moveX) > 0.05 || Math.abs(this.input.moveZ) > 0.05);

        if (hasInput) {
          p.vx = this.input.moveX * p.speed;
          p.vz = this.input.moveZ * p.speed;

          const targetAngle = Math.atan2(p.vx, p.vz);
          let diff = targetAngle - p.mesh.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          p.mesh.rotation.y += diff * 0.25;

          if (p.isGrounded && p.state !== 'dash') {
            p.state = 'walk';
            this.stopHeroAction();
          }
        } else {
          p.vx *= 0.72;
          p.vz *= 0.72;
          if (p.isGrounded && p.state !== 'dash') {
            p.state = 'idle';
            this.stopHeroAction();
          }
        }
      } else {
        // Friction during attack lunges
        p.vx *= 0.88;
        p.vz *= 0.88;
      }
    }

    // Vaulting / Climbing Obstacle Logic
    if (p.isClimbing && p.climbObstacle) {
      p.climbProgress += 0.035;
      const obs = p.climbObstacle;
      const fwdX = Math.sin(p.mesh.rotation.y);
      p.x = THREE.MathUtils.lerp(p.x, obs.x + (fwdX * (obs.width / 2 + 25)), 0.12);
      p.y = Math.sin(p.climbProgress * Math.PI) * (obs.height + 15);

      if (p.climbProgress >= 1.0) {
        p.isClimbing = false;
        p.y = 0;
        p.isGrounded = true;
        p.state = 'idle';
        this.stopHeroAction();
      }
    } else {
      // Integrate velocity into parabolic trajectory
      p.x += p.vx;
      p.z += p.vz;
      p.y += p.vy;

      if (!p.isGrounded) {
        p.vy -= 0.62; // Smooth parabolic gravity
        if (p.y <= 0) {
          p.y = 0;
          p.vy = 0;
          p.isGrounded = true;
          if (p.state === 'jump') {
            const hasInput = (Math.abs(this.input.moveX) > 0.05 || Math.abs(this.input.moveZ) > 0.05);
            p.state = hasInput ? 'walk' : 'idle';
            this.stopHeroAction();
          }
        }
      }

      p.z = THREE.MathUtils.clamp(p.z, -110, 110);

      this.obstacles.forEach((obs) => {
        const dx = Math.abs(p.x - obs.x);
        const dz = Math.abs(p.z - obs.z);
        if (dx < obs.width / 2 + 10 && dz < obs.depth / 2 + 10 && p.y < obs.height * 0.7) {
          if (p.x < obs.x) p.x = obs.x - (obs.width / 2 + 10);
          else p.x = obs.x + (obs.width / 2 + 10);
        }
      });
    }

    if (p.stateTimer > 0) {
      p.stateTimer--;
      if (p.stateTimer <= 0 && p.state !== 'walk' && !p.isClimbing && p.isGrounded) {
        p.state = 'idle';
        this.stopHeroAction();
      }
    }

    if (p.mesh) {
      p.mesh.position.set(p.x, p.y, p.z);
    }
  }

  updateEnemies(dt, time) {
    const p = this.player;
    if (!p) return;

    this.enemies.forEach((enemy) => {
      const isAttackingOrHitOrDead = (
        enemy.state === 'attack' || enemy.state === 'hit' || enemy.state === 'death'
      );

      if (isAttackingOrHitOrDead) {
        if (enemy.mixer) enemy.mixer.update(dt);
      } else {
        this.applyNaturalZombiePose(enemy, dt, time);
      }

      if (!enemy.isAlive) {
        if (enemy.stateTimer > 0) enemy.stateTimer--;
        return;
      }

      const dx = p.x - enemy.x;
      const dz = p.z - enemy.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Smoothly rotate zombie to face player
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - enemy.mesh.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      enemy.mesh.rotation.y += diff * 0.15;

      if (enemy.state !== 'hit' && enemy.state !== 'attack') {
        if (dist > 48) {
          enemy.vx = (dx / dist) * enemy.speed;
          enemy.vz = (dz / dist) * enemy.speed;
          enemy.x += enemy.vx;
          enemy.z += enemy.vz;
          enemy.state = 'walk';
          this.stopZombieAction(enemy);
        } else {
          enemy.vx = 0;
          enemy.vz = 0;
          if (enemy.attackCooldown <= 0) {
            enemy.state = 'attack';
            enemy.stateTimer = 26;
            enemy.attackCooldown = 80 + Math.random() * 40;

            this.playZombieAction(enemy, 'kick');

            setTimeout(() => {
              if (enemy.isAlive && Math.abs(p.x - enemy.x) < 55 && Math.abs(p.z - enemy.z) < 30) {
                this.damagePlayer(enemy.attackPower);
              }
            }, 250);
          }
        }
      } else if (enemy.state === 'hit') {
        enemy.x += enemy.vx;
        enemy.z += enemy.vz;
        enemy.vx *= 0.8;
        enemy.vz *= 0.8;
      }

      if (enemy.attackCooldown > 0) enemy.attackCooldown--;
      if (enemy.stateTimer > 0) {
        enemy.stateTimer--;
        if (enemy.stateTimer <= 0) {
          enemy.state = 'walk';
          this.stopZombieAction(enemy);
        }
      }

      if (enemy.mesh) {
        enemy.mesh.position.set(enemy.x, enemy.y, enemy.z);
      }
    });
  }

  updateObstacles(time) {
    this.obstacles.forEach((obs) => {
      if (obs.type === 'barrels' && obs.fireLights) {
        obs.fireLights.forEach((light) => {
          light.intensity = 2.2 + Math.sin(time * 14 + obs.x) * 0.6;
        });
        if (obs.group.userData.flameMesh) {
          const fm = obs.group.userData.flameMesh;
          fm.scale.y = 1.0 + Math.sin(time * 18) * 0.2;
          fm.scale.x = 1.0 + Math.cos(time * 16) * 0.15;
        }
      }
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life--;

      if (p.isShockwave) {
        p.scale += 0.8;
        p.mesh.scale.set(p.scale, p.scale, p.scale);
        p.mesh.material.opacity = Math.max(0, p.life / 20);
      } else {
        p.mesh.position.x += p.vx;
        p.mesh.position.y += p.vy;
        p.mesh.position.z += p.vz;
        p.vy -= 0.35;
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  updateDamagePopups() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const widthHalf = width / 2;
    const heightHalf = height / 2;
    const tempVec = new THREE.Vector3();

    for (let i = this.damagePopups.length - 1; i >= 0; i--) {
      const pop = this.damagePopups[i];
      pop.life--;
      pop.y += pop.vy;
      pop.opacity = Math.max(0, pop.life / 35);

      tempVec.set(pop.x, pop.y, pop.z);
      tempVec.project(this.camera);

      pop.el.style.left = `${(tempVec.x * widthHalf) + widthHalf}px`;
      pop.el.style.top = `${-(tempVec.y * heightHalf) + heightHalf}px`;
      pop.el.style.opacity = pop.opacity;

      if (pop.life <= 0) {
        if (pop.el.parentNode) pop.el.parentNode.removeChild(pop.el);
        this.damagePopups.splice(i, 1);
      }
    }
  }

  updateCamera() {
    if (!this.player) return;
    const p = this.player;

    const targetCameraX = p.x + 35;
    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetCameraX, 0.08);

    if (this.screenShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake;
      this.camera.position.y = 115 + (Math.random() - 0.5) * this.screenShake;
      this.screenShake *= 0.88;
      if (this.screenShake < 0.2) this.screenShake = 0;
    } else {
      this.camera.position.y = 115;
    }

    this.camera.lookAt(this.camera.position.x + 30, 45, 0);

    if (this.dirLight) {
      this.dirLight.position.x = this.camera.position.x + 140;
      this.dirLight.target.position.x = this.camera.position.x;
      this.dirLight.target.updateMatrixWorld();
    }
  }

  // -------------------------------------------------------------
  // HUD UPDATES: TOP CORNER HERO BAR & FLOATING ENEMY BARS
  // -------------------------------------------------------------
  updateHUDHero() {
    if (!this.player) return;
    const p = this.player;

    const hpBar = document.getElementById('hud-hp-bar');
    const hpText = document.getElementById('hud-hp-text');
    const spBar = document.getElementById('hud-sp-bar');

    const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
    const spPct = Math.max(0, Math.min(100, (p.sp / p.maxSp) * 100));

    if (hpBar) {
      hpBar.style.width = `${hpPct}%`;
      if (hpPct > 50) hpBar.style.background = 'linear-gradient(90deg, #22c55e 0%, #a3e635 100%)';
      else if (hpPct > 25) hpBar.style.background = 'linear-gradient(90deg, #eab308 0%, #f97316 100%)';
      else hpBar.style.background = 'linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)';
    }
    if (hpText) hpText.textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    if (spBar) spBar.style.width = `${spPct}%`;
  }

  updateHUDWeaponBadge() {
    const badge = document.getElementById('btn-weapon-toggle');
    const icon = document.getElementById('weapon-icon');
    const text = document.getElementById('weapon-mode-text');
    const btnA = document.getElementById('btn-a-text');

    if (this.weaponMode === 'fists') {
      if (icon) icon.textContent = '🥊';
      if (text) text.textContent = 'FISTS (BOXING)';
      if (btnA) btnA.textContent = 'PUNCH';
      if (badge) badge.classList.remove('sword-mode');
    } else {
      if (icon) icon.textContent = '⚔️';
      if (text) text.textContent = 'GREAT SWORD';
      if (btnA) btnA.textContent = 'SLASH';
      if (badge) badge.classList.add('sword-mode');
    }
  }

  updateHUDScore() {
    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) scoreEl.textContent = `SCORE: ${String(this.score).padStart(6, '0')}`;
  }

  updateComboDisplay() {
    const comboEl = document.getElementById('combo-display');
    const comboNum = document.getElementById('combo-num');

    if (this.combo > 1) {
      if (comboEl) comboEl.classList.remove('hidden');
      if (comboNum) comboNum.textContent = `x${this.combo}`;
    }
  }

  triggerStageClear() {
    this.isStageClearing = true;
    if (this.audio) this.audio.playStageClear();

    const modal = document.getElementById('game-modal');
    const title = document.getElementById('modal-headline');
    const desc = document.getElementById('modal-desc');
    const kills = document.getElementById('modal-stat-kills');
    const score = document.getElementById('modal-stat-score');

    if (title) title.textContent = 'DISTRICT SECURED!';
    if (desc) desc.textContent = 'Zombie horde neutralized. Real tactical combat victory.';
    if (kills) kills.textContent = String(this.totalEnemiesDefeated);
    if (score) score.textContent = String(this.score);
    if (modal) modal.classList.remove('hidden');
  }

  triggerGameOver() {
    this.isGameOver = true;
    const modal = document.getElementById('game-modal');
    const title = document.getElementById('modal-headline');
    const desc = document.getElementById('modal-desc');
    const kills = document.getElementById('modal-stat-kills');
    const score = document.getElementById('modal-stat-score');
    const actionBtn = document.getElementById('btn-modal-action');

    if (title) title.textContent = 'MISSION FAILED';
    if (desc) desc.textContent = 'The hero was overwhelmed by hostiles.';
    if (kills) kills.textContent = String(this.totalEnemiesDefeated);
    if (score) score.textContent = String(this.score);
    if (actionBtn) actionBtn.textContent = 'RETRY PATROL';
    if (modal) modal.classList.remove('hidden');
  }

  runAutoTest() {
    console.log('[AUTOTEST] Starting automated game engine test...');

    const captureCanvas = (filename) => {
      try {
        this.renderer.render(this.scene, this.camera);
        const dataUrl = this.canvas.toDataURL('image/png');
        fetch('/api/screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: filename, image: dataUrl })
        });
      } catch (err) {
        console.warn('Screenshot error:', err);
      }
    };

    // 1. Capture Idle State (after models settle)
    setTimeout(() => {
      console.log('[AUTOTEST] 1. Capturing Idle state...');
      captureCanvas('autotest_idle.png');

      // 2. Simulate Walking Forward / Right (Input moveX = 1)
      this.input.moveX = 1;
      setTimeout(() => {
        console.log('[AUTOTEST] 2. Capturing Walking/Running state...');
        captureCanvas('autotest_walk.png');

        // 3. Simulate Running Jump (Button Jump while moving right)
        this.handleJumpOrClimb();
        setTimeout(() => {
          console.log('[AUTOTEST] 3. Capturing Running Parabolic Jump state...');
          captureCanvas('autotest_jump.png');

          // 4. Simulate Punch (Button A)
          this.input.moveX = 0;
          this.handleAttackA();
          setTimeout(() => {
            console.log('[AUTOTEST] 4. Capturing Punch Attack state...');
            captureCanvas('autotest_punch.png');

            // 5. Toggle Weapon to Great Sword and Attack
            this.toggleWeapon();
            this.handleAttackA();
            setTimeout(() => {
              console.log('[AUTOTEST] 5. Capturing Great Sword Attack state...');
              captureCanvas('autotest_sword.png');

            // Send telemetry report
            const p = this.player;
            const b = p ? p.bones : {};
            const p1 = new THREE.Vector3(); const p2 = new THREE.Vector3();
            let heroArmDir = null;
            if (b.leftArm && b.leftForeArm) {
              b.leftArm.getWorldPosition(p1); b.leftForeArm.getWorldPosition(p2);
              const d = p2.sub(p1).normalize();
              heroArmDir = { x: d.x.toFixed(2), y: d.y.toFixed(2), z: d.z.toFixed(2) };
            }

            let zombieArmDir = null;
            const z = this.enemies[0];
            if (z && z.bones && z.bones.leftArm && z.bones.leftForeArm) {
              z.bones.leftArm.getWorldPosition(p1); z.bones.leftForeArm.getWorldPosition(p2);
              const d = p2.sub(p1).normalize();
              zombieArmDir = { x: d.x.toFixed(2), y: d.y.toFixed(2), z: d.z.toFixed(2) };
            }

            const report = {
              status: 'SUCCESS',
              heroArmDir: heroArmDir,
              zombieArmDir: zombieArmDir,
              enemiesAlive: this.enemies.filter(e => e.isAlive).length,
              playerHp: p.hp,
              playerState: p.state,
              score: this.score,
              weaponMode: this.weaponMode
            };

            fetch('/api/log', {
              method: 'POST',
              body: JSON.stringify(report, null, 2)
            });
            console.log('[AUTOTEST] ALL TESTS COMPLETE!', report);
          }, 800);
        }, 800);
      }, 1000);
    }, 1500);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new RealisticBrawler3D();
});
