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
      missionText: document.getElementById("missionText"),

      finalScore: document.getElementById("finalScore"),
      highScore: document.getElementById("highScore"),

      cutsceneChapter: document.getElementById("cutsceneChapter"),
      cutscenePlace: document.getElementById("cutscenePlace"),
      speakerName: document.getElementById("speakerName"),
      dialogueText: document.getElementById("dialogueText"),

      stationName: document.getElementById("stationName"),
      stationDescription: document.getElementById("stationDescription")
    };

    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.state = "menu";
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
    this.stageTransition = null;
    this.fadeAlpha = 0;
    this.stageTransition = null;
    this.fadeAlpha = 0;

    this.score = 0;
    this.wave = 0;
    this.currentPhase = 1;
    this.xp = 0;
    this.xpGoal = GAME_CONFIG.progression.firstXpGoal;

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

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.background.resize(this.width, this.height);

    if (this.player) {
      this.player.x = Utils.clamp(this.player.x, 0, this.width);
      this.player.y = Utils.clamp(this.player.y, 0, this.height);
    }
  }

  startGame() {
    this.state = "cutscene";
    this.score = 0;
    this.wave = 0;
    this.currentPhase = 1;
    this.phaseTwoCutscenePlayed = false;
    this.xp = 0;
    this.xpGoal = GAME_CONFIG.progression.firstXpGoal;
    this.time = 0;

    this.player = new Player(this.width / 2, this.height / 2);
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

    this.hideAllScreens();
    this.elements.startScreen.classList.add("hidden");
    this.setMission("Transmissão de Nyx Varela sendo restaurada.");

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
  }

  playCutscene(cutscene, callback) {
    this.state = "cutscene";
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
    this.elements.cutsceneScreen.classList.add("hidden");
    const callback = this.cutsceneCallback;

    this.currentCutscene = null;
    this.currentDialogueIndex = 0;
    this.cutsceneCallback = null;

    if (callback) {
      callback();
    }
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
      toY: this.height * 0.58,
      callback
    };

    this.background.startBoost(1.45);
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
      this.debris.push(new SpaceDebris(this.width, this.height, this.debris));
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
      this.debris.push(new SpaceDebris(this.width, this.height, this.debris));
    }

    for (let i = 0; i < GAME_CONFIG.centipede.phaseTwoAmount; i += 1) {
      this.centipedes.push(new CentipedeCreature(this.width, this.height, this.wave));
    }

    this.phaseTwoEnemyTimer = 0;
    this.phaseTwoEnemiesSpawned = false;

    this.setMission("Fase 2: Enxame Biomecânico. Em dois segundos, caças inimigos entram no setor.");
    this.updateUI();
  }


  spawnPhaseThree() {
    const uniqueAsteroids = [...IMAGE_ASSETS.asteroids].sort(() => Math.random() - 0.5).slice(0, 3);

    uniqueAsteroids.forEach((spriteSrc, index) => {
      const radius = index === 0 ? GAME_CONFIG.asteroid.medium : GAME_CONFIG.asteroid.small;
      const spawnX = this.width * (0.24 + index * 0.26);
      const spawnY = -radius - index * 95;
      const asteroid = this.spawnAsteroid(radius, spawnX, spawnY, spriteSrc, "falling");
      asteroid.vx = Utils.randomRange(index === 1 ? -42 : -22, index === 1 ? 42 : 22);
      asteroid.vy = Utils.randomRange(96, 138);
      asteroid.gravity = Utils.randomRange(8, 14);
    });

    const debrisAmount = Math.min(6, IMAGE_ASSETS.debris.length);

    for (let i = 0; i < debrisAmount; i += 1) {
      this.debris.push(new SpaceDebris(this.width, this.height, this.debris));
    }

    for (let i = 0; i < 3; i += 1) {
      this.laserSweeps.push(new LaserSweep(this.width, this.height, i));
    }

    for (let i = 0; i < GAME_CONFIG.phaseThree.turretCount; i += 1) {
      this.orbitalTurrets.push(new OrbitalTurret(this.width, this.height, i));
    }

    this.setMission("Fase 3: O Anel da Máquina. Desvie dos feixes e destrua as torres orbitais.");
    this.updateUI();
  }

  spawnMixedPhase() {
    const asteroidAmount = Math.min(5 + this.wave, 13);
    const centipedeAmount = Math.min(3 + Math.floor(this.wave / 2), 9);

    for (let i = 0; i < asteroidAmount; i += 1) {
      this.spawnAsteroid(i % 2 === 0 ? GAME_CONFIG.asteroid.medium : GAME_CONFIG.asteroid.large);
    }

    const debrisAmount = Math.floor(GAME_CONFIG.debris.phaseOneAmount * 0.55);

    for (let i = 0; i < debrisAmount; i += 1) {
      this.debris.push(new SpaceDebris(this.width, this.height, this.debris));
    }

    for (let i = 0; i < centipedeAmount; i += 1) {
      this.centipedes.push(new CentipedeCreature(this.width, this.height, this.wave));
    }

    this.setMission(`Setor ${this.wave}: a Máquina mistura rocha, metal e vida biomecânica.`);
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
      }

      if (edge === 1) {
        spawnX = this.width + radius;
        spawnY = Utils.randomRange(0, this.height);
      }

      if (edge === 2) {
        spawnX = Utils.randomRange(0, this.width);
        spawnY = this.height + radius;
      }

      if (edge === 3) {
        spawnX = -radius;
        spawnY = Utils.randomRange(0, this.height);
      }
    }

    const asteroid = new Asteroid(spawnX, spawnY, radius, this.wave, spriteSrc, behavior);
    this.asteroids.push(asteroid);
    return asteroid;
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrame) / 1000 || 0, 0.033);
    this.lastFrame = timestamp;
    this.time += deltaTime;

    this.background.update(deltaTime);

    if (this.state === "playing") {
      this.updateGameplay(deltaTime);
    }

    if (this.state === "stageTransition") {
      this.updateStageTransition(deltaTime);
    }

    this.draw();
    requestAnimationFrame((newTimestamp) => this.loop(newTimestamp));
  }

  updateGameplay(deltaTime) {
    this.player.update(deltaTime, this.keys, this.width, this.height);

    if (this.keys.Space) {
      const bullet = this.player.shoot(this.time);

      if (bullet) {
        this.bullets.push(bullet);
      }
    }

    for (const bullet of this.bullets) {
      bullet.update(deltaTime, this.width, this.height);
    }

    for (const asteroid of this.asteroids) {
      asteroid.update(deltaTime, this.width, this.height);
    }

    for (const debris of this.debris) {
      debris.update(deltaTime, this.width, this.height, this.debris);
    }

    for (const centipede of this.centipedes) {
      centipede.update(deltaTime, this.width, this.height, this.player);
    }

    this.updateEnemyShipSystem(deltaTime);

    for (const enemyShip of this.enemyShips) {
      enemyShip.update(deltaTime, this.width, this.height, this.player);

      if (enemyShip.canShoot()) {
        this.enemyBullets.push(enemyShip.shoot(this.player));
      }
    }

    for (const enemyBullet of this.enemyBullets) {
      enemyBullet.update(deltaTime, this.width, this.height);
    }

    for (const laserSweep of this.laserSweeps) {
      laserSweep.update(deltaTime, this.width, this.height);
    }

    for (const turret of this.orbitalTurrets) {
      turret.update(deltaTime, this.player);

      if (turret.canShoot()) {
        this.turretBullets.push(turret.shoot(this.player));
      }
    }

    for (const turretBullet of this.turretBullets) {
      turretBullet.update(deltaTime, this.width, this.height);
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

    const enemiesCleared = this.asteroids.length === 0 && this.centipedes.length === 0 && this.enemyShips.length === 0 && this.orbitalTurrets.length === 0;
    const waitingForEnemyShips = this.wave === 2 && !this.phaseTwoEnemiesSpawned;

    if (enemiesCleared && !waitingForEnemyShips && this.state === "playing") {
      this.completeWave();
    }

    if (this.player.hull <= 0 && this.state === "playing") {
      this.endGame();
    }

    this.updateUI();
  }

  completeWave() {
    const shouldVisitStation = this.wave % GAME_CONFIG.economy.stationInterval === 0;

    if (shouldVisitStation) {
      this.openStation();
      return;
    }

    this.startNextWave();
  }

  openStation() {
    this.state = "station";
    const station = STATIONS[(this.wave / GAME_CONFIG.economy.stationInterval - 1) % STATIONS.length];

    this.elements.stationName.textContent = station.name;
    this.elements.stationDescription.textContent = station.description;
    this.hideAllScreens();

    this.playCutscene(STORY.station, () => {
      this.state = "station";
      this.elements.stationScreen.classList.remove("hidden");
      this.setMission(`${station.name}: reparos, módulos e descanso antes do próximo setor.`);
    });
  }

  repairShip() {
    if (!this.player) {
      return;
    }

    const repairCost = GAME_CONFIG.economy.repairCost;

    if (this.score < repairCost) {
      this.setMission(`Créditos insuficientes. Reparo custa ${repairCost}.`);
      return;
    }

    if (this.player.hull >= this.player.maxHull) {
      this.setMission("O casco já está em condição máxima.");
      return;
    }

    this.score -= repairCost;
    this.player.hull = Math.min(this.player.maxHull, this.player.hull + 55);
    this.setMission("Casco reparado. A ASTROTRON voltou a respirar.");
    this.updateUI();
  }

  leaveStation() {
    this.elements.stationScreen.classList.add("hidden");
    this.setMission("Nyx deixa o posto para trás. O vazio se abre novamente.");
    this.startNextWave();
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


  updateEnemyShipSystem(deltaTime) {
    if (this.wave !== 2 || this.phaseTwoEnemiesSpawned) {
      return;
    }

    if (this.centipedes.length > 0) {
      this.phaseTwoEnemyTimer = 0;
      return;
    }

    this.phaseTwoEnemyTimer += deltaTime;

    if (this.phaseTwoEnemyTimer >= GAME_CONFIG.enemyShip.phaseTwoDelay) {
      this.enemyShips.push(new EnemyShip(this.width, this.height, -1));
      this.enemyShips.push(new EnemyShip(this.width, this.height, 1));
      this.phaseTwoEnemiesSpawned = true;
      this.setMission("Dois caças inimigos descem do centro superior e abrem um drift circular ao redor da ASTROTRON.");
    }
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
          this.createExplosion(bullet.x, bullet.y, "rgba(255, 223, 126, 1)", 0.7, 8);

          if (asteroid.dead) {
            this.destroyAsteroid(asteroid);
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
          this.createExplosion(centipede.x, centipede.y, "rgba(255, 75, 95, 1)", 0.75, 12);

          if (centipede.dead) {
            this.score += 100;
            this.addXp(20);
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
          this.createExplosion(enemyShip.x, enemyShip.y, "rgba(255, 49, 72, 1)", 0.8, 14);

          if (enemyShip.dead) {
            this.score += 1000;
            this.addXp(34);
            this.setMission("Caça inimigo destruído. O setor fica um pouco menos hostil.");
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
          this.createExplosion(this.player.x, this.player.y, "rgba(255, 49, 72, 1)", 0.65, 10);
          this.setMission("Disparo inimigo atingiu o casco da ASTROTRON.");
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
        const damage = Math.round(asteroid.radius * 0.85);
        const tookDamage = this.player.takeDamage(damage);

        if (tookDamage) {
          this.createExplosion(this.player.x, this.player.y, "rgba(255, 75, 95, 1)", 1.2, 20);
          this.setMission("Impacto direto. O casco da ASTROTRON está comprometido.");

          const pushAngle = Math.atan2(this.player.y - asteroid.y, this.player.x - asteroid.x);
          this.player.vx += Math.cos(pushAngle) * 180;
          this.player.vy += Math.sin(pushAngle) * 180;

          if (this.player.hull <= 0) {
            this.endGame();
          }
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
        this.createExplosion(this.player.x, this.player.y, "rgba(255, 75, 95, 1)", 0.55, 10);
        this.setMission("Centopeia biomecânica presa ao casco. Dano parasitário detectado.");
      }
    }
  }

  destroyAsteroid(asteroid) {
    const scoreGain = Math.max(25, Math.round(asteroid.radius * 0.9 + this.wave * 6));
    const xpGain = Math.round(asteroid.radius * 0.95);

    this.score += scoreGain;
    this.addXp(xpGain);
    this.createExplosion(asteroid.x, asteroid.y, "rgba(102, 217, 255, 1)", 1.1, 22);

    if (this.wave !== 1 && asteroid.radius > GAME_CONFIG.asteroid.minSplitRadius) {
      const newRadius = asteroid.radius > 35 ? GAME_CONFIG.asteroid.medium : GAME_CONFIG.asteroid.small;

      for (let i = 0; i < 2; i += 1) {
        const child = new Asteroid(asteroid.x, asteroid.y, newRadius, this.wave);
        child.vx += Utils.randomRange(-95, 95);
        child.vy += Utils.randomRange(-95, 95);
        this.asteroids.push(child);
      }
    }
  }

  addXp(amount) {
    this.xp += amount * (GAME_CONFIG.progression.xpMultiplier || 1);

    if (this.xp >= this.xpGoal && this.state === "playing") {
      this.xp -= this.xpGoal;
      this.xpGoal = Math.round(this.xpGoal * GAME_CONFIG.progression.xpGrowth);
      this.openUpgradeScreen("levelup");
    }
  }

  getUpgradeCost(type) {
    const currentLevel = this.player.upgrades[type];
    return GAME_CONFIG.economy.upgradeBaseCost + currentLevel * GAME_CONFIG.economy.upgradeCostGrowth;
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
    this.elements.levelValue.textContent = this.player ? `Nível ${this.player.level}` : "Nível 1";

    const hullPercent = this.player
      ? Utils.clamp((this.player.hull / this.player.maxHull) * 100, 0, 100)
      : 100;

    const xpPercent = Utils.clamp((this.xp / this.xpGoal) * 100, 0, 100);

    this.elements.hullBar.style.width = `${hullPercent}%`;
    this.elements.xpBar.style.width = `${xpPercent}%`;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.background.draw(this.ctx);
    this.drawMachineSilhouette();

    for (const debris of this.debris) {
      debris.draw(this.ctx);
    }

    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
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

    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }

    if (this.player) {
      this.player.draw(this.ctx, this.keys);
    }

    this.drawVignette();
    this.drawFadeOverlay();
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

  drawMachineSilhouette() {
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = this.wave === 1 ? 0.08 : 0.15;
    ctx.strokeStyle = this.wave === 2
      ? "rgba(255, 75, 95, 0.38)"
      : "rgba(185, 230, 255, 0.42)";
    ctx.lineWidth = 1;

    const centerX = this.width * 0.73;
    const centerY = this.height * 0.36;
    const size = Math.min(this.width, this.height) * 0.34;

    ctx.translate(centerX, centerY);
    ctx.rotate(-0.18);

    for (let i = 0; i < 7; i += 1) {
      const offset = i * 22;

      ctx.strokeRect(
        -size / 2 + offset,
        -size / 2 + offset * 0.3,
        size - offset * 1.4,
        size - offset * 0.8
      );
    }

    ctx.beginPath();
    ctx.moveTo(-size * 0.6, 0);
    ctx.lineTo(size * 0.58, 0);
    ctx.moveTo(0, -size * 0.6);
    ctx.lineTo(0, size * 0.58);
    ctx.stroke();

    ctx.restore();
  }

  drawVignette() {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.22,
      this.width / 2,
      this.height / 2,
      this.width * 0.78
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.58)");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new AstrotronGame();
});
