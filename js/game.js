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
    this.particles = [];

    this.score = 0;
    this.wave = 0;
    this.xp = 0;
    this.xpGoal = GAME_CONFIG.progression.firstXpGoal;

    this.time = 0;
    this.lastFrame = 0;

    this.currentCutscene = null;
    this.currentDialogueIndex = 0;
    this.cutsceneCallback = null;
    this.dialogueTimer = 0;
    this.dialogueAutoDelay = 4.2;

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
    this.xp = 0;
    this.xpGoal = GAME_CONFIG.progression.firstXpGoal;
    this.time = 0;

    this.player = new Player(this.width / 2, this.height / 2);
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];

    this.hideAllScreens();
    this.elements.startScreen.classList.add("hidden");

    this.setMission("Transmissão de Nyx Varela sendo restaurada...");

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
    this.dialogueTimer = 0;

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

    this.dialogueTimer = 0;
  }

  nextDialogue() {
    if (this.state !== "cutscene") return;

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
    this.dialogueTimer = 0;

    if (callback) {
      callback();
    }
  }

  startNextWave() {
    this.wave += 1;

    if (this.wave === 3) {
      this.playCutscene(STORY.sectorThree, () => {
        this.state = "playing";
        this.spawnWave();
      });

      return;
    }

    this.state = "playing";
    this.spawnWave();
  }

  spawnWave() {
    const amount = Math.min(3 + this.wave, 14);

    for (let i = 0; i < amount; i++) {
      this.spawnAsteroid(GAME_CONFIG.asteroid.large);
    }

    this.setMission(`Setor ${this.wave}: campo de fragmentos detectado. Sobreviva e colete núcleos.`);
    this.updateUI();
  }

  spawnAsteroid(radius, x = null, y = null) {
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

    this.asteroids.push(new Asteroid(spawnX, spawnY, radius, this.wave));
  }

  loop(timestamp) {
    const deltaTime = Math.min((timestamp - this.lastFrame) / 1000 || 0, 0.033);
    this.lastFrame = timestamp;

    this.time += deltaTime;
    this.background.update(deltaTime);

    if (this.state === "playing") {
      this.updateGameplay(deltaTime);
    }

    if (this.state === "cutscene") {
      this.updateCutscene(deltaTime);
    }

    this.draw();

    requestAnimationFrame((newTimestamp) => this.loop(newTimestamp));
  }

  updateCutscene(deltaTime) {
    this.dialogueTimer += deltaTime;

    if (this.dialogueTimer >= this.dialogueAutoDelay) {
      this.nextDialogue();
    }
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

    for (const particle of this.particles) {
      particle.update(deltaTime);
    }

    this.handleCollisions();

    this.bullets = this.bullets.filter((bullet) => !bullet.dead);
    this.asteroids = this.asteroids.filter((asteroid) => !asteroid.dead);
    this.particles = this.particles.filter((particle) => !particle.dead);

    if (this.asteroids.length === 0 && this.state === "playing") {
      this.completeWave();
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
    if (!this.player) return;

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
    for (const bullet of this.bullets) {
      for (const asteroid of this.asteroids) {
        if (bullet.dead || asteroid.dead) continue;

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

    for (const asteroid of this.asteroids) {
      if (asteroid.dead) continue;

      if (Utils.circleCollision(this.player, asteroid)) {
        const damage = Math.round(asteroid.radius * 0.9);
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

  destroyAsteroid(asteroid) {
    const scoreGain = Math.round(asteroid.radius * 13 + this.wave * 12);
    const xpGain = Math.round(asteroid.radius * 1.4);

    this.score += scoreGain;
    this.addXp(xpGain);

    this.createExplosion(asteroid.x, asteroid.y, "rgba(102, 217, 255, 1)", 1.1, 22);

    if (asteroid.radius > GAME_CONFIG.asteroid.minSplitRadius) {
      const newRadius = asteroid.radius > 35
        ? GAME_CONFIG.asteroid.medium
        : GAME_CONFIG.asteroid.small;

      for (let i = 0; i < 2; i++) {
        const child = new Asteroid(asteroid.x, asteroid.y, newRadius, this.wave);
        child.vx += Utils.randomRange(-95, 95);
        child.vy += Utils.randomRange(-95, 95);
        this.asteroids.push(child);
      }
    }
  }

  addXp(amount) {
    this.xp += amount;

    if (this.xp >= this.xpGoal && this.state === "playing") {
      this.xp -= this.xpGoal;
      this.xpGoal = Math.round(this.xpGoal * GAME_CONFIG.progression.xpGrowth);

      this.openUpgradeScreen("levelup");
    }
  }

  openUpgradeScreen(origin = "levelup") {
    this.state = "upgrade";
    this.keys.Space = false;

    this.elements.upgradeCards.innerHTML = "";

    UPGRADE_OPTIONS.forEach((upgrade) => {
      const currentLevel = this.player.upgrades[upgrade.type];

      const card = document.createElement("button");
      card.className = "upgrade-card";
      card.innerHTML = `
        <div class="upgrade-icon">${upgrade.icon}</div>
        <h3>${upgrade.name}</h3>
        <p>${upgrade.description}</p>
        <p><strong>Nível atual:</strong> ${currentLevel}</p>
      `;

      card.addEventListener("click", () => {
        this.applyUpgrade(upgrade.type, origin);
      });

      this.elements.upgradeCards.appendChild(card);
    });

    this.hideAllScreens();
    this.elements.upgradeScreen.classList.remove("hidden");

    if (origin === "station") {
      this.setMission("A oficina abre seus braços mecânicos ao redor da ASTROTRON.");
    } else {
      this.setMission("Núcleo carregado. A nave exige evolução.");
    }

    this.updateUI();
  }

  applyUpgrade(type, origin) {
    const upgrade = UPGRADE_OPTIONS.find((item) => item.type === type);

    this.player.applyUpgrade(type);

    this.elements.upgradeScreen.classList.add("hidden");

    if (origin === "station") {
      this.state = "station";
      this.elements.stationScreen.classList.remove("hidden");
    } else {
      this.state = "playing";
    }

    this.setMission(`${upgrade.name} instalado. A ASTROTRON responde diferente agora.`);
    this.updateUI();
  }

  createExplosion(x, y, color, power = 1, amount = 12) {
    for (let i = 0; i < amount; i++) {
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

    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    for (const asteroid of this.asteroids) {
      asteroid.draw(this.ctx);
    }

    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }

    if (this.player) {
      this.player.draw(this.ctx, this.keys);
    }

    this.drawVignette();
  }

  drawMachineSilhouette() {
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(185, 230, 255, 0.55)";
    ctx.lineWidth = 1;

    const centerX = this.width * 0.73;
    const centerY = this.height * 0.36;
    const size = Math.min(this.width, this.height) * 0.34;

    ctx.translate(centerX, centerY);
    ctx.rotate(-0.18);

    for (let i = 0; i < 7; i++) {
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
