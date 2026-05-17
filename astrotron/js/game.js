class AstrotronGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.elements = {
      startScreen: document.getElementById("startScreen"),
      cutsceneScreen: document.getElementById("cutsceneScreen"),
      stationScreen: document.getElementById("stationScreen"),
      upgradeScreen: document.getElementById("upgradeScreen"),
      gameOverScreen: document.getElementById("gameOverScreen"),
      sectorLoadScreen: document.getElementById("sectorLoadScreen"),

      startBtn: document.getElementById("startBtn"),
      restartBtn: document.getElementById("restartBtn"),
      skipCutsceneBtn: document.getElementById("skipCutsceneBtn"),
      nextDialogueBtn: document.getElementById("nextDialogueBtn"),

      repairBtn: document.getElementById("repairBtn"),
      stationUpgradeBtn: document.getElementById("stationUpgradeBtn"),
      continueMissionBtn: document.getElementById("continueMissionBtn"),

      upgradeCards: document.getElementById("upgradeCards"),

      scoreValue: document.getElementById("scoreValue"),
      waveValue: document.getElementById("waveValue"),
      levelValue: document.getElementById("levelValue"),
      hullBar: document.getElementById("hullBar"),
      xpBar: document.getElementById("xpBar"),
      oxygenBar: document.getElementById("oxygenBar"),
      missionText: document.getElementById("missionText"),
      sectorLoadText: document.getElementById("sectorLoadText"),
      interfaceCreditsValue: document.getElementById("interfaceCreditsValue"),
      upgradeCreditsValue: document.getElementById("upgradeCreditsValue"),

      finalScore: document.getElementById("finalScore"),
      highScore: document.getElementById("highScore"),

      cutsceneChapter: document.getElementById("cutsceneChapter"),
      cutscenePlace: document.getElementById("cutscenePlace"),
      speakerName: document.getElementById("speakerName"),
      dialogueText: document.getElementById("dialogueText"),
      cutscenePortraitImage: document.querySelector(".cutscene-nyx-image"),

      stationName: document.getElementById("stationName"),
      stationDescription: document.getElementById("stationDescription")
    };

    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.state = "menu";
    document.body.classList.add("menu-mode");
    this.keys = {};
    this.background = new StarField();

    this.player = null;
    this.bullets = [];
    this.asteroids = [];
    this.debris = [];
    this.centipedes = [];
    this.enemyShips = [];
    this.enemyBullets = [];
    this.laserSweeps = [];
    this.orbitalTurrets = [];
    this.turretBullets = [];
    this.particles = [];

    this.phaseTwoEnemyTimer = 0;
    this.phaseTwoEnemiesSpawned = false;
    this.centipedeSpawnQueue = [];
    this.centipedeWaveTimer = 0;
    this.centipedeAttachCount = 0;

    this.stageTransition = null;
    this.fadeAlpha = 0;
    this.fadeHoldTimer = 0;
    this.cockpitHeight = 154;
    this.playHeight = 360;
    this.isPreloadingSector = false;

    this.score = 0;
    this.wave = 0;
    this.currentPhase = 1;
    this.xp = 0;
    this.xpGoal = GAME_CONFIG.progression.firstXpGoal;
    this.oxygen = 100;

    this.time = 0;
    this.lastFrame = 0;

    this.currentCutscene = null;
    this.currentDialogueIndex = 0;
    this.cutsceneCallback = null;
    this.phaseTwoCutscenePlayed = false;

    this.bindEvents();
    this.resize();
    this.updateUI();

    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  bindEvents() {
    window.addEventListener("resize", () => this.resize());

    window.addEventListener("keydown", (event) => {
      const gameplayKeys = [
        "Space",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "KeyW",
        "KeyA",
        "KeyS",
        "KeyD",
        "Enter"
      ];

      if (gameplayKeys.includes(event.code)) {
        event.preventDefault();
      }

      this.keys[event.code] = true;

      if (event.code === "Enter" && this.state === "menu") {
        this.startGame();
      }

      if (event.code === "Enter" && this.state === "cutscene") {
        this.nextDialogue();
      }

      if (event.code === "KeyR" && this.state === "gameover") {
        this.startGame();
      }

      if (event.key === "´" || event.key === "`" || event.code === "Backquote") {
        event.preventDefault();
        this.skipPhase();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys[event.code] = false;
    });

    this.elements.startBtn.addEventListener("click", () => this.startGame());
    this.elements.restartBtn.addEventListener("click", () => this.startGame());
    this.elements.nextDialogueBtn.addEventListener("click", () => this.nextDialogue());
    this.elements.skipCutsceneBtn.addEventListener("click", () => this.finishCutscene());
    this.elements.repairBtn.addEventListener("click", () => this.repairShip());
    this.elements.stationUpgradeBtn.addEventListener("click", () => this.openUpgradeScreen("station"));
    this.elements.continueMissionBtn.addEventListener("click", () => this.leaveStation());
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();

    this.width = Math.max(320, rect.width);
    this.height = Math.max(360, rect.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cockpitHeight = window.innerWidth <= 560 ? 410 : window.innerWidth <= 980 ? 270 : 154;
    this.playHeight = Math.max(300, this.height - this.cockpitHeight - 34);

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.background.resize(this.width, this.height);

    if (this.player) {
      this.player.x = Utils.clamp(this.player.x, 0, this.width);
      this.player.y = Utils.clamp(this.player.y, 0, this.playHeight);
      this.keepPlayerInsideFlightZone();
    }
  }

  startGame() {
    document.body.classList.remove("menu-mode");
    this.state = "cutscene";
    this.score = 0;
    this.wave = 0;
    this.currentPhase = 1;
    this.phaseTwoCutscenePlayed = false;
    this.xp = 0;
    this.xpGoal = GAME_CONFIG.progression.firstXpGoal;
    this.oxygen = 100;
    this.time = 0;

    this.player = new Player(this.width / 2, this.playHeight / 2);
    this.bullets = [];
    this.asteroids = [];
    this.debris = [];
    this.centipedes = [];
    this.enemyShips = [];
    this.enemyBullets = [];
    this.laserSweeps = [];
    this.orbitalTurrets = [];
    this.turretBullets = [];
    this.particles = [];

    this.phaseTwoEnemyTimer = 0;
    this.phaseTwoEnemiesSpawned = false;
    this.centipedeSpawnQueue = [];
    this.centipedeWaveTimer = 0;
    this.centipedeAttachCount = 0;

    this.hideAllScreens();
    this.elements.startScreen.classList.add("hidden");
    this.setMission("Transmissão de Bluenyx, codinome Nyx, sendo restaurada.");

    this.playCutscene(STORY.intro, () => {
      this.state = "playing";
      this.startNextWave();
    });

    this.updateUI();
  }

  hideAllScreens() {
    this.elements.cutsceneScreen.classList.add("hidden");
    this.elements.stationScreen.classList.add("hidden");
    this.elements.upgradeScreen.classList.add("hidden");
    this.elements.gameOverScreen.classList.add("hidden");
    this.elements.sectorLoadScreen.classList.add("hidden");
  }

  playCutscene(cutscene, callback) {
    this.state = "cutscene";
    document.body.classList.add("cinematic-mode");
    this.currentCutscene = cutscene;
    this.currentDialogueIndex = 0;
    this.cutsceneCallback = callback;

    this.elements.cutsceneChapter.textContent = cutscene.chapter;
    this.elements.cutscenePlace.textContent = cutscene.place;

    this.hideAllScreens();
    this.elements.cutsceneScreen.classList.remove("hidden");
    this.showDialogueLine();
  }

  showDialogueLine() {
    const line = this.currentCutscene.lines[this.currentDialogueIndex];

    this.elements.speakerName.textContent = line.speaker;
    this.elements.dialogueText.textContent = line.text;

    if (this.elements.cutscenePortraitImage) {
      const portrait = this.getPortraitForSpeaker(line.speaker);
      this.elements.cutscenePortraitImage.src = portrait.src;
      this.elements.cutscenePortraitImage.alt = portrait.alt;
    }
  }

  getPortraitForSpeaker(speaker) {
    const name = (speaker || "").toLowerCase();

    if (name.includes("mecânico")) {
      return {
        src: IMAGE_ASSETS.mechanicPortrait || IMAGE_ASSETS.nyxPortrait,
        alt: "Retrato do mecânico do posto"
      };
    }

    if (name.includes("ia")) {
      return {
        src: IMAGE_ASSETS.aiPortrait || IMAGE_ASSETS.nyxPortrait,
        alt: "Interface da IA policial da ASTROTRON"
      };
    }

    return {
      src: IMAGE_ASSETS.nyxPortrait,
      alt: "Retrato de Bluenyx Varela"
    };
  }

  nextDialogue() {
    if (this.state !== "cutscene") {
      return;
    }

    this.currentDialogueIndex += 1;

    if (this.currentDialogueIndex >= this.currentCutscene.lines.length) {
      this.finishCutscene();
      return;
    }

    this.showDialogueLine();
  }

  finishCutscene() {
    const callback = this.cutsceneCallback;

    this.currentCutscene = null;
    this.currentDialogueIndex = 0;
    this.cutsceneCallback = null;

    if (callback) {
      this.preloadSectorThenRun(callback);
    } else {
      this.elements.cutsceneScreen.classList.add("hidden");
      document.body.classList.remove("cinematic-mode");
    }
  }

  preloadSectorThenRun(callback) {
    if (this.isPreloadingSector) {
      return;
    }

    this.isPreloadingSector = true;
    const targetPhase = this.wave >= 3 ? 3 : Math.max(1, this.wave || 1);

    this.elements.sectorLoadText.textContent = `Carregando setor ${targetPhase}: mapa, meteoros, inimigos e telemetria.`;
    this.elements.sectorLoadScreen.classList.remove("hidden");

    this.preloadPhaseAssets(targetPhase).then(() => {
      this.elements.cutsceneScreen.classList.add("hidden");

      window.setTimeout(() => {
        this.elements.sectorLoadScreen.classList.add("hidden");
        document.body.classList.remove("cinematic-mode");
        this.startScreenFade(0.9);
        this.isPreloadingSector = false;
        callback();
      }, 420);
    });
  }

  preloadPhaseAssets(phase) {
    const sources = new Set();

    if (IMAGE_ASSETS.backgrounds) {
      if (phase === 1) sources.add(IMAGE_ASSETS.backgrounds.phaseOne);
      if (phase === 2) sources.add(IMAGE_ASSETS.backgrounds.phaseTwo);
      if (phase >= 3) sources.add(IMAGE_ASSETS.backgrounds.phaseThree);
    }

    [
      IMAGE_ASSETS.player,
      IMAGE_ASSETS.nyxPortrait,
      IMAGE_ASSETS.aiPortrait,
      IMAGE_ASSETS.mechanicPortrait
    ].forEach((src) => src && sources.add(src));

    IMAGE_ASSETS.asteroids.forEach((src) => sources.add(src));
    IMAGE_ASSETS.debris.forEach((src) => sources.add(src));

    if (phase === 2) {
      IMAGE_ASSETS.centipedesRight.forEach((src) => sources.add(src));
      IMAGE_ASSETS.centipedesLeft.forEach((src) => sources.add(src));
      IMAGE_ASSETS.enemyShips.forEach((src) => sources.add(src));
    }

    return Promise.all([...sources].map((src) => this.loadImage(src))).then(() => true);
  }

  loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve();
        return;
      }

      const image = AssetLoader.get(src);

      if (image.loaded || image.complete) {
        image.loaded = true;
        resolve();
        return;
      }

      const finish = () => {
        image.loaded = true;
        resolve();
      };

      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", resolve, { once: true });
      window.setTimeout(resolve, 900);
    });
  }

  startNextWave() {
    this.wave += 1;
    this.currentPhase = this.wave;

    const continueAfterCentering = () => {
      if (this.wave === 2 && !this.phaseTwoCutscenePlayed) {
        this.phaseTwoCutscenePlayed = true;

        this.playCutscene(STORY.phaseTwo, () => {
          this.state = "playing";
          this.spawnWave();
        });

        return;
      }

      if (this.wave === 3) {
        this.playCutscene(STORY.phaseThree, () => {
          this.state = "playing";
          this.spawnWave();
        });

        return;
      }

      this.state = "playing";
      this.spawnWave();
    };

    if (this.player && this.wave > 1) {
      this.startStageTransition(continueAfterCentering);
      return;
    }

    continueAfterCentering();
  }

  startStageTransition(callback) {
    this.state = "stageTransition";
    this.keys.Space = false;

    this.stageTransition = {
      timer: 0,
      duration: 1.45,
      fromX: this.player.x,
      fromY: this.player.y,
      toX: this.width / 2,
      toY: this.playHeight * 0.58,
      callback
    };

    this.background.startBoost(1.45);
    this.startScreenFade(0.9);
    this.setMission("A ASTROTRON avança para o próximo setor. Transição de estágio iniciada.");
  }

  updateStageTransition(deltaTime) {
    if (!this.stageTransition || !this.player) {
      return;
    }

    this.stageTransition.timer += deltaTime;
    const progress = Utils.clamp(this.stageTransition.timer / this.stageTransition.duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    this.player.x = this.stageTransition.fromX + (this.stageTransition.toX - this.stageTransition.fromX) * eased;
    this.player.y = this.stageTransition.fromY + (this.stageTransition.toY - this.stageTransition.fromY) * eased;
    this.player.vx *= 0.82;
    this.player.vy *= 0.82;
    this.player.angle = -Math.PI / 2;

    this.fadeAlpha = progress < 0.5 ? progress * 0.72 : (1 - progress) * 0.72;

    if (progress >= 1) {
      const callback = this.stageTransition.callback;
      this.stageTransition = null;
      this.fadeAlpha = 0;

      if (callback) {
        callback();
      }
    }
  }
  spawnWave() {
    this.bullets = [];
    this.asteroids = [];
    this.debris = [];
    this.centipedes = [];
    this.enemyShips = [];
    this.enemyBullets = [];
    this.laserSweeps = [];
    this.orbitalTurrets = [];
    this.turretBullets = [];
    this.background.setPhase(this.wave >= 3 ? 3 : this.wave);

    if (this.wave === 1) {
      this.spawnPhaseOne();
      return;
    }

    if (this.wave === 2) {
      this.spawnPhaseTwo();
      return;
    }

    if (this.wave === 3) {
      this.spawnPhaseThree();
      return;
    }

    this.spawnMixedPhase();
  }

  spawnPhaseOne() {
    const uniqueAsteroids = [...IMAGE_ASSETS.asteroids].sort(() => Math.random() - 0.5);

    uniqueAsteroids.forEach((spriteSrc, index) => {
      const size = index < 3 ? GAME_CONFIG.asteroid.large : GAME_CONFIG.asteroid.medium;
      this.spawnAsteroid(size, null, null, spriteSrc);
    });

    for (let i = 0; i < GAME_CONFIG.debris.phaseOneAmount; i += 1) {
      this.debris.push(new SpaceDebris(this.width, this.playHeight, this.debris));
    }

    this.setMission("Fase 1: Cinturão Orfeu. Asteroides únicos e destroços mecânicos em rota de colisão.");
    this.updateUI();
  }

  spawnPhaseTwo() {
    for (let i = 0; i < 2; i += 1) {
      this.spawnAsteroid(GAME_CONFIG.asteroid.small);
    }

    const debrisAmount = Math.min(3, IMAGE_ASSETS.debris.length);

    for (let i = 0; i < debrisAmount; i += 1) {
      this.debris.push(new SpaceDebris(this.width, this.playHeight, this.debris));
    }

    this.centipedes = [];
    this.centipedeSpawnQueue = [...GAME_CONFIG.centipede.stagedWaves];
    this.centipedeWaveTimer = GAME_CONFIG.centipede.stagedDelay;
    this.phaseTwoEnemyTimer = 0;
    this.phaseTwoEnemiesSpawned = false;

    this.setMission("Fase 2: Ruínas Vivas. Assinaturas biomecânicas se aproximam em ondas.");
    this.updateUI();
  }

  spawnPhaseThree() {
    const uniqueAsteroids = [...IMAGE_ASSETS.asteroids].sort(() => Math.random() - 0.5).slice(0, 3);

    uniqueAsteroids.forEach((spriteSrc, index) => {
      const radius = index === 0 ? GAME_CONFIG.asteroid.medium : GAME_CONFIG.asteroid.small;
      const spawnX = this.width * (0.24 + index * 0.26);
      const spawnY = -radius - index * 95;
      const asteroid = this.spawnAsteroid(radius, spawnX, spawnY, spriteSrc, "falling");
      asteroid.vx = Utils.randomRange(index === 1 ? -26 : -16, index === 1 ? 26 : 16);
      asteroid.vy = Utils.randomRange(42, 64);
      asteroid.gravity = Utils.randomRange(1.8, 3.8);
    });

    const debrisAmount = Math.min(6, IMAGE_ASSETS.debris.length);

    for (let i = 0; i < debrisAmount; i += 1) {
      this.debris.push(new SpaceDebris(this.width, this.playHeight, this.debris));
    }

    for (let i = 0; i < 3; i += 1) {
      this.laserSweeps.push(new LaserSweep(this.width, this.playHeight, i));
    }

    for (let i = 0; i < GAME_CONFIG.phaseThree.turretCount; i += 1) {
      this.orbitalTurrets.push(new OrbitalTurret(this.width, this.playHeight, i));
    }

    this.setMission("Fase 3: O Anel da Máquina. Desvie dos feixes e destrua as torres orbitais.");
    this.updateUI();
  }

  spawnMixedPhase() {
    const asteroidAmount = Math.min(3 + this.wave, 9);
    const debrisAmount = Math.min(4, IMAGE_ASSETS.debris.length);

    for (let i = 0; i < asteroidAmount; i += 1) {
      this.spawnAsteroid(Utils.randomRange(GAME_CONFIG.asteroid.small, GAME_CONFIG.asteroid.medium));
    }

    for (let i = 0; i < debrisAmount; i += 1) {
      this.debris.push(new SpaceDebris(this.width, this.playHeight, this.debris));
    }

    this.setMission(`Setor ${this.wave}: a Máquina reorganiza os destroços ao redor da ASTROTRON.`);
    this.updateUI();
  }

  spawnAsteroid(radius, x = null, y = null, spriteSrc = null, behavior = "normal") {
    let spawnX = x;
    let spawnY = y;

    if (spawnX === null || spawnY === null) {
      const edge = Utils.randomInt(0, 3);

      if (edge === 0) {
        spawnX = Utils.randomRange(0, this.width);
        spawnY = -radius;
      } else if (edge === 1) {
        spawnX = this.width + radius;
        spawnY = Utils.randomRange(0, this.playHeight);
      } else if (edge === 2) {
        spawnX = Utils.randomRange(0, this.width);
        spawnY = this.playHeight + radius;
      } else {
        spawnX = -radius;
        spawnY = Utils.randomRange(0, this.playHeight);
      }
    }

    const asteroid = new Asteroid(spawnX, spawnY, radius, this.wave, spriteSrc, behavior);
    this.asteroids.push(asteroid);

    return asteroid;
  }

  completeWave() {
    if (this.state !== "playing") {
      return;
    }

    if (this.wave % GAME_CONFIG.economy.stationInterval === 0) {
      this.openStation();
      return;
    }

    this.startNextWave();
  }

  openStation() {
    this.state = "station";
    this.keys.Space = false;

    const station = STATIONS[Utils.randomInt(0, STATIONS.length - 1)];

    this.elements.stationName.textContent = station.name;
    this.elements.stationDescription.textContent = station.description;

    this.hideAllScreens();
    this.elements.stationScreen.classList.remove("hidden");
    this.setMission("Sinal de posto estelar capturado. Reparos e upgrades disponíveis.");
    this.updateUI();
  }

  repairShip() {
    const cost = GAME_CONFIG.economy.repairCost;

    if (this.score < cost) {
      this.setMission(`Créditos insuficientes para reparo. Custo: ${cost}.`);
      return;
    }

    this.score -= cost;
    this.player.hull = this.player.maxHull;
    this.oxygen = Math.min(100, this.oxygen + 12);

    this.setMission("Casco reparado. Tanque de oxigênio parcialmente estabilizado.");
    this.updateUI();
  }

  leaveStation() {
    this.elements.stationScreen.classList.add("hidden");
    this.startNextWave();
  }

  getUpgradeCost(type) {
    const level = this.player.upgrades[type];

    return GAME_CONFIG.economy.upgradeBaseCost + level * GAME_CONFIG.economy.upgradeCostGrowth;
  }

  openUpgradeScreen(origin = "levelup") {
    this.state = "upgrade";
    this.keys.Space = false;
    this.elements.upgradeCards.innerHTML = "";

    UPGRADE_OPTIONS.forEach((upgrade) => {
      const currentLevel = this.player.upgrades[upgrade.type];
      const isLevelReward = origin === "levelup";
      const cost = isLevelReward ? 0 : this.getUpgradeCost(upgrade.type);
      const canBuy = isLevelReward ? true : this.score >= cost;

      const card = document.createElement("button");
      card.className = canBuy ? "upgrade-card" : "upgrade-card disabled-upgrade";

      card.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <p><strong>Nível atual:</strong> ${currentLevel}</p>
        <p><strong>${isLevelReward ? "Recompensa:" : "Custo:"}</strong> ${isLevelReward ? "evolução gratuita" : `${cost} créditos`}</p>
      `;

      card.addEventListener("click", () => {
        if (!canBuy) {
          this.setMission(`Créditos insuficientes para ${upgrade.name}. Custo: ${cost}.`);
          return;
        }

        this.applyUpgrade(upgrade.type, origin, cost);
      });

      this.elements.upgradeCards.appendChild(card);
    });

    this.hideAllScreens();
    this.elements.upgradeScreen.classList.remove("hidden");

    if (origin === "station") {
      this.setMission("A oficina abre seus braços mecânicos ao redor da ASTROTRON.");
    } else {
      this.setMission("Núcleo carregado. Escolha uma evolução gratuita de nível.");
    }

    this.updateUI();
  }

  applyUpgrade(type, origin, cost) {
    const upgrade = UPGRADE_OPTIONS.find((item) => item.type === type);

    if (cost > 0) {
      this.score -= cost;
    }

    this.player.applyUpgrade(type);
    this.elements.upgradeScreen.classList.add("hidden");

    if (origin === "station") {
      this.state = "station";
      this.elements.stationScreen.classList.remove("hidden");
      this.setMission(`${upgrade.name} instalado. ${cost} créditos consumidos.`);
    } else {
      this.state = "playing";
      this.setMission(`${upgrade.name} instalado. A ASTROTRON evoluiu sem custo.`);
    }

    this.updateUI();
  }

  addXp(amount) {
    const adjustedAmount = amount * GAME_CONFIG.progression.xpMultiplier;

    this.xp += adjustedAmount;

    if (this.xp >= this.xpGoal) {
      this.xp -= this.xpGoal;
      this.xpGoal = Math.round(this.xpGoal * GAME_CONFIG.progression.xpGrowth);

      if (this.state === "playing") {
        this.openUpgradeScreen("levelup");
      }
    }

    this.updateUI();
  }

  update(deltaTime) {
    this.time += deltaTime;
    this.background.update(deltaTime);

    if (this.state === "playing") {
      this.updateGameplay(deltaTime);
    }

    if (this.state === "stageTransition") {
      this.updateStageTransition(deltaTime);
    }

    this.updateScreenFade(deltaTime);
  }

  updateGameplay(deltaTime) {
    this.player.update(deltaTime, this.keys, this.width, this.playHeight);
    this.keepPlayerInsideFlightZone();

    if (this.keys.Space) {
      const bullet = this.player.shoot(this.time);

      if (bullet) {
        this.bullets.push(bullet);
      }
    }

    for (const bullet of this.bullets) {
      bullet.update(deltaTime, this.width, this.playHeight);
    }

    for (const asteroid of this.asteroids) {
      asteroid.update(deltaTime, this.width, this.playHeight);
    }

    for (const item of this.debris) {
      item.update(deltaTime, this.width, this.playHeight, this.debris);
    }

    for (const centipede of this.centipedes) {
      centipede.update(deltaTime, this.width, this.playHeight, this.player);
    }

    this.updateCentipedeWaveSystem(deltaTime);
    this.updateEnemyShipSystem(deltaTime);

    for (const enemyShip of this.enemyShips) {
      enemyShip.update(deltaTime, this.width, this.playHeight, this.player);

      if (enemyShip.canShoot()) {
        this.enemyBullets.push(enemyShip.shoot(this.player));
      }
    }

    for (const enemyBullet of this.enemyBullets) {
      enemyBullet.update(deltaTime, this.width, this.playHeight);
    }

    for (const laserSweep of this.laserSweeps) {
      laserSweep.update(deltaTime, this.width, this.playHeight);
    }

    for (const turret of this.orbitalTurrets) {
      turret.update(deltaTime, this.player);

      if (turret.canShoot()) {
        this.turretBullets.push(turret.shoot(this.player));
      }
    }

    for (const turretBullet of this.turretBullets) {
      turretBullet.update(deltaTime, this.width, this.playHeight);
    }

    for (const particle of this.particles) {
      particle.update(deltaTime);
    }

    this.handleCollisions();

    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
    this.asteroids = this.asteroids.filter((asteroid) => !asteroid.dead);
    this.centipedes = this.centipedes.filter((centipede) => !centipede.dead);
    this.enemyShips = this.enemyShips.filter((enemyShip) => !enemyShip.dead);
    this.enemyBullets = this.enemyBullets.filter((enemyBullet) => !enemyBullet.dead);
    this.orbitalTurrets = this.orbitalTurrets.filter((turret) => !turret.dead);
    this.turretBullets = this.turretBullets.filter((bullet) => !bullet.dead);
    this.particles = this.particles.filter((particle) => !particle.dead);

    const enemiesCleared = this.asteroids.length === 0 &&
      this.centipedes.length === 0 &&
      this.enemyShips.length === 0 &&
      this.orbitalTurrets.length === 0;

    const waitingForEnemyShips = this.wave === 2 &&
      (!this.phaseTwoEnemiesSpawned ||
        this.centipedeSpawnQueue.length > 0 ||
        this.centipedeWaveTimer > 0);

    if (enemiesCleared && !waitingForEnemyShips && this.state === "playing") {
      this.completeWave();
    }

    if (this.player.hull <= 0) {
      this.endGame();
    }

    this.updateUI();
  }

  updateCentipedeWaveSystem(deltaTime) {
    if (this.wave !== 2 || this.centipedeSpawnQueue.length === 0 || this.centipedes.length > 0) {
      return;
    }

    this.centipedeWaveTimer -= deltaTime;

    if (this.centipedeWaveTimer > 0) {
      return;
    }

    const amount = this.centipedeSpawnQueue.shift();

    for (let i = 0; i < amount; i += 1) {
      this.centipedes.push(new CentipedeCreature(this.width, this.playHeight, this.wave));
    }

    if (this.centipedeSpawnQueue.length > 0) {
      this.centipedeWaveTimer = GAME_CONFIG.centipede.stagedDelay + 0.6;
      this.setMission(`Onda biomecânica detectada: ${amount} centopeias presas nos destroços.`);
    } else {
      this.setMission(`Última onda biomecânica detectada: ${amount} centopeias. Elimine-as para revelar a patrulha inimiga.`);
    }
  }

  updateEnemyShipSystem(deltaTime) {
    if (this.wave !== 2 || this.phaseTwoEnemiesSpawned) {
      return;
    }

    if (this.centipedes.length > 0 || this.centipedeSpawnQueue.length > 0 || this.centipedeWaveTimer > 0) {
      this.phaseTwoEnemyTimer = 0;
      return;
    }

    this.phaseTwoEnemyTimer += deltaTime;

    if (this.phaseTwoEnemyTimer >= GAME_CONFIG.enemyShip.phaseTwoDelay) {
      this.enemyShips.push(new EnemyShip(this.width, this.playHeight, -1));
      this.enemyShips.push(new EnemyShip(this.width, this.playHeight, 1));
      this.phaseTwoEnemiesSpawned = true;
      this.setMission("Dois caças inimigos descem do centro superior e abrem um drift circular ao redor da ASTROTRON.");
    }
  }
    handleCollisions() {
    this.handleBulletAsteroidCollisions();
    this.handleBulletCentipedeCollisions();
    this.handleBulletEnemyShipCollisions();
    this.handleEnemyBulletPlayerCollisions();
    this.handlePhaseThreeCollisions();
    this.handlePlayerAsteroidCollisions();
    this.handlePlayerCentipedeCollisions();
  }

  handleBulletAsteroidCollisions() {
    for (const bullet of this.bullets) {
      for (const asteroid of this.asteroids) {
        if (bullet.dead || asteroid.dead) {
          continue;
        }

        if (Utils.circleCollision(bullet, asteroid)) {
          bullet.dead = true;
          asteroid.hit(bullet.damage);
          this.createExplosion(asteroid.x, asteroid.y, "rgba(255, 223, 126, 1)", 0.42, 7);

          if (asteroid.dead) {
            const scoreGain = Math.max(25, Math.round(asteroid.radius * 0.9 + this.wave * 6));
            this.score += scoreGain;
            this.addXp(asteroid.radius * 0.45);

            if (asteroid.radius > GAME_CONFIG.asteroid.minSplitRadius && this.wave !== 1) {
              for (let i = 0; i < 2; i += 1) {
                const child = this.spawnAsteroid(asteroid.radius * 0.55, asteroid.x, asteroid.y, asteroid.spriteSrc);
                child.vx += Utils.randomRange(-80, 80);
                child.vy += Utils.randomRange(-80, 80);
              }
            }
          }
        }
      }
    }
  }

  handleBulletCentipedeCollisions() {
    for (const bullet of this.bullets) {
      for (const centipede of this.centipedes) {
        if (bullet.dead || centipede.dead || centipede.attached) {
          continue;
        }

        if (Utils.circleCollision(bullet, centipede)) {
          bullet.dead = true;
          centipede.hit(bullet.damage);
          this.createExplosion(centipede.x, centipede.y, "rgba(255, 75, 95, 1)", 0.44, 8);

          if (centipede.dead) {
            this.score += 100;
            this.addXp(32);
          }
        }
      }
    }
  }

  handleBulletEnemyShipCollisions() {
    for (const bullet of this.bullets) {
      for (const enemyShip of this.enemyShips) {
        if (bullet.dead || enemyShip.dead) {
          continue;
        }

        if (Utils.circleCollision(bullet, enemyShip)) {
          bullet.dead = true;
          enemyShip.hit(bullet.damage);
          this.createExplosion(enemyShip.x, enemyShip.y, "rgba(255, 49, 72, 1)", 0.55, 10);

          if (enemyShip.dead) {
            this.score += 1000;
            this.addXp(65);
            this.setMission("Caça inimigo abatido. Núcleo da ASTROTRON absorveu energia tática.");
          }
        }
      }
    }
  }

  handleEnemyBulletPlayerCollisions() {
    for (const enemyBullet of this.enemyBullets) {
      if (enemyBullet.dead) {
        continue;
      }

      if (Utils.circleCollision(this.player, enemyBullet)) {
        enemyBullet.dead = true;
        const tookDamage = this.player.takeDamage(enemyBullet.damage);

        if (tookDamage) {
          this.createExplosion(this.player.x, this.player.y, "rgba(255, 49, 72, 1)", 0.65, 9);
          this.setMission("Projétil inimigo atingiu o casco da ASTROTRON.");
        }
      }
    }
  }

  handlePhaseThreeCollisions() {
    for (const bullet of this.bullets) {
      for (const turret of this.orbitalTurrets) {
        if (bullet.dead || turret.dead) {
          continue;
        }

        if (Utils.circleCollision(bullet, turret)) {
          bullet.dead = true;
          turret.hit(bullet.damage);
          this.createExplosion(turret.x, turret.y, "rgba(255, 72, 86, 1)", 0.65, 10);

          if (turret.dead) {
            this.score += 300;
            this.addXp(42);
            this.setMission("Torre orbital destruída. A defesa do Anel enfraquece.");
          }
        }
      }
    }

    for (const turretBullet of this.turretBullets) {
      if (turretBullet.dead) {
        continue;
      }

      if (Utils.circleCollision(this.player, turretBullet)) {
        turretBullet.dead = true;
        const tookDamage = this.player.takeDamage(turretBullet.damage);

        if (tookDamage) {
          this.createExplosion(this.player.x, this.player.y, "rgba(255, 72, 86, 1)", 0.5, 8);
          this.setMission("Projétil orbital atingiu a ASTROTRON.");
        }
      }
    }

    for (const laserSweep of this.laserSweeps) {
      if (laserSweep.collidesWithPlayer(this.player)) {
        laserSweep.hasHitPlayerThisFire = true;
        const tookDamage = this.player.takeDamage(GAME_CONFIG.phaseThree.laserDamage);

        if (tookDamage) {
          this.createExplosion(this.player.x, this.player.y, "rgba(255, 30, 55, 1)", 0.9, 14);
          this.setMission("Feixe de varredura atingiu a nave. Evite as linhas vermelhas carregadas.");
        }
      }
    }
  }

  handlePlayerAsteroidCollisions() {
    for (const asteroid of this.asteroids) {
      if (asteroid.dead) {
        continue;
      }

      if (Utils.circleCollision(this.player, asteroid)) {
        const tookDamage = this.player.takeDamage(Math.round(asteroid.radius * 0.55));

        if (tookDamage) {
          asteroid.dead = true;
          this.createExplosion(this.player.x, this.player.y, "rgba(255, 75, 95, 1)", 0.85, 14);
          this.setMission("Impacto no casco. Estabilizadores tentando compensar.");
        }
      }
    }
  }

  handlePlayerCentipedeCollisions() {
    for (const centipede of this.centipedes) {
      if (centipede.dead || centipede.attached) {
        continue;
      }

      if (Utils.circleCollision(this.player, centipede)) {
        centipede.attachToPlayer(this.player);
        this.centipedeAttachCount += 1;

        if (this.centipedeAttachCount % 2 === 0) {
          this.oxygen = Utils.clamp(this.oxygen - 4, 0, 100);
          this.setMission("IA: Tanque de oxigênio danificado por organismos presos ao casco. Procure um posto de reparos.");
        } else {
          this.setMission("Centopeia biomecânica presa ao casco. Dano parasitário detectado.");
        }

        this.createExplosion(this.player.x, this.player.y, "rgba(255, 75, 95, 1)", 0.55, 10);
        this.updateUI();
      }
    }
  }

  keepPlayerInsideFlightZone() {
    if (!this.player) {
      return;
    }

    const marginX = this.player.radius * 2.15;
    const marginTop = this.player.radius * 1.65;
    const marginBottom = this.player.radius * 3.2;

    const minX = marginX;
    const maxX = this.width - marginX;
    const minY = marginTop;
    const maxY = this.playHeight - marginBottom;

    if (this.player.x < minX) {
      this.player.x = minX;
      this.player.vx = Math.abs(this.player.vx) * 0.25;
    }

    if (this.player.x > maxX) {
      this.player.x = maxX;
      this.player.vx = -Math.abs(this.player.vx) * 0.25;
    }

    if (this.player.y < minY) {
      this.player.y = minY;
      this.player.vy = Math.abs(this.player.vy) * 0.25;
    }

    if (this.player.y > maxY) {
      this.player.y = maxY;
      this.player.vy = -Math.abs(this.player.vy) * 0.25;
    }
  }

  skipPhase() {
    if (!this.player || this.state === "cutscene" || this.state === "menu") {
      return;
    }

    this.bullets = [];
    this.asteroids = [];
    this.debris = [];
    this.centipedes = [];
    this.enemyShips = [];
    this.enemyBullets = [];
    this.laserSweeps = [];
    this.orbitalTurrets = [];
    this.turretBullets = [];
    this.particles = [];
    this.centipedeSpawnQueue = [];
    this.centipedeWaveTimer = 0;

    this.setMission("Comando de depuração: fase pulada.");
    this.completeWave();
  }

  startScreenFade(duration = 0.9) {
    this.fadeAlpha = 1;
    this.fadeHoldTimer = duration;
  }

  updateScreenFade(deltaTime) {
    if (!this.fadeHoldTimer) {
      return;
    }

    this.fadeHoldTimer -= deltaTime;
    const progress = Utils.clamp(this.fadeHoldTimer / 0.9, 0, 1);
    this.fadeAlpha = progress;

    if (this.fadeHoldTimer <= 0) {
      this.fadeAlpha = 0;
      this.fadeHoldTimer = 0;
    }
  }

  createExplosion(x, y, color, power = 1, amount = 12) {
    for (let i = 0; i < amount; i += 1) {
      this.particles.push(new Particle(x, y, color, power));
    }
  }

  endGame() {
    this.state = "gameover";

    const currentHighScore = Number(localStorage.getItem("astrotronHighScore") || 0);
    const newHighScore = Math.max(currentHighScore, this.score);

    localStorage.setItem("astrotronHighScore", String(newHighScore));

    this.elements.finalScore.textContent = this.score;
    this.elements.highScore.textContent = newHighScore;

    this.hideAllScreens();
    this.elements.gameOverScreen.classList.remove("hidden");
    this.setMission("Sinal perdido. A ASTROTRON desapareceu entre os fragmentos.");
  }

  setMission(text) {
    this.elements.missionText.textContent = text;
  }

  updateUI() {
    this.elements.scoreValue.textContent = Utils.formatScore(this.score);
    this.elements.waveValue.textContent = this.wave || 1;

    if (this.elements.levelValue) {
      this.elements.levelValue.textContent = "";
    }

    if (this.elements.interfaceCreditsValue) {
      this.elements.interfaceCreditsValue.textContent = Utils.formatScore(this.score);
    }

    if (this.elements.upgradeCreditsValue) {
      this.elements.upgradeCreditsValue.textContent = Utils.formatScore(this.score);
    }

    const hullPercent = this.player
      ? Utils.clamp((this.player.hull / this.player.maxHull) * 100, 0, 100)
      : 100;

    const xpPercent = Utils.clamp((this.xp / this.xpGoal) * 100, 0, 100);

    this.elements.hullBar.style.width = `${hullPercent}%`;
    this.elements.xpBar.style.width = `${xpPercent}%`;

    if (this.elements.oxygenBar) {
      this.elements.oxygenBar.style.width = `${Utils.clamp(this.oxygen, 0, 100)}%`;
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.background.draw(this.ctx);

    for (const item of this.debris) {
      item.draw(this.ctx);
    }

    for (const asteroid of this.asteroids) {
      asteroid.draw(this.ctx);
    }

    for (const laserSweep of this.laserSweeps) {
      laserSweep.draw(this.ctx);
    }

    for (const turretBullet of this.turretBullets) {
      turretBullet.draw(this.ctx);
    }

    for (const turret of this.orbitalTurrets) {
      turret.draw(this.ctx);
    }

    for (const enemyBullet of this.enemyBullets) {
      enemyBullet.draw(this.ctx);
    }

    for (const enemyShip of this.enemyShips) {
      enemyShip.draw(this.ctx);
    }

    for (const centipede of this.centipedes) {
      centipede.draw(this.ctx);
    }

    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    if (this.player && this.state !== "menu") {
      this.player.draw(this.ctx, this.keys);
    }

    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }

    this.drawPlayableBoundary();
    this.drawVignette();
    this.drawFadeOverlay();
  }

  drawPlayableBoundary() {
    this.ctx.save();
    this.ctx.strokeStyle = "rgba(102, 217, 255, 0.18)";
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.playHeight + 0.5);
    this.ctx.lineTo(this.width, this.playHeight + 0.5);
    this.ctx.stroke();

    const gradient = this.ctx.createLinearGradient(0, this.playHeight - 18, 0, this.playHeight + 12);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.38)");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, this.playHeight - 18, this.width, 30);
    this.ctx.restore();
  }

  drawVignette() {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.1,
      this.width / 2,
      this.height / 2,
      this.width * 0.75
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(0.68, "rgba(0, 0, 0, 0.12)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.72)");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawFadeOverlay() {
    if (this.fadeAlpha <= 0) {
      return;
    }

    this.ctx.save();
    this.ctx.fillStyle = `rgba(0, 0, 0, ${this.fadeAlpha})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrame) / 1000 || 0, 0.033);

    this.lastFrame = timestamp;
    this.update(deltaTime);
    this.draw();

    requestAnimationFrame((nextTimestamp) => this.loop(nextTimestamp));
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new AstrotronGame();
});
