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

    this.level = 1;

    this.upgrades = {
      shield: 0,
      cannon: 0,
      engine: 0
    };

    this.sprite = new Image();
    this.sprite.src = "assets/img/nave-astrotron-sprite.png";
    this.spriteLoaded = false;

    this.sprite.addEventListener("load", () => {
      this.spriteLoaded = true;
});
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

    Utils.wrap(this, width, height);
  }

  shoot(gameTime) {
    if (gameTime - this.lastShot < this.fireRate) {
      return null;
    }

    this.lastShot = gameTime;

    const noseX = this.x + Math.cos(this.angle) * this.radius;
    const noseY = this.y + Math.sin(this.angle) * this.radius;

    return new Bullet(
      noseX,
      noseY,
      this.angle,
      this.bulletSpeed,
      this.bulletDamage
    );
  }

  takeDamage(amount) {
    if (this.invulnerable > 0) {
      return false;
    }

    this.hull -= amount;
    this.invulnerable = GAME_CONFIG.player.invulnerabilityTime;

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

  /*
    A imagem da nave está apontada para cima.
    O sistema de movimento do jogo usa o ângulo apontando para a direita.
    Por isso usamos + Math.PI / 2 para alinhar o sprite com o movimento.
  */
  ctx.rotate(this.angle + Math.PI / 2);

  if (accelerating) {
    this.drawEngineFlame(ctx);
  }

  if (this.spriteLoaded) {
    const spriteWidth = this.radius * 5.2;
    const spriteHeight = spriteWidth * (this.sprite.height / this.sprite.width);

    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(102, 217, 255, 0.45)";

    ctx.drawImage(
      this.sprite,
      -spriteWidth / 2,
      -spriteHeight / 2,
      spriteWidth,
      spriteHeight
    );

    ctx.shadowBlur = 0;
  } else {
    this.drawFallbackShip(ctx);
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

drawEngineFlame(ctx) {
  const flameLength = this.radius * Utils.randomRange(1.2, 1.8);

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(-this.radius * 0.42, this.radius * 1.8);
  ctx.lineTo(0, this.radius * 1.8 + flameLength);
  ctx.lineTo(this.radius * 0.42, this.radius * 1.8);
  ctx.closePath();

  const flameGradient = ctx.createLinearGradient(
    0,
    this.radius * 1.4,
    0,
    this.radius * 3.2
  );

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
    ctx.beginPath();
    ctx.fillStyle = GAME_CONFIG.colors.bullet;
    ctx.shadowBlur = 16;
    ctx.shadowColor = GAME_CONFIG.colors.bullet;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

class Asteroid {
  constructor(x, y, radius, wave) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.wave = wave;

    const speed = Utils.randomRange(35 + wave * 4, 88 + wave * 6);
    const angle = Utils.randomRange(0, Math.PI * 2);

    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.rotation = Utils.randomRange(-1.5, 1.5);
    this.angle = Utils.randomRange(0, Math.PI * 2);

    this.dead = false;
    this.health = this.getHealthBySize();
    this.vertices = this.createVertices();
  }

  getHealthBySize() {
    if (this.radius >= 42) return 3;
    if (this.radius >= 25) return 2;
    return 1;
  }

  createVertices() {
    const amount = Utils.randomInt(9, 14);
    const vertices = [];

    for (let i = 0; i < amount; i++) {
      vertices.push({
        angle: (i / amount) * Math.PI * 2,
        distance: this.radius * Utils.randomRange(0.72, 1.18)
      });
    }

    return vertices;
  }

  update(deltaTime, width, height) {
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

    ctx.beginPath();

    for (let i = 0; i < this.vertices.length; i++) {
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

    ctx.shadowBlur = 14;
    ctx.shadowColor = "rgba(157, 107, 255, 0.55)";

    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
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
