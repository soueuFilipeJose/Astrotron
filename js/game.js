class NebulaRaidersGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    this.elements = {
      startScreen: document.getElementById("startScreen"),
      upgradeScreen: document.getElementById("upgradeScreen"),
      gameOverScreen: document.getElementById("gameOverScreen"),
      startBtn: document.getElementById("startBtn"),
      restartBtn: document.getElementById("restartBtn"),
      upgradeCards: document.getElementById("upgradeCards"),
      scoreValue: document.getElementById("scoreValue"),
      waveValue: document.getElementById("waveValue"),
      levelValue: document.getElementById("levelValue"),
      hullBar: document.getElementById("hullBar"),
      xpBar: document.getElementById("xpBar"),
      missionText: document.getElementById("missionText"),
      finalScore: document.getElementById("finalScore"),
      highScore: document.getElementById("highScore")
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

      if (event.code === "KeyR" && this.state === "gameover") {
        this.startGame();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.keys[event.code] = false;
    });

    this.elements.startBtn.addEventListener("click", () => this.startGame());
    this.elements.restartBtn.addEventListener("click", () => this.startGame());
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
    this.state = "playing";

    this.score = 0;
    this.wave = 0;
    this.xp = 0;
    this.xpGoal = GAME_CONFIG.progression.firstXpGoal;
    this.time = 0;

    this.player = new Player(this.width / 2, this.height / 2);
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];

    this.elements.startScreen.classList.add("hidden");
    this.elements.upgradeScreen.classList.add("hidden");
    this.elements.gameOverScreen.classList.add("hidden");

    this.setMission("Sinal confirmado. Avance pelo primeiro campo de fragmentos.");
    this.startNextWave();
    this.updateUI();
  }

  startNextWave() {
    this.wave += 1;

    const amount = Math.min(3 + this.wave, 13);

    for (let i = 0; i < amount; i++) {
      this.spawnAsteroid(GAME_CONFIG.asteroid.large);
    }

    this.setMission(`Setor ${this.wave} detectado. ${amount} fragmentos hostis se aproximam.`);
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
      this.update(deltaTime);
    }

    this.draw();

    requestAnimationFrame((newTimestamp) => this.loop(newTimestamp));
  }

  update(deltaTime) {
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
      this.startNextWave();
    }

    this.updateUI();
  }

  handleCollisions() {
    for (const bullet of this.bullets) {
      for (const asteroid of this.asteroids) {
        if (bullet.dead || asteroid.dead) continue;

        if (Utils.circleCollision(bullet, asteroid)) {
          bullet.dead = true;
          asteroid.hit(bullet.damage);

          this.createExplosion(bullet.x, bullet.y, "rgba(255, 235, 138, 1)", 0.7, 8);

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
          this.createExplosion(this.player.x, this.player.y, "rgba(255, 85, 119, 1)", 1.2, 20);
          this.setMission("Impacto crítico! O casco da nave foi danificado.");

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
    const scoreGain = Math.round(asteroid.radius * 12 + this.wave * 10);
    const xpGain = Math.round(asteroid.radius * 1.35);

    this.score += scoreGain;
    this.addXp(xpGain);

    this.createExplosion(asteroid.x, asteroid.y, "rgba(87, 232, 255, 1)", 1.1, 22);

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

      this.openUpgradeScreen();
    }
  }

  openUpgradeScreen() {
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
        this.applyUpgrade(upgrade.type);
      });

      this.elements.upgradeCards.appendChild(card);
    });

    this.elements.upgradeScreen.classList.remove("hidden");
    this.setMission("A nave absorveu energia suficiente para uma evolução.");
    this.updateUI();
  }

  applyUpgrade(type) {
    const upgrade = UPGRADE_OPTIONS.find((item) => item.type === type);

    this.player.applyUpgrade(type);

    this.elements.upgradeScreen.classList.add("hidden");
    this.state = "playing";

    this.setMission(`${upgrade.name} instalado. Continue avançando pelos fragmentos.`);
    this.updateUI();
  }

  createExplosion(x, y, color, power = 1, amount = 12) {
    for (let i = 0; i < amount; i++) {
      this.particles.push(new Particle(x, y, color, power));
    }
  }

  endGame() {
    this.state = "gameover";

    const currentHighScore = Number(localStorage.getItem("nebulaRaidersHighScore") || 0);
    const newHighScore = Math.max(currentHighScore, this.score);

    localStorage.setItem("nebulaRaidersHighScore", String(newHighScore));

    this.elements.finalScore.textContent = this.score;
    this.elements.highScore.textContent = newHighScore;
    this.elements.gameOverScreen.classList.remove("hidden");

    this.setMission("Transmissão encerrada. A nave perdeu contato com a base.");
  }

  setMission(text) {
    this.elements.missionText.textContent = text;
  }

  updateUI() {
    this.elements.scoreValue.textContent = Utils.formatScore(this.score);
    this.elements.waveValue.textContent = this.wave || 1;
    this.elements.levelValue.textContent = this.player ? this.player.level : 1;

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

  drawVignette() {
    const gradient = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.2,
      this.width / 2,
      this.height / 2,
      this.width * 0.75
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.48)");

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new NebulaRaidersGame();
});
