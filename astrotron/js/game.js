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
