const AssetLoader = {
  cache: new Map(),

  get(src) {
    if (!this.cache.has(src)) {
      const image = new Image();
      image.src = src;
      image.loaded = false;

      image.addEventListener("load", () => {
        image.loaded = true;
      });

      image.addEventListener("error", () => {
        console.warn("Imagem não encontrada:", src);
      });

      this.cache.set(src, image);
    }

    return this.cache.get(src);
  },

  random(list) {
    return this.get(list[Utils.randomInt(0, list.length - 1)]);
  }
};

class Player {
  constructor(x, y) {
    const config = GAME_CONFIG.player;

    this.x = x;
    this.y = y;
    this.radius = config.radius;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;

    this.maxHull = config.maxHull;
    this.hull = this.maxHull;
    this.thrust = config.thrust;
    this.maxSpeed = config.maxSpeed;
    this.rotationSpeed = config.rotationSpeed;
    this.friction = config.friction;
    this.fireRate = config.fireRate;
    this.bulletSpeed = config.bulletSpeed;
    this.bulletDamage = config.bulletDamage;
    this.lastShot = -999;
    this.invulnerable = config.invulnerabilityTime;
    this.redFlash = 0;
    this.level = 1;

    this.upgrades = {
      shield: 0,
      cannon: 0,
      engine: 0
    };

    this.sprite = AssetLoader.get(IMAGE_ASSETS.player);
    this.attachedParasites = [];
  }

  update(deltaTime, keys, width, height) {
    const accelerating = keys.KeyW || keys.ArrowUp;
    const braking = keys.KeyS || keys.ArrowDown;
    const turningLeft = keys.KeyA || keys.ArrowLeft;
    const turningRight = keys.KeyD || keys.ArrowRight;

    if (turningLeft) {
      this.angle -= this.rotationSpeed * deltaTime;
    }

    if (turningRight) {
      this.angle += this.rotationSpeed * deltaTime;
    }

    if (accelerating) {
      this.vx += Math.cos(this.angle) * this.thrust * deltaTime;
      this.vy += Math.sin(this.angle) * this.thrust * deltaTime;
    }

    if (braking) {
      this.vx *= 0.965;
      this.vy *= 0.965;
    }

    const speed = Math.hypot(this.vx, this.vy);

    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }

    this.vx *= this.friction;
    this.vy *= this.friction;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;

    if (this.invulnerable > 0) {
      this.invulnerable -= deltaTime;
    }

    if (this.redFlash > 0) {
      this.redFlash -= deltaTime;
    }

    this.updateParasites(deltaTime);
    Utils.wrap(this, width, height);
  }

  updateParasites(deltaTime) {
    for (const parasite of this.attachedParasites) {
      parasite.timer -= deltaTime;

      if (!parasite.damageApplied && parasite.timer <= GAME_CONFIG.centipede.attachDuration * 0.55) {
        parasite.damageApplied = true;
        this.hull -= GAME_CONFIG.centipede.attachDamage;
        this.redFlash = 0.35;
      }
    }

    this.attachedParasites = this.attachedParasites.filter((parasite) => parasite.timer > 0);
  }

  attachParasite(creature) {
    this.attachedParasites.push({
      sprite: creature.sprite,
      offsetX: Utils.randomRange(-this.radius * 0.7, this.radius * 0.7),
      offsetY: Utils.randomRange(-this.radius * 1.1, this.radius * 1.1),
      rotation: Utils.randomRange(-0.9, 0.9),
      timer: GAME_CONFIG.centipede.attachDuration,
      damageApplied: false
    });

    this.redFlash = 0.55;
  }

  shoot(gameTime) {
    if (gameTime - this.lastShot < this.fireRate) {
      return null;
    }

    this.lastShot = gameTime;

    const noseX = this.x + Math.cos(this.angle) * this.radius;
    const noseY = this.y + Math.sin(this.angle) * this.radius;

    return new Bullet(noseX, noseY, this.angle, this.bulletSpeed, this.bulletDamage);
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) {
      return false;
    }

    this.hull -= amount;
    this.invulnerable = GAME_CONFIG.player.invulnerabilityTime;
    this.redFlash = 0.35;

    return true;
  }

  applyUpgrade(type) {
    this.level += 1;
    this.upgrades[type] += 1;

    if (type === "shield") {
      this.maxHull += 28;
      this.hull = Math.min(this.maxHull, this.hull + 65);
    }

    if (type === "cannon") {
      this.fireRate = Math.max(0.08, this.fireRate * 0.84);
      this.bulletSpeed += 55;
      this.bulletDamage += 0.45;
    }

    if (type === "engine") {
      this.thrust += 42;
      this.maxSpeed += 38;
      this.rotationSpeed += 0.35;
    }
  }

  draw(ctx, keys) {
    const accelerating = keys.KeyW || keys.ArrowUp;
    const flicker = this.invulnerable > 0 && Math.floor(this.invulnerable * 14) % 2 === 0;

    if (flicker) {
      ctx.globalAlpha = 0.45;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    if (accelerating) {
      this.drawEngineFlame(ctx);
    }

    if (this.sprite.loaded) {
      const spriteWidth = this.radius * 5.46;
      const spriteHeight = spriteWidth * (this.sprite.height / this.sprite.width);

      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(102, 217, 255, 0.45)";
      ctx.drawImage(this.sprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
      ctx.shadowBlur = 0;
    } else {
      this.drawFallbackShip(ctx);
    }

    this.drawAttachedParasites(ctx);
    this.drawRedDamageOverlay(ctx);

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawAttachedParasites(ctx) {
    for (const parasite of this.attachedParasites) {
      ctx.save();
      ctx.translate(parasite.offsetX, parasite.offsetY);
      ctx.rotate(parasite.rotation);

      if (parasite.sprite.loaded) {
        const width = this.radius * 2.3;
        const height = width * (parasite.sprite.height / parasite.sprite.width);
        ctx.drawImage(parasite.sprite, -width / 2, -height / 2, width, height);
      } else {
        ctx.fillStyle = "rgba(255, 75, 95, 0.85)";
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 0.7, this.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  drawRedDamageOverlay(ctx) {
    if (this.redFlash <= 0) {
      return;
    }

    ctx.save();
    ctx.globalAlpha = Math.min(this.redFlash * 1.7, 0.45);
    ctx.fillStyle = "rgba(255, 55, 70, 0.75)";
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 2.9, this.radius * 2.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawEngineFlame(ctx) {
    const flameLength = this.radius * Utils.randomRange(1.2, 1.8);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.42, this.radius * 1.8);
    ctx.lineTo(0, this.radius * 1.8 + flameLength);
    ctx.lineTo(this.radius * 0.42, this.radius * 1.8);
    ctx.closePath();

    const flameGradient = ctx.createLinearGradient(0, this.radius * 1.4, 0, this.radius * 3.2);
    flameGradient.addColorStop(0, "rgba(102, 217, 255, 0.95)");
    flameGradient.addColorStop(0.45, "rgba(255, 184, 107, 0.75)");
    flameGradient.addColorStop(1, "rgba(255, 75, 95, 0)");

    ctx.fillStyle = flameGradient;
    ctx.shadowBlur = 24;
    ctx.shadowColor = "rgba(102, 217, 255, 0.9)";
    ctx.fill();
    ctx.restore();
  }

  drawFallbackShip(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -this.radius * 1.4);
    ctx.lineTo(this.radius * 1.1, this.radius * 1.1);
    ctx.lineTo(0, this.radius * 0.65);
    ctx.lineTo(-this.radius * 1.1, this.radius * 1.1);
    ctx.closePath();

    ctx.fillStyle = "#66d9ff";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }
}

class Bullet {
  constructor(x, y, angle, speed, damage) {
    this.x = x;
    this.y = y;
    this.radius = GAME_CONFIG.bullet.radius;
    this.angle = angle;
    this.speed = speed;
    this.damage = damage;
    this.life = GAME_CONFIG.bullet.lifetime;
    this.dead = false;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.trail = [];
  }

  update(deltaTime, width, height) {
    this.trail.push({ x: this.x, y: this.y, life: 0.16 });

    if (this.trail.length > 7) {
      this.trail.shift();
    }

    for (const point of this.trail) {
      point.life -= deltaTime;
    }

    this.trail = this.trail.filter((point) => point.life > 0);

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;

    if (this.life <= 0) {
      this.dead = true;
    }

    Utils.wrap(this, width, height);
  }

  draw(ctx) {
    const tailX = this.x - Math.cos(this.angle) * (GAME_CONFIG.bullet.trailLength || 34);
    const tailY = this.y - Math.sin(this.angle) * (GAME_CONFIG.bullet.trailLength || 34);

    ctx.save();
    ctx.lineCap = "round";
    ctx.shadowBlur = 12;
    ctx.shadowColor = GAME_CONFIG.colors.bullet;

    const gradient = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
    gradient.addColorStop(0, "rgba(255, 223, 126, 0)");
    gradient.addColorStop(0.45, "rgba(255, 223, 126, 0.55)");
    gradient.addColorStop(1, "rgba(255, 255, 240, 1)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = GAME_CONFIG.bullet.width || 2;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.restore();
  }
}

class Asteroid {
  constructor(x, y, radius, wave, spriteSrc = null, behavior = "normal") {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.wave = wave;
    this.behavior = behavior;
    this.spriteSrc = spriteSrc;
    this.sprite = spriteSrc ? AssetLoader.get(spriteSrc) : AssetLoader.random(IMAGE_ASSETS.asteroids);
    this.spriteScale = Utils.randomRange(1.5, 2.2) * 1.07;

    const speed = Utils.randomRange(38 + wave * 5, 98 + wave * 8);
    const angle = Utils.randomRange(0, Math.PI * 2);

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    if (this.behavior === "falling") {
      this.vx = Utils.randomRange(-34, 34);
      this.vy = Utils.randomRange(44, 70);
      this.gravity = Utils.randomRange(1.8, 4.2);
    } else {
      this.gravity = 0;
    }

    this.rotation = Utils.randomRange(-1.15, 1.15);
    this.angle = Utils.randomRange(0, Math.PI * 2);
    this.dead = false;
    this.health = this.getHealthBySize();
    this.vertices = this.createVertices();
  }

  getHealthBySize() {
    if (this.radius >= 42) {
      return 3;
    }

    if (this.radius >= 25) {
      return 2;
    }

    return 1;
  }

  createVertices() {
    const amount = Utils.randomInt(9, 14);
    const vertices = [];

    for (let i = 0; i < amount; i += 1) {
      vertices.push({
        angle: (i / amount) * Math.PI * 2,
        distance: this.radius * Utils.randomRange(0.72, 1.18)
      });
    }

    return vertices;
  }

  update(deltaTime, width, height) {
    if (this.behavior === "falling") {
      this.vy += this.gravity * deltaTime;
    }

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.angle += this.rotation * deltaTime;
    Utils.wrap(this, width, height);
  }

  hit(damage) {
    this.health -= damage;

    if (this.health <= 0) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.sprite.loaded) {
      const size = this.radius * this.spriteScale;

      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255, 75, 95, 0.22)";
      ctx.drawImage(this.sprite, -size / 2, -size / 2, size, size);
      ctx.shadowBlur = 0;
    } else {
      this.drawFallback(ctx);
    }

    ctx.restore();
  }

  drawFallback(ctx) {
    ctx.beginPath();

    for (let i = 0; i < this.vertices.length; i += 1) {
      const point = this.vertices[i];
      const x = Math.cos(point.angle) * point.distance;
      const y = Math.sin(point.angle) * point.distance;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.fillStyle = "rgba(217, 227, 255, 0.09)";
    ctx.strokeStyle = "rgba(217, 227, 255, 0.82)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }
}

class SpaceDebris {
  constructor(width, height, existingDebris = [], spriteSrc = null) {
    const usedSprites = new Set(existingDebris.map((item) => item.spriteSrc).filter(Boolean));
    const availableSprites = IMAGE_ASSETS.debris.filter((src) => !usedSprites.has(src));

    this.spriteSrc = spriteSrc || availableSprites[0] || IMAGE_ASSETS.debris[0];
    this.sprite = AssetLoader.get(this.spriteSrc);
    this.radius = Utils.randomRange(18, 42) * 3;
    this.depth = Utils.randomRange(0.42, 1.05);
    this.x = 0;
    this.y = 0;

    this.placeWithoutOverlap(width, height, existingDebris);

    const angle = Utils.randomRange(0, Math.PI * 2);
    const speed = Utils.randomRange(4, GAME_CONFIG.debris.phaseOneDriftSpeed);

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.angle = Utils.randomRange(0, Math.PI * 2);
    this.rotation = Utils.randomRange(-0.055, 0.055);
    this.visualRadius = this.radius * 1.15 * this.depth;
  }

  placeWithoutOverlap(width, height, existingDebris) {
    const minDistance = GAME_CONFIG.debris.minDistance || 240;
    let bestPosition = {
      x: Utils.randomRange(width * 0.05, width * 0.95),
      y: Utils.randomRange(height * 0.18, height * 0.92),
      score: -Infinity
    };

    for (let attempt = 0; attempt < 42; attempt += 1) {
      const candidate = {
        x: Utils.randomRange(width * 0.05, width * 0.95),
        y: Utils.randomRange(height * 0.18, height * 0.92)
      };

      let nearest = Infinity;

      for (const other of existingDebris) {
        const distance = Math.hypot(candidate.x - other.x, candidate.y - other.y);
        nearest = Math.min(nearest, distance);
      }

      if (nearest > bestPosition.score) {
        bestPosition = { ...candidate, score: nearest };
      }

      if (nearest >= minDistance) {
        break;
      }
    }

    this.x = bestPosition.x;
    this.y = bestPosition.y;
  }

  update(deltaTime, width, height, allDebris = []) {
    this.x += this.vx * deltaTime * this.depth;
    this.y += this.vy * deltaTime * this.depth;
    this.angle += this.rotation * deltaTime;

    this.applySoftSeparation(deltaTime, allDebris);
    Utils.wrap(this, width, height);
  }

  applySoftSeparation(deltaTime, allDebris) {
    const minDistance = (GAME_CONFIG.debris.minDistance || 240) * 0.82;

    for (const other of allDebris) {
      if (other === this) {
        continue;
      }

      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distance = Math.hypot(dx, dy) || 1;

      if (distance < minDistance) {
        const push = (minDistance - distance) * 0.08 * deltaTime;
        this.x += (dx / distance) * push;
        this.y += (dy / distance) * push;
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.globalAlpha = 0.34 + this.depth * 0.18;
    ctx.filter = `brightness(${78 + Math.round(this.depth * 12)}%)`;

    if (this.sprite.loaded) {
      const size = this.radius * 2.35 * this.depth;
      ctx.drawImage(this.sprite, -size / 2, -size / 2, size, size);
    } else {
      ctx.strokeStyle = "rgba(185, 230, 255, 0.22)";
      ctx.strokeRect(-this.radius, -this.radius * 0.4, this.radius * 2, this.radius * 0.8);
    }

    ctx.filter = "none";
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

class CentipedeCreature {
  constructor(width, height, wave) {
    this.radius = GAME_CONFIG.centipede.radius;
    this.health = GAME_CONFIG.centipede.health + Math.floor(wave / 3);
    this.dead = false;
    this.attached = false;
    this.lostTimer = 0;
    this.wave = wave;

    const edge = Utils.randomInt(0, 3);

    if (edge === 0) {
      this.x = Utils.randomRange(0, width);
      this.y = -60;
    } else if (edge === 1) {
      this.x = width + 60;
      this.y = Utils.randomRange(0, height);
    } else if (edge === 2) {
      this.x = Utils.randomRange(0, width);
      this.y = height + 60;
    } else {
      this.x = -60;
      this.y = Utils.randomRange(0, height);
    }

    this.angle = Utils.randomRange(0, Math.PI * 2);
    this.speed = GAME_CONFIG.centipede.speed + wave * 6;
    this.spriteRight = AssetLoader.random(IMAGE_ASSETS.centipedesRight);
    this.spriteLeft = AssetLoader.random(IMAGE_ASSETS.centipedesLeft);
    this.sprite = this.spriteRight;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
    this.wiggle = Utils.randomRange(0, Math.PI * 2);
  }

  update(deltaTime, width, height, player) {
    this.wiggle += deltaTime * 8;

    if (this.attached) {
      this.lostTimer -= deltaTime;

      if (this.lostTimer <= 0) {
        this.dead = true;
      }

      return;
    }

    const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
    let angleDiff = targetAngle - this.angle;

    while (angleDiff > Math.PI) {
      angleDiff -= Math.PI * 2;
    }

    while (angleDiff < -Math.PI) {
      angleDiff += Math.PI * 2;
    }

    const turnLimit = GAME_CONFIG.centipede.turnSpeed * deltaTime;
    this.angle += Utils.clamp(angleDiff, -turnLimit, turnLimit);

    const wobble = Math.sin(this.wiggle) * 0.38;
    const moveAngle = this.angle + wobble;

    this.vx = Math.cos(moveAngle) * this.speed;
    this.vy = Math.sin(moveAngle) * this.speed;
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.sprite = Math.cos(this.angle) >= 0 ? this.spriteRight : this.spriteLeft;

    Utils.wrap(this, width, height);
  }

  hit(damage) {
    this.health -= damage;

    if (this.health <= 0) {
      this.dead = true;
    }
  }

  attachToPlayer(player) {
    if (this.attached || this.dead) {
      return;
    }

    this.attached = true;
    this.lostTimer = GAME_CONFIG.centipede.attachDuration;
    player.attachParasite(this);
  }

  draw(ctx) {
    if (this.attached) {
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.sprite.loaded) {
      const width = this.radius * 4.5;
      const height = width * (this.sprite.height / this.sprite.width);

      ctx.shadowBlur = 14;
      ctx.shadowColor = "rgba(255, 75, 95, 0.45)";
      ctx.drawImage(this.sprite, -width / 2, -height / 2, width, height);
      ctx.shadowBlur = 0;
    } else {
      this.drawFallback(ctx);
    }

    ctx.restore();
  }

  drawFallback(ctx) {
    ctx.strokeStyle = "rgba(255, 75, 95, 0.9)";
    ctx.lineWidth = 3;

    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.arc(-i * 8, Math.sin(this.wiggle + i) * 4, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}


class EnemyBullet {
  constructor(x, y, angle) {
    const config = GAME_CONFIG.enemyShip;

    this.x = x;
    this.y = y;
    this.radius = 3;
    this.angle = angle;
    this.speed = config.bulletSpeed;
    this.damage = config.bulletDamage;
    this.life = config.bulletLifetime;
    this.dead = false;
    this.trail = [];

    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
  }

  update(deltaTime, width, height) {
    this.trail.push({ x: this.x, y: this.y, life: 0.26 });

    if (this.trail.length > 9) {
      this.trail.shift();
    }

    for (const point of this.trail) {
      point.life -= deltaTime;
    }

    this.trail = this.trail.filter((point) => point.life > 0);

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;

    if (this.life <= 0) {
      this.dead = true;
    }

    Utils.wrap(this, width, height);
  }

  draw(ctx) {
    const tailX = this.x - Math.cos(this.angle) * 42;
    const tailY = this.y - Math.sin(this.angle) * 42;

    ctx.save();
    ctx.lineCap = "round";
    ctx.shadowBlur = 16;
    ctx.shadowColor = GAME_CONFIG.colors.enemyBullet;

    const gradient = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
    gradient.addColorStop(0, "rgba(255, 49, 72, 0)");
    gradient.addColorStop(0.5, "rgba(255, 49, 72, 0.55)");
    gradient.addColorStop(1, "rgba(255, 210, 210, 1)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();

    ctx.restore();
  }
}

class EnemyShip {
  constructor(width, height, side = 1) {
    const config = GAME_CONFIG.enemyShip;

    this.x = width / 2 + side * 18;
    this.y = -110;
    this.radius = config.radius;
    this.health = config.health;
    this.dead = false;
    this.side = side;
    this.sprite = AssetLoader.get(IMAGE_ASSETS.enemyShips[0]);
    this.angle = 0;
    this.phase = side < 0 ? Math.PI : 0;
    this.speed = config.speed;
    this.combatSpeed = config.speed;
    this.fireCooldown = config.entryDuration + Utils.randomRange(0.35, 0.9);
    this.driftSign = side;
    this.entryTimer = 0;
    this.entryComplete = false;
  }

  update(deltaTime, width, height, player) {
    this.phase += deltaTime * GAME_CONFIG.enemyShip.driftSpeed;

    if (!this.entryComplete) {
      this.updateEntry(deltaTime, width, height, player);
      return;
    }

    this.combatSpeed = Math.min(
      GAME_CONFIG.enemyShip.maxCombatSpeed,
      this.combatSpeed + deltaTime * 13
    );

    const orbitAngle = this.phase + (this.side < 0 ? Math.PI : 0);
    const targetX = player.x + Math.cos(orbitAngle) * GAME_CONFIG.enemyShip.driftRadius;
    const targetY = player.y + Math.sin(orbitAngle * 1.2) * (GAME_CONFIG.enemyShip.driftRadius * 0.46);
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    const driftX = -Math.sin(orbitAngle) * 92 * this.driftSign;
    const driftY = Math.cos(orbitAngle) * 58;

    this.x += ((dx / distance) * this.combatSpeed + driftX) * deltaTime;
    this.y += ((dy / distance) * this.combatSpeed + driftY) * deltaTime;
    this.angle = Math.atan2(player.y - this.y, player.x - this.x) + Math.PI / 2;
    this.fireCooldown -= deltaTime;
  }

  updateEntry(deltaTime, width, height, player) {
    this.entryTimer += deltaTime;

    const progress = Utils.clamp(this.entryTimer / GAME_CONFIG.enemyShip.entryDuration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const spread = this.side * GAME_CONFIG.enemyShip.driftRadius * 0.86;
    const entryX = player.x + spread * eased + Math.sin(progress * Math.PI * 2) * 38 * this.side;
    const entryY = -110 + (player.y - GAME_CONFIG.enemyShip.driftRadius * 0.48 + 110) * eased;

    this.x += (entryX - this.x) * Math.min(1, deltaTime * 5.2);
    this.y += (entryY - this.y) * Math.min(1, deltaTime * 5.2);
    this.angle = Math.atan2(player.y - this.y, player.x - this.x) + Math.PI / 2;

    if (progress >= 1) {
      this.entryComplete = true;
      this.fireCooldown = 1.15 + Math.random() * 0.65;
    }
  }

  canShoot() {
    return this.entryComplete && this.fireCooldown <= 0 && !this.dead;
  }

  shoot(player) {
    this.fireCooldown = GAME_CONFIG.enemyShip.fireRate + Utils.randomRange(-0.25, 0.35);
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    return new EnemyBullet(this.x, this.y, angle);
  }

  hit(damage) {
    this.health -= damage;

    if (this.health <= 0) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.sprite.loaded) {
      const width = this.radius * 3.4;
      const height = width * (this.sprite.height / this.sprite.width);

      ctx.shadowBlur = 18;
      ctx.shadowColor = "rgba(255, 49, 72, 0.48)";
      ctx.drawImage(this.sprite, -width / 2, -height / 2, width, height);
      ctx.shadowBlur = 0;
    } else {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255, 49, 72, 0.85)";
      ctx.moveTo(0, -this.radius * 1.35);
      ctx.lineTo(this.radius * 1.2, this.radius * 1.1);
      ctx.lineTo(0, this.radius * 0.65);
      ctx.lineTo(-this.radius * 1.2, this.radius * 1.1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}



class LaserSweep {
  constructor(width, height, index = 0) {
    this.width = width;
    this.height = height;
    this.index = index;
    this.dead = false;
    this.timer = Utils.randomRange(0, 1.6) + index * 0.45;
    this.angle = index % 2 === 0 ? 0 : Math.PI / 2;
    this.offset = Utils.randomRange(0.26, 0.74);
    this.hasHitPlayerThisFire = false;
  }

  update(deltaTime, width, height) {
    this.width = width;
    this.height = height;
    this.timer += deltaTime;

    const cycle = GAME_CONFIG.phaseThree.laserChargeTime + GAME_CONFIG.phaseThree.laserFireTime + GAME_CONFIG.phaseThree.laserCooldown;

    if (this.timer >= cycle) {
      this.timer = 0;
      this.offset = Utils.randomRange(0.24, 0.76);
      this.angle = Math.random() < 0.5 ? 0 : Math.PI / 2;
      this.hasHitPlayerThisFire = false;
    }
  }

  getState() {
    const charge = GAME_CONFIG.phaseThree.laserChargeTime;
    const fire = GAME_CONFIG.phaseThree.laserFireTime;

    if (this.timer < charge) {
      return "charging";
    }

    if (this.timer < charge + fire) {
      return "firing";
    }

    return "cooldown";
  }

  collidesWithPlayer(player) {
    if (this.getState() !== "firing" || this.hasHitPlayerThisFire) {
      return false;
    }

    const linePosition = this.angle === 0 ? this.height * this.offset : this.width * this.offset;
    const playerPosition = this.angle === 0 ? player.y : player.x;
    const distance = Math.abs(playerPosition - linePosition);

    return distance < player.radius * 1.4;
  }

  draw(ctx) {
    const state = this.getState();

    if (state === "cooldown") {
      return;
    }

    const progress = state === "charging"
      ? this.timer / GAME_CONFIG.phaseThree.laserChargeTime
      : 1;

    const alpha = state === "charging" ? 0.12 + progress * 0.28 : 0.78;
    const width = state === "charging" ? 2 + progress * 3 : 12;
    const linePosition = this.angle === 0 ? this.height * this.offset : this.width * this.offset;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = state === "charging" ? "rgba(255, 80, 90, 0.8)" : "rgba(255, 30, 55, 1)";
    ctx.shadowBlur = state === "charging" ? 16 : 28;
    ctx.shadowColor = "rgba(255, 30, 55, 1)";
    ctx.lineWidth = width;

    ctx.beginPath();

    if (this.angle === 0) {
      ctx.moveTo(0, linePosition);
      ctx.lineTo(this.width, linePosition);
    } else {
      ctx.moveTo(linePosition, 0);
      ctx.lineTo(linePosition, this.height);
    }

    ctx.stroke();
    ctx.restore();
  }
}

class TurretBullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.radius = 4.5;
    this.angle = angle;
    this.damage = GAME_CONFIG.phaseThree.turretBulletDamage;
    this.life = 3;
    this.dead = false;
    this.vx = Math.cos(angle) * GAME_CONFIG.phaseThree.turretBulletSpeed;
    this.vy = Math.sin(angle) * GAME_CONFIG.phaseThree.turretBulletSpeed;
  }

  update(deltaTime, width, height) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;

    if (this.life <= 0) {
      this.dead = true;
    }

    Utils.wrap(this, width, height);
  }

  draw(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "rgba(255, 72, 86, 1)";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 72, 86, 1)";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class OrbitalTurret {
  constructor(width, height, index = 0) {
    this.radius = 27;
    this.health = GAME_CONFIG.phaseThree.turretHealth;
    this.dead = false;
    this.index = index;

    const positions = [
      { x: width * 0.22, y: height * 0.33 },
      { x: width * 0.78, y: height * 0.35 },
      { x: width * 0.5, y: height * 0.74 }
    ];

    const position = positions[index % positions.length];

    this.x = position.x;
    this.y = position.y;
    this.angle = 0;
    this.fireCooldown = Utils.randomRange(0.4, 1.4);
  }

  update(deltaTime, player) {
    this.angle = Math.atan2(player.y - this.y, player.x - this.x);
    this.fireCooldown -= deltaTime;
  }

  canShoot() {
    return this.fireCooldown <= 0 && !this.dead;
  }

  shoot(player) {
    this.fireCooldown = GAME_CONFIG.phaseThree.turretFireRate + Utils.randomRange(-0.25, 0.35);
    const angle = Math.atan2(player.y - this.y, player.x - this.x);
    return new TurretBullet(this.x, this.y, angle);
  }

  hit(damage) {
    this.health -= damage;

    if (this.health <= 0) {
      this.dead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.beginPath();
    ctx.fillStyle = "rgba(15, 18, 22, 0.92)";
    ctx.strokeStyle = "rgba(255, 90, 100, 0.9)";
    ctx.lineWidth = 2;
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 55, 70, 0.9)";
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(255, 55, 70, 0.9)";
    ctx.fillRect(0, -4, this.radius * 1.35, 8);
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}


class Particle {
  constructor(x, y, color, power = 1) {
    const angle = Utils.randomRange(0, Math.PI * 2);
    const speed = Utils.randomRange(40, 190) * power;

    this.x = x;
    this.y = y;
    this.radius = Utils.randomRange(1.4, 3.8) * power;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = Utils.randomRange(0.25, 0.75);
    this.maxLife = this.life;
    this.color = color;
  }

  update(deltaTime) {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    this.vx *= 0.985;
    this.vy *= 0.985;
  }

  draw(ctx) {
    const alpha = Math.max(this.life / this.maxLife, 0);

    ctx.beginPath();
    ctx.fillStyle = this.color.replace("1)", `${alpha})`);
    ctx.arc(this.x, this.y, this.radius * alpha, 0, Math.PI * 2);
    ctx.fill();
  }

  get dead() {
    return this.life <= 0;
  }
}
