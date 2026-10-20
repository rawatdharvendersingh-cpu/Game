// Cadillacs & Brawlers - Realistic Arcade Beat 'Em Up Engine

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual Internal Resolution (16:9 widescreen)
    this.viewWidth = 960;
    this.viewHeight = 540;

    // State
    this.currentLevelIndex = 0;
    this.currentStage = LEVELS[this.currentLevelIndex];
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.cameraX = 0;
    this.cameraTargetX = 0;
    this.screenShake = 0;
    this.isPaused = false;
    this.isStageClearing = false;
    this.isGameOver = false;

    // Character State
    this.selectedCharId = 'leo';
    this.unlockedChars = ['leo'];
    this.loadProgress();

    // Player Object
    this.initPlayer();

    // Entities
    this.enemies = [];
    this.bullets = [];
    this.droppedItems = [];
    this.particles = [];
    this.damageTexts = [];
    this.activeWaveIndex = 0;
    this.enemiesRemainingInStage = 0;

    // Inputs
    this.input = {
      x: 0,
      y: 0,
      btnA: false,
      btnB: false,
      btnSpecial: false,
      btnDash: false,
      btnGrab: false
    };

    // Initialize Assets & Systems
    this.resizeCanvas();
    this.setupEventListeners();
    this.setupTouchControls();

    loadAllAssets(() => {
      console.log('All realistic assets loaded successfully.');
    });

    this.startStage(this.currentLevelIndex);

    // Animation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('brawler_unlocked_chars');
      if (saved) this.unlockedChars = JSON.parse(saved);
      const savedChar = localStorage.getItem('brawler_selected_char');
      if (savedChar && CHARACTERS[savedChar] && this.unlockedChars.includes(savedChar)) {
        this.selectedCharId = savedChar;
      }
    } catch (e) {}
  }

  saveProgress() {
    try {
      localStorage.setItem('brawler_unlocked_chars', JSON.stringify(this.unlockedChars));
      localStorage.setItem('brawler_selected_char', this.selectedCharId);
    } catch (e) {}
  }

  initPlayer() {
    const config = CHARACTERS[this.selectedCharId];
    this.player = {
      config: config,
      x: 120,
      y: 420,
      vx: 0,
      vy: 0,
      facing: 1, // 1: right, -1: left
      hp: config.maxHp,
      maxHp: config.maxHp,
      sp: 100,
      maxSp: 100,
      state: 'idle', // idle, walk, attackA, attackB, shoot, special, dash, hurt, down
      stateTimer: 0,
      comboStep: 0,
      comboWindow: 0,
      isInvulnerable: false,
      invulnTimer: 0,
      dashCooldown: 0,
      killsThisStage: 0,
      // Weapon Inventory
      weapon: null // { type: 'gun_pistol', name: '9MM PISTOL', ammo: 12, maxAmmo: 12 }
    };
    this.updateHUDProfile();
    this.updateWeaponHUD();
  }

  resizeCanvas() {
    const container = document.getElementById('game-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    this.scaleX = width / this.viewWidth;
    this.scaleY = height / this.viewHeight;
  }

  // ================= STAGE MANAGEMENT =================
  startStage(levelIndex) {
    this.currentLevelIndex = levelIndex;
    this.currentStage = LEVELS[levelIndex];
    this.cameraX = 0;
    this.cameraTargetX = 0;
    this.activeWaveIndex = 0;
    this.enemies = [];
    this.bullets = [];
    this.droppedItems = [];
    this.particles = [];
    this.damageTexts = [];
    this.isStageClearing = false;
    this.isGameOver = false;

    // Reset player position for new stage
    this.player.x = 100;
    this.player.y = 420;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.state = 'idle';
    this.player.hp = this.player.maxHp;

    // Spawn an initial dropped gun for immediate action!
    if (levelIndex === 0 || levelIndex === 2) {
      this.droppedItems.push({
        id: 'start_gun',
        type: 'gun_pistol',
        name: '9MM HANDGUN',
        ammo: 12,
        x: 280,
        y: 400
      });
    }

    this.enemiesRemainingInStage = this.currentStage.waves.reduce((sum, w) => sum + w.enemies.length, 0);

    this.showStageBanner(this.currentStage.title, this.currentStage.subtitle);
    this.updateHUDStage();
    this.checkWaveSpawns();
  }

  showStageBanner(title, sub) {
    const banner = document.getElementById('stage-banner');
    const bannerTitle = document.getElementById('banner-title');
    const bannerSub = document.getElementById('banner-sub');

    bannerTitle.textContent = title;
    bannerSub.textContent = sub;
    banner.classList.remove('hidden');

    banner.style.animation = 'none';
    banner.offsetHeight;
    banner.style.animation = 'bannerFade 2.4s forwards cubic-bezier(0.16, 1, 0.3, 1)';

    setTimeout(() => {
      banner.classList.add('hidden');
    }, 2400);
  }

  checkWaveSpawns() {
    if (this.activeWaveIndex >= this.currentStage.waves.length) return;

    const wave = this.currentStage.waves[this.activeWaveIndex];
    if (this.cameraX >= wave.triggerX) {
      wave.enemies.forEach((enemyKey, idx) => {
        const typeConfig = ENEMY_TYPES[enemyKey];
        if (!typeConfig) return;

        const spawnOffset = 620 + idx * 85;
        const spawnX = Math.min(this.currentStage.arenaWidth - 60, this.cameraX + spawnOffset);
        const spawnY = this.currentStage.floorY + 20 + Math.random() * (this.currentStage.floorHeight - 50);

        this.enemies.push({
          id: Math.random().toString(36).substr(2, 9),
          typeKey: enemyKey,
          config: typeConfig,
          name: typeConfig.name,
          x: spawnX,
          y: spawnY,
          vx: 0,
          vy: 0,
          facing: -1,
          hp: typeConfig.maxHp,
          maxHp: typeConfig.maxHp,
          state: 'walk',
          stateTimer: 0,
          attackCooldown: 40 + Math.random() * 40,
          shootCooldown: enemyKey === 'cyber_soldier' ? (60 + Math.random() * 60) : 9999,
          isKnockedDown: false,
          downTimer: 0
        });
      });

      this.activeWaveIndex++;
    }
  }

  // ================= INPUT & CONTROLS =================
  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    const keys = {};
    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      this.handleKeyboard(keys);

      audio.init();
      if (!audio.bgmPlaying) audio.startBGM();

      if (e.key.toLowerCase() === 'j' || e.key.toLowerCase() === 'z') this.triggerActionA();
      if (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'x') this.triggerActionB();
      if (e.key.toLowerCase() === 'e') this.triggerActionGrab();
      if (e.key.toLowerCase() === 'l' || e.key === ' ') this.triggerActionSpecial();
      if (e.key === 'Shift') this.triggerActionDash();
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
      this.handleKeyboard(keys);
    });

    document.getElementById('btn-audio').addEventListener('click', () => {
      const isMuted = !audio.toggleSound();
      document.getElementById('btn-audio').textContent = isMuted ? '🔇' : '🔊';
    });

    document.getElementById('btn-roster').addEventListener('click', () => {
      this.openRosterModal();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.startStage(this.currentLevelIndex);
    });

    document.getElementById('btn-close-roster').addEventListener('click', () => {
      document.getElementById('roster-modal').classList.add('hidden');
    });

    document.getElementById('btn-modal-action').addEventListener('click', () => {
      document.getElementById('game-modal').classList.add('hidden');
      if (this.isGameOver) {
        this.startStage(0);
      } else {
        const nextIdx = (this.currentLevelIndex + 1) % LEVELS.length;
        this.startStage(nextIdx);
      }
    });
  }

  handleKeyboard(keys) {
    let dx = 0;
    let dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;

    const len = Math.hypot(dx, dy);
    if (len > 0) {
      this.input.x = dx / len;
      this.input.y = dy / len;
    } else {
      this.input.x = 0;
      this.input.y = 0;
    }
  }

  setupTouchControls() {
    const joystickBase = document.getElementById('joystick-base');
    const joystickStick = document.getElementById('joystick-stick');
    const maxDistance = 45;
    let touchId = null;

    const updateStick = (clientX, clientY) => {
      const rect = joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxDistance) {
        dx = (dx / dist) * maxDistance;
        dy = (dy / dist) * maxDistance;
      }

      joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.input.x = dx / maxDistance;
      this.input.y = dy / maxDistance;
    };

    const resetStick = () => {
      joystickStick.style.transform = 'translate(0px, 0px)';
      this.input.x = 0;
      this.input.y = 0;
      touchId = null;
    };

    joystickBase.addEventListener('touchstart', (e) => {
      audio.init();
      if (!audio.bgmPlaying) audio.startBGM();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      updateStick(touch.clientX, touch.clientY);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          updateStick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    });

    window.addEventListener('touchend', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          resetStick();
          break;
        }
      }
    });

    window.addEventListener('touchcancel', () => resetStick());

    // Mouse drag for testing on desktop
    let isMouseDown = false;
    joystickBase.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      audio.init();
      if (!audio.bgmPlaying) audio.startBGM();
      updateStick(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (isMouseDown) updateStick(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (isMouseDown) {
        isMouseDown = false;
        resetStick();
      }
    });

    // Action Buttons
    const bindBtn = (id, actionFn) => {
      const btn = document.getElementById(id);
      const trigger = (e) => {
        e.preventDefault();
        audio.init();
        if (!audio.bgmPlaying) audio.startBGM();
        btn.classList.add('pressed');
        actionFn();
      };
      const release = () => btn.classList.remove('pressed');

      btn.addEventListener('touchstart', trigger, { passive: false });
      btn.addEventListener('touchend', release);
      btn.addEventListener('mousedown', trigger);
      btn.addEventListener('mouseup', release);
    };

    bindBtn('btn-attack-a', () => this.triggerActionA());
    bindBtn('btn-attack-b', () => this.triggerActionB());
    bindBtn('btn-grab', () => this.triggerActionGrab());
    bindBtn('btn-special', () => this.triggerActionSpecial());
    bindBtn('btn-dash', () => this.triggerActionDash());
  }

  // ================= WEAPONS & COMBAT =================
  triggerActionGrab() {
    const p = this.player;
    // Find closest dropped weapon
    let closestItem = null;
    let closestDist = 70;

    for (let i = 0; i < this.droppedItems.length; i++) {
      const item = this.droppedItems[i];
      const dist = Math.hypot(p.x - item.x, p.y - item.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestItem = item;
      }
    }

    if (closestItem) {
      // Pick up weapon!
      p.weapon = {
        type: closestItem.type,
        name: closestItem.name,
        ammo: closestItem.ammo,
        maxAmmo: closestItem.ammo
      };

      // Remove from ground
      this.droppedItems = this.droppedItems.filter(it => it !== closestItem);

      audio.playGunCock();
      this.updateWeaponHUD();

      // Floating pickup text
      this.damageTexts.push({
        x: p.x,
        y: p.y - 65,
        text: `+ ${p.weapon.name}!`,
        color: '#facc15',
        life: 30
      });
    }
  }

  triggerActionA() {
    const p = this.player;
    if (p.state === 'hurt' || p.state === 'down' || this.isStageClearing || this.isGameOver) return;

    // Check if player has a firearm equipped!
    if (p.weapon && p.weapon.ammo > 0) {
      this.firePlayerGun();
      return;
    }

    // Hand-to-hand punch combo
    const config = p.config;
    if (p.state === 'attackA' && p.comboWindow > 0) {
      p.comboStep = (p.comboStep + 1) % config.comboHits.length;
    } else if (p.state !== 'attackA') {
      p.comboStep = 0;
    }

    const hitData = config.comboHits[p.comboStep];
    p.state = 'attackA';
    p.stateTimer = hitData.duration;
    p.comboWindow = hitData.duration + 10;

    audio.playPunchWhoosh();
    this.executeAttackHit(hitData);
  }

  firePlayerGun() {
    const p = this.player;
    p.state = 'shoot';
    p.stateTimer = 16;
    p.weapon.ammo--;

    audio.playGunshot();
    this.screenShake = 7;

    // Spawn Bullet Projectile
    this.bullets.push({
      x: p.x + p.facing * 35,
      y: p.y - 45,
      vx: p.facing * 18,
      isPlayerBullet: true,
      damage: 42,
      life: 55
    });

    // Muzzle Flash Particles
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: p.x + p.facing * 40,
        y: p.y - 45 + (Math.random() * 8 - 4),
        vx: p.facing * (6 + Math.random() * 4),
        vy: (Math.random() - 0.5) * 4,
        color: '#f59e0b',
        size: 3 + Math.random() * 3,
        life: 10
      });
    }

    // Ejected Brass Casing
    this.particles.push({
      x: p.x + p.facing * 20,
      y: p.y - 48,
      vx: -p.facing * (2 + Math.random() * 2),
      vy: -3 - Math.random() * 2,
      color: '#eab308',
      size: 2,
      life: 20
    });

    this.updateWeaponHUD();

    if (p.weapon.ammo <= 0) {
      setTimeout(() => {
        audio.playDryFire();
        p.weapon = null;
        this.updateWeaponHUD();
      }, 350);
    }
  }

  triggerActionB() {
    const p = this.player;
    if (p.state === 'hurt' || p.state === 'down' || this.isStageClearing || this.isGameOver) return;

    const kickData = p.config.kickMove;
    p.state = 'attackB';
    p.stateTimer = kickData.duration;
    p.vx = p.facing * 4.0;

    audio.playKick();
    this.executeAttackHit(kickData);
  }

  triggerActionSpecial() {
    const p = this.player;
    if (p.sp < p.config.specialCost || p.state === 'hurt' || p.state === 'down') return;

    p.sp -= p.config.specialCost;
    this.updateHUDSp();

    const superData = p.config.superMove;
    p.state = 'special';
    p.stateTimer = superData.duration;
    p.isInvulnerable = true;
    p.invulnTimer = superData.duration;
    this.screenShake = superData.screenShake;

    audio.playSuperAttack();

    for (let i = 0; i < 26; i++) {
      const angle = (i / 26) * Math.PI * 2;
      this.particles.push({
        x: p.x,
        y: p.y - 30,
        vx: Math.cos(angle) * (6 + Math.random() * 4),
        vy: Math.sin(angle) * (4 + Math.random() * 2),
        color: '#facc15',
        size: 5 + Math.random() * 4,
        life: 25
      });
    }

    this.executeAttackHit(superData, true);
  }

  triggerActionDash() {
    const p = this.player;
    if (p.dashCooldown > 0 || p.state === 'hurt' || p.state === 'down') return;

    p.state = 'dash';
    p.stateTimer = 14;
    p.dashCooldown = 30;
    p.isInvulnerable = true;
    p.invulnTimer = 14;

    const dashSpeed = p.config.speed * 2.2;
    const dirX = this.input.x !== 0 ? Math.sign(this.input.x) : p.facing;
    const dirY = this.input.y;

    p.vx = dirX * dashSpeed;
    p.vy = dirY * dashSpeed;
    p.facing = dirX;

    audio.playDash();

    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: p.x - dirX * 15,
        y: p.y - 20 + (Math.random() * 30 - 15),
        vx: -dirX * 2,
        vy: 0,
        color: '#a855f7',
        size: 4,
        life: 15
      });
    }
  }

  executeAttackHit(hitData, isAreaOfEffect = false) {
    const p = this.player;
    let connected = false;

    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0 || enemy.isKnockedDown) return;

      const dx = enemy.x - p.x;
      const dy = Math.abs(enemy.y - p.y);

      const inFacingDir = isAreaOfEffect ? true : (dx * p.facing > 0);
      const inXRange = Math.abs(dx) <= hitData.range;
      const inYDepth = dy <= (hitData.reachY || 20);

      if (inFacingDir && inXRange && inYDepth) {
        connected = true;
        const damage = hitData.damage;
        enemy.hp -= damage;

        this.screenShake = hitData.knockdown ? 6 : 2;
        audio.playHitImpact(hitData.knockdown);

        for (let i = 0; i < 10; i++) {
          this.particles.push({
            x: enemy.x,
            y: enemy.y - 35,
            vx: (Math.random() - 0.5) * 8 + p.facing * 3,
            vy: (Math.random() - 0.5) * 8,
            color: hitData.knockdown ? '#f97316' : '#fef08a',
            size: 3 + Math.random() * 4,
            life: 16
          });
        }

        this.damageTexts.push({
          x: enemy.x + (Math.random() * 20 - 10),
          y: enemy.y - 50,
          text: `-${damage}`,
          color: hitData.knockdown ? '#f97316' : '#facc15',
          life: 28
        });

        this.score += damage * 10;
        this.combo++;
        this.comboTimer = 75;
        this.updateHUDScore();
        this.updateComboHUD();

        p.sp = Math.min(p.maxSp, p.sp + 4);
        this.updateHUDSp();

        if (enemy.hp <= 0) {
          this.onEnemyDefeated(enemy);
        } else if (hitData.knockdown) {
          enemy.isKnockedDown = true;
          enemy.downTimer = 55;
          enemy.vx = p.facing * 5.5;
          enemy.vy = -2.5;
          enemy.state = 'down';
        } else {
          enemy.state = 'hurt';
          enemy.stateTimer = hitData.stun || 15;
          enemy.vx = p.facing * 2.0;
        }
      }
    });

    if (connected && hitData.knockdown) {
      audio.playKnockdown();
    }
  }

  onEnemyDefeated(enemy) {
    enemy.hp = 0;
    enemy.state = 'dead';
    this.score += enemy.config.scoreValue;
    this.player.killsThisStage++;
    this.enemiesRemainingInStage = Math.max(0, this.enemiesRemainingInStage - 1);

    // Dropped Gun or Weapon Chance!
    // Cyber Enforcers always drop gun, others have a 40% chance
    if (enemy.typeKey === 'cyber_soldier' || Math.random() < 0.40) {
      this.droppedItems.push({
        id: Math.random().toString(36).substr(2, 9),
        type: 'gun_pistol',
        name: '9MM PISTOL',
        ammo: 10 + Math.floor(Math.random() * 6),
        x: enemy.x,
        y: enemy.y
      });
    }

    this.updateHUDStage();
    this.updateHUDScore();

    for (let i = 0; i < 18; i++) {
      this.particles.push({
        x: enemy.x,
        y: enemy.y - 30,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.5) * 9,
        color: '#ef4444',
        size: 4 + Math.random() * 4,
        life: 26
      });
    }

    setTimeout(() => {
      this.checkStageProgress();
    }, 500);
  }

  checkStageProgress() {
    const aliveEnemies = this.enemies.filter(e => e.hp > 0);
    if (aliveEnemies.length === 0) {
      if (this.activeWaveIndex < this.currentStage.waves.length) {
        document.getElementById('go-banner').classList.remove('hidden');
      } else {
        document.getElementById('go-banner').classList.add('hidden');
        this.onStageCleared();
      }
    }
  }

  onStageCleared() {
    if (this.isStageClearing) return;
    this.isStageClearing = true;

    audio.playStageClear();

    if (this.currentStage.unlockReward && !this.unlockedChars.includes(this.currentStage.unlockReward)) {
      this.unlockedChars.push(this.currentStage.unlockReward);
      this.saveProgress();
    }

    setTimeout(() => {
      const modal = document.getElementById('game-modal');
      const headline = document.getElementById('modal-headline');
      const desc = document.getElementById('modal-desc');
      const killsText = document.getElementById('modal-stat-kills');
      const scoreText = document.getElementById('modal-stat-score');
      const stageText = document.getElementById('modal-stat-stage');
      const actionBtn = document.getElementById('btn-modal-action');

      headline.textContent = 'STAGE CLEAR!';
      desc.textContent = `Sector secured! Moving smoothly to next level...`;
      if (this.currentStage.unlockReward) {
        const unlockedFighter = CHARACTERS[this.currentStage.unlockReward];
        desc.textContent = `NEW FIGHTER UNLOCKED: ${unlockedFighter.name} (${unlockedFighter.title})!`;
      }

      killsText.textContent = this.player.killsThisStage;
      scoreText.textContent = this.score;
      stageText.textContent = this.currentStage.subtitle;
      actionBtn.textContent = (this.currentLevelIndex + 1 >= LEVELS.length) ? 'VICTORY - RESTART' : 'PROCEED TO NEXT STAGE';

      modal.classList.remove('hidden');
    }, 1200);
  }

  onPlayerGameOver() {
    this.isGameOver = true;
    const modal = document.getElementById('game-modal');
    const headline = document.getElementById('modal-headline');
    const desc = document.getElementById('modal-desc');
    const killsText = document.getElementById('modal-stat-kills');
    const scoreText = document.getElementById('modal-stat-score');
    const stageText = document.getElementById('modal-stat-stage');
    const actionBtn = document.getElementById('btn-modal-action');

    headline.textContent = 'GAME OVER';
    desc.textContent = 'You were overwhelmed! Press button below to retry.';
    killsText.textContent = this.player.killsThisStage;
    scoreText.textContent = this.score;
    stageText.textContent = this.currentStage.subtitle;
    actionBtn.textContent = 'RETRY STAGE 1';

    modal.classList.remove('hidden');
  }

  // ================= UPDATE LOOP =================
  update(delta) {
    if (this.isPaused || this.isGameOver) return;

    if (this.screenShake > 0) {
      this.screenShake -= 0.6;
      if (this.screenShake < 0) this.screenShake = 0;
    }

    if (this.comboTimer > 0) {
      this.comboTimer--;
      if (this.comboTimer === 0) {
        this.combo = 0;
        this.updateComboHUD();
      }
    }

    this.updatePlayer(delta);
    this.updateEnemies(delta);
    this.updateBullets();
    this.updateDroppedItemsPrompt();
    this.updateVisualEffects();
    this.updateCamera();
    this.checkWaveSpawns();
  }

  updatePlayer(delta) {
    const p = this.player;

    if (p.invulnTimer > 0) {
      p.invulnTimer--;
      if (p.invulnTimer <= 0) p.isInvulnerable = false;
    }

    if (p.dashCooldown > 0) p.dashCooldown--;
    if (p.comboWindow > 0) p.comboWindow--;

    if (p.stateTimer > 0) {
      p.stateTimer--;
      if (p.stateTimer <= 0) p.state = 'idle';
    }

    if (p.state === 'idle' || p.state === 'walk') {
      const speed = p.config.speed;
      p.vx = this.input.x * speed;
      p.vy = this.input.y * speed;

      if (this.input.x !== 0) p.facing = Math.sign(this.input.x);
      p.state = (Math.hypot(p.vx, p.vy) > 0.1) ? 'walk' : 'idle';
    } else if (p.state === 'dash') {
      p.vx *= 0.90;
      p.vy *= 0.90;
    } else {
      p.vx *= 0.80;
      p.vy *= 0.80;
    }

    p.x += p.vx;
    p.y += p.vy;

    const minY = this.currentStage.floorY;
    const maxY = this.currentStage.floorY + this.currentStage.floorHeight;
    p.y = Math.max(minY, Math.min(maxY, p.y));

    const minX = Math.max(30, this.cameraX + 30);
    const maxX = Math.min(this.currentStage.arenaWidth - 30, this.cameraX + this.viewWidth - 30);
    p.x = Math.max(minX, Math.min(maxX, p.x));
  }

  updateEnemies(delta) {
    const p = this.player;

    this.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;

      if (enemy.isKnockedDown) {
        enemy.downTimer--;
        enemy.x += enemy.vx;
        enemy.vx *= 0.85;
        if (enemy.downTimer <= 0) {
          enemy.isKnockedDown = false;
          enemy.state = 'walk';
        }
        return;
      }

      if (enemy.stateTimer > 0) {
        enemy.stateTimer--;
        enemy.x += enemy.vx;
        enemy.vx *= 0.85;
        if (enemy.stateTimer <= 0) enemy.state = 'walk';
        return;
      }

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      enemy.facing = dx >= 0 ? 1 : -1;

      // Mercenary firearm shooting AI
      if (enemy.typeKey === 'cyber_soldier') {
        enemy.shootCooldown--;
        if (enemy.shootCooldown <= 0 && Math.abs(dx) > 120 && Math.abs(dy) < 35) {
          enemy.shootCooldown = 110 + Math.random() * 40;
          enemy.state = 'shoot';
          enemy.stateTimer = 20;

          audio.playGunshot();
          this.bullets.push({
            x: enemy.x + enemy.facing * 35,
            y: enemy.y - 45,
            vx: enemy.facing * 14,
            isPlayerBullet: false,
            damage: 24,
            life: 60
          });
          return;
        }
      }

      if (enemy.attackCooldown > 0) enemy.attackCooldown--;

      const reachX = enemy.config.reachX || 35;
      const reachY = enemy.config.reachY || 15;

      if (Math.abs(dx) <= reachX && Math.abs(dy) <= reachY && enemy.attackCooldown <= 0) {
        enemy.state = 'attack';
        enemy.stateTimer = 22;
        enemy.attackCooldown = enemy.config.attackCooldown || 60;

        setTimeout(() => {
          if (enemy.hp > 0 && !enemy.isKnockedDown && !p.isInvulnerable) {
            const currentDx = Math.abs(p.x - enemy.x);
            const currentDy = Math.abs(p.y - enemy.y);
            if (currentDx <= reachX + 15 && currentDy <= reachY + 10) {
              this.damagePlayer(enemy.config.attackPower);
            }
          }
        }, 180);
      } else {
        const speed = enemy.config.speed;
        const targetX = p.x - enemy.facing * (reachX - 5);
        const targetY = p.y;

        const moveDx = targetX - enemy.x;
        const moveDy = targetY - enemy.y;
        const moveLen = Math.hypot(moveDx, moveDy);

        if (moveLen > 5) {
          enemy.vx = (moveDx / moveLen) * speed;
          enemy.vy = (moveDy / moveLen) * (speed * 0.7);
        } else {
          enemy.vx = 0;
          enemy.vy = 0;
        }

        enemy.x += enemy.vx;
        enemy.y += enemy.vy;

        const minY = this.currentStage.floorY;
        const maxY = this.currentStage.floorY + this.currentStage.floorHeight;
        enemy.y = Math.max(minY, Math.min(maxY, enemy.y));
      }
    });
  }

  updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.life--;

      if (b.isPlayerBullet) {
        // Bullet hit check against enemies
        for (let j = 0; j < this.enemies.length; j++) {
          const e = this.enemies[j];
          if (e.hp > 0 && !e.isKnockedDown) {
            if (Math.abs(b.x - e.x) < 30 && Math.abs(b.y - (e.y - 45)) < 35) {
              e.hp -= b.damage;
              e.isKnockedDown = true;
              e.downTimer = 45;
              e.vx = Math.sign(b.vx) * 6;
              e.state = 'down';
              audio.playHitImpact(true);
              this.screenShake = 6;

              this.damageTexts.push({
                x: e.x,
                y: e.y - 50,
                text: `-${b.damage} CRIT!`,
                color: '#f97316',
                life: 30
              });

              if (e.hp <= 0) this.onEnemyDefeated(e);
              this.bullets.splice(i, 1);
              break;
            }
          }
        }
      } else {
        // Enemy bullet hit check against player
        const p = this.player;
        if (!p.isInvulnerable && Math.abs(b.x - p.x) < 25 && Math.abs(b.y - (p.y - 45)) < 30) {
          this.damagePlayer(b.damage);
          this.bullets.splice(i, 1);
          continue;
        }
      }

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  updateDroppedItemsPrompt() {
    const p = this.player;
    let nearbyItem = null;

    for (let i = 0; i < this.droppedItems.length; i++) {
      const item = this.droppedItems[i];
      if (Math.hypot(p.x - item.x, p.y - item.y) < 70) {
        nearbyItem = item;
        break;
      }
    }

    const prompt = document.getElementById('pickup-prompt');
    const grabBtn = document.getElementById('btn-grab');

    if (nearbyItem) {
      prompt.classList.remove('hidden');
      document.getElementById('pickup-text').textContent = `GRAB ${nearbyItem.name}`;
      grabBtn.classList.add('active-grab');
    } else {
      prompt.classList.add('hidden');
      grabBtn.classList.remove('active-grab');
    }
  }

  damagePlayer(damage) {
    const p = this.player;
    if (p.isInvulnerable || this.isStageClearing || this.isGameOver) return;

    p.hp = Math.max(0, p.hp - damage);
    p.state = 'hurt';
    p.stateTimer = 16;
    p.isInvulnerable = true;
    p.invulnTimer = 26;
    this.screenShake = 8;

    this.combo = 0;
    this.updateComboHUD();
    this.updateHUDHp();
    audio.playHitImpact(true);

    if (p.hp <= 0) {
      this.onPlayerGameOver();
    }
  }

  updateCamera() {
    const aliveEnemies = this.enemies.filter(e => e.hp > 0);
    const rightEdge = this.cameraX + this.viewWidth * 0.65;

    if (aliveEnemies.length === 0 && this.player.x > rightEdge) {
      this.cameraTargetX = Math.min(
        this.currentStage.arenaWidth - this.viewWidth,
        this.player.x - this.viewWidth * 0.65
      );
    }
    this.cameraX += (this.cameraTargetX - this.cameraX) * 0.08;
  }

  updateVisualEffects() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const dt = this.damageTexts[i];
      dt.y -= 0.8;
      dt.life--;
      if (dt.life <= 0) this.damageTexts.splice(i, 1);
    }
  }

  // ================= REALISTIC RENDERING =================
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.scale(this.scaleX, this.scaleY);

    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 2;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. Realistic Background
    this.drawRealisticBackground();

    // 2. Dropped Weapons on the Floor
    this.drawDroppedItems();

    // 3. Depth-Sorted Entities (Player & Enemies)
    const entities = [
      { type: 'player', y: this.player.y, ref: this.player },
      ...this.enemies.map(e => ({ type: 'enemy', y: e.y, ref: e }))
    ];
    entities.sort((a, b) => a.y - b.y);

    entities.forEach(ent => {
      if (ent.type === 'player') {
        this.drawRealisticPlayer(ent.ref);
      } else {
        this.drawRealisticEnemy(ent.ref);
      }
    });

    // 4. Bullets & Muzzle Trails
    this.drawBullets();

    // 5. Particles & Damage Numbers
    this.drawParticles();
    this.drawDamageTexts();

    this.ctx.restore();
  }

  drawRealisticBackground() {
    const stage = this.currentStage;
    const cam = this.cameraX;

    // Use Photorealistic Rooftop background if Stage 3 (Rooftop Terrace)
    if (stage.theme === 'rooftop_terrace' && ASSETS.bgRooftop.complete && ASSETS.bgRooftop.naturalWidth > 0) {
      // Draw Parallax Tiled Realistic Rooftop Texture
      const bgW = this.viewWidth * 1.5;
      const bgH = this.viewHeight;
      const bgOffset = (cam * 0.45) % bgW;

      this.ctx.drawImage(ASSETS.bgRooftop, -bgOffset, 0, bgW, bgH);
      this.ctx.drawImage(ASSETS.bgRooftop, bgW - bgOffset, 0, bgW, bgH);

      // Ambient dusk tint
      this.ctx.fillStyle = 'rgba(234, 88, 12, 0.08)';
      this.ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
      return;
    }

    // Use Photorealistic Street background for other urban alley stages
    if (ASSETS.bgStreet.complete && ASSETS.bgStreet.naturalWidth > 0) {
      const bgW = this.viewWidth * 1.4;
      const bgH = this.viewHeight;
      const bgOffset = (cam * 0.45) % bgW;

      this.ctx.drawImage(ASSETS.bgStreet, -bgOffset, 0, bgW, bgH);
      this.ctx.drawImage(ASSETS.bgStreet, bgW - bgOffset, 0, bgW, bgH);

      this.ctx.fillStyle = stage.ambientColor || 'rgba(0,0,0,0.1)';
      this.ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);
      return;
    }

    // High Quality Fallback Gradient & Silhouettes
    const sky = this.ctx.createLinearGradient(0, 0, 0, this.viewHeight);
    sky.addColorStop(0, stage.skyGradient[0]);
    sky.addColorStop(0.5, stage.skyGradient[1]);
    sky.addColorStop(1, stage.skyGradient[2]);
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, this.viewWidth, this.viewHeight);

    this.ctx.fillStyle = stage.groundColor;
    this.ctx.fillRect(0, stage.floorY, this.viewWidth, stage.floorHeight);
  }

  drawDroppedItems() {
    this.droppedItems.forEach(item => {
      const sx = item.x - this.cameraX;
      const sy = item.y;

      this.ctx.save();
      this.ctx.translate(sx, sy);

      // Rotating holographic golden ring
      const time = Date.now() * 0.003;
      this.ctx.strokeStyle = '#facc15';
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = '#facc15';
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, 24, 9, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      // Gun Sprite or Icon
      if (ASSETS.gunPickup.complete && ASSETS.gunPickup.naturalWidth > 0) {
        this.ctx.drawImage(ASSETS.gunPickup, -24, -20, 48, 28);
      } else {
        // Fallback metal gun drawing
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(-12, -10, 24, 7);
        this.ctx.fillRect(-10, -5, 7, 10);
      }

      this.ctx.restore();
    });
  }

  drawRealisticPlayer(p) {
    const screenX = p.x - this.cameraX;
    const screenY = p.y;
    const facing = p.facing;

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.scale(facing, 1);

    // Realistic shadow on ground
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 28, 9, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (p.isInvulnerable && Math.floor(p.invulnTimer / 3) % 2 === 0) {
      this.ctx.globalAlpha = 0.4;
    }

    // Determine Sprite Frame from realistic sprite sheet
    // Frame 0: Idle/Walk, Frame 1: Punch, Frame 2: Kick, Frame 3: Shoot
    let frameIdx = 0;
    if (p.state === 'attackA') frameIdx = 1;
    else if (p.state === 'attackB') frameIdx = 2;
    else if (p.state === 'shoot') frameIdx = 3;

    if (ASSETS.heroSprites.complete && ASSETS.heroSprites.naturalWidth > 0) {
      const sw = ASSETS.heroSprites.naturalWidth / 4;
      const sh = ASSETS.heroSprites.naturalHeight;
      const sx = frameIdx * sw;

      const drawW = 105;
      const drawH = 125;
      this.ctx.drawImage(ASSETS.heroSprites, sx, 0, sw, sh, -drawW * 0.45, -drawH + 10, drawW, drawH);
    } else {
      // Fallback anatomy rendering
      this.drawProceduralHuman(p.config.colorScheme, p.state, facing);
    }

    this.ctx.restore();
  }

  drawRealisticEnemy(enemy) {
    if (enemy.hp <= 0 && enemy.state !== 'dead') return;

    const screenX = enemy.x - this.cameraX;
    const screenY = enemy.y;
    const scale = enemy.config.scale || 1.0;
    const facing = enemy.facing;

    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.scale(facing * scale, scale);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 26 * scale, 8 * scale, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (enemy.isKnockedDown) {
      // Fallen on back
      this.ctx.rotate(enemy.facing * -0.5);
    }

    // Map enemy archetype to realistic sprite frame:
    // Frame 0: Punk Thug with Pipe, Frame 1: Heavy Bald Bruiser, Frame 2: Armed Syndicate Enforcer
    let frameIdx = 0;
    if (enemy.typeKey === 'heavy_crusher') frameIdx = 1;
    else if (enemy.typeKey === 'cyber_soldier' || enemy.typeKey === 'warlord_malakai') frameIdx = 2;

    if (ASSETS.enemySprites.complete && ASSETS.enemySprites.naturalWidth > 0) {
      const sw = ASSETS.enemySprites.naturalWidth / 3;
      const sh = ASSETS.enemySprites.naturalHeight;
      const sx = frameIdx * sw;

      const drawW = 100 * scale;
      const drawH = 125 * scale;
      this.ctx.drawImage(ASSETS.enemySprites, sx, 0, sw, sh, -drawW * 0.45, -drawH + 10, drawW, drawH);
    } else {
      this.drawProceduralHuman(enemy.config.colors, enemy.state, facing);
    }

    this.ctx.restore();

    // Health Bar above enemy head
    this.drawEnemyHealthBar(enemy, screenX, screenY - 110 * scale);
  }

  drawProceduralHuman(c, state, facing) {
    const walkBob = state === 'walk' ? Math.sin(Date.now() * 0.015) * 4 : 0;
    this.ctx.fillStyle = c.pants || '#334155';
    this.ctx.fillRect(-12, -40, 11, 40);
    this.ctx.fillRect(2, -40, 11, 40);

    this.ctx.fillStyle = c.vest || c.jacket || '#dc2626';
    this.ctx.fillRect(-14, -72 + walkBob, 28, 35);

    this.ctx.fillStyle = c.head || '#e0ac69';
    this.ctx.fillRect(-10, -96 + walkBob, 20, 24);

    this.ctx.fillStyle = c.hair || '#3e2723';
    this.ctx.fillRect(-12, -102 + walkBob, 24, 12);
  }

  drawBullets() {
    this.bullets.forEach(b => {
      const sx = b.x - this.cameraX;
      const sy = b.y;

      this.ctx.save();
      // Glowing yellow bullet streak
      this.ctx.fillStyle = b.isPlayerBullet ? '#fde047' : '#ef4444';
      this.ctx.shadowColor = b.isPlayerBullet ? '#facc15' : '#ef4444';
      this.ctx.shadowBlur = 10;
      this.ctx.fillRect(sx, sy - 2, 14 * Math.sign(b.vx), 4);
      this.ctx.restore();
    });
  }

  drawEnemyHealthBar(enemy, x, y) {
    const width = 48;
    const height = 5;
    const hpPercent = Math.max(0, enemy.hp / enemy.maxHp);

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    this.ctx.fillRect(x - width / 2, y, width, height);

    this.ctx.fillStyle = hpPercent > 0.4 ? '#ef4444' : '#f97316';
    this.ctx.fillRect(x - width / 2, y, width * hpPercent, height);

    this.ctx.strokeStyle = '#374151';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - width / 2, y, width, height);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 11px Rajdhani';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(enemy.name, x, y - 3);
  }

  drawParticles() {
    this.particles.forEach(pt => {
      this.ctx.fillStyle = pt.color;
      this.ctx.fillRect(pt.x - this.cameraX, pt.y, pt.size, pt.size);
    });
  }

  drawDamageTexts() {
    this.damageTexts.forEach(dt => {
      this.ctx.fillStyle = dt.color;
      this.ctx.font = 'bold 16px Bungee';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(dt.text, dt.x - this.cameraX, dt.y);
    });
  }

  // ================= UI & WEAPON HUD =================
  updateHUDProfile() {
    const config = this.player.config;
    document.getElementById('hud-char-name').textContent = config.name;
    document.getElementById('hud-char-lvl').textContent = `LV ${this.currentLevelIndex + 1}`;
    this.updateHUDHp();
    this.updateHUDSp();
  }

  updateHUDHp() {
    const pct = Math.max(0, Math.round((this.player.hp / this.player.maxHp) * 100));
    const bar = document.getElementById('hud-hp-bar');
    bar.style.width = `${pct}%`;
    document.getElementById('hud-hp-text').textContent = `${pct}%`;

    if (pct < 30) {
      bar.style.background = '#ef4444';
    } else if (pct < 60) {
      bar.style.background = 'linear-gradient(90deg, #f59e0b, #eab308)';
    } else {
      bar.style.background = 'linear-gradient(90deg, #22c55e 0%, #a3e635 80%, #facc15 100%)';
    }
  }

  updateHUDSp() {
    const pct = (this.player.sp / this.player.maxSp) * 100;
    document.getElementById('hud-sp-bar').style.width = `${pct}%`;
  }

  updateWeaponHUD() {
    const badge = document.getElementById('weapon-badge');
    const btnA = document.getElementById('btn-attack-a');
    const btnText = document.getElementById('btn-a-text');
    const p = this.player;

    if (p.weapon && p.weapon.ammo > 0) {
      badge.classList.remove('hidden');
      document.getElementById('weapon-name').textContent = p.weapon.name;
      document.getElementById('ammo-count').textContent = `${p.weapon.ammo} / ${p.weapon.maxAmmo}`;

      // Change button A to FIRE
      btnA.classList.add('has-gun');
      btnText.textContent = 'SHOOT';
    } else {
      badge.classList.add('hidden');
      btnA.classList.remove('has-gun');
      btnText.textContent = 'PUNCH';
    }
  }

  updateHUDScore() {
    const s = String(this.score).padStart(6, '0');
    document.getElementById('hud-score').textContent = `SCORE: ${s}`;
  }

  updateHUDStage() {
    document.getElementById('hud-stage-name').textContent = `${this.currentStage.title}: ${this.currentStage.subtitle}`;
    const total = this.currentStage.waves.reduce((sum, w) => sum + w.enemies.length, 0);
    const defeated = total - this.enemiesRemainingInStage;
    document.getElementById('hud-enemy-count').textContent = `HOSTILES: ${defeated} / ${total}`;
  }

  updateComboHUD() {
    const box = document.getElementById('combo-display');
    const num = document.getElementById('combo-num');

    if (this.combo >= 2) {
      box.classList.remove('hidden');
      num.textContent = `x${this.combo}`;
      box.style.animation = 'none';
      box.offsetHeight;
      box.style.animation = 'pulseCombo 0.25s ease-out';
    } else {
      box.classList.add('hidden');
    }
  }

  openRosterModal() {
    const modal = document.getElementById('roster-modal');
    const list = document.getElementById('roster-list');
    list.innerHTML = '';

    Object.values(CHARACTERS).forEach(char => {
      const isUnlocked = this.unlockedChars.includes(char.id);
      const isCurrent = this.selectedCharId === char.id;

      const card = document.createElement('div');
      card.className = `roster-card ${isCurrent ? 'active' : ''} ${isUnlocked ? '' : 'locked'}`;

      card.innerHTML = `
        <div class="roster-avatar">${char.name[0]}</div>
        <div class="roster-info">
          <div class="roster-name">${char.name} ${isCurrent ? '★ (EQUIPPED)' : ''}</div>
          <div class="roster-type">${char.title} ${isUnlocked ? '' : `• [Unlocked at Stage ${char.unlockedAtStage}]`}</div>
          <div class="roster-stats">
            <span>HP: ${char.maxHp}</span>
            <span>SPD: ${char.speed}</span>
            <span>ATK: ${char.attackPower}</span>
          </div>
        </div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          this.selectedCharId = char.id;
          this.saveProgress();
          this.initPlayer();
          modal.classList.add('hidden');
        });
      }

      list.appendChild(card);
    });

    modal.classList.remove('hidden');
  }

  // ================= MAIN GAME LOOP =================
  gameLoop(timestamp) {
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(delta);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Start Game Engine when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new GameEngine();
});
