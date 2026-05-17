class StarField {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.currentPhase = 1;
    this.backgrounds = {};
    this.currentImage = null;
    this.currentImageLoaded = false;
    this.dustParticles = [];
    this.boostTimer = 0;
    this.boostDuration = 0;
    this.streaks = [];

    this.loadBackground(1, IMAGE_ASSETS.backgrounds.phaseOne);
    this.loadBackground(2, IMAGE_ASSETS.backgrounds.phaseTwo);
    this.loadBackground(3, IMAGE_ASSETS.backgrounds.phaseThree);
    this.setPhase(1);
  }

  loadBackground(phase, src) {
    const image = new Image();
    image.src = src;
    image.loaded = false;

    image.addEventListener("load", () => {
      image.loaded = true;

      if (phase === this.currentPhase) {
        this.currentImageLoaded = true;
      }
    });

    image.addEventListener("error", () => {
      console.warn("Background não encontrado:", src);
    });

    this.backgrounds[phase] = image;
  }

  setPhase(phase) {
    this.currentPhase = phase;
    this.currentImage = this.backgrounds[phase] || this.backgrounds[1];
    this.currentImageLoaded = Boolean(this.currentImage && this.currentImage.loaded);
  }

  startBoost(duration = 1.4) {
    this.boostTimer = duration;
    this.boostDuration = duration;
    this.streaks = [];

    for (let i = 0; i < 64; i += 1) {
      this.streaks.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        length: Utils.randomRange(80, 230),
        speed: Utils.randomRange(520, 980),
        alpha: Utils.randomRange(0.15, 0.55)
      });
    }
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.dustParticles = [];

    for (let i = 0; i < 55; i += 1) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Utils.randomRange(1, 3),
        speed: Utils.randomRange(4, 11),
        alpha: Utils.randomRange(0.12, 0.42)
      });
    }
  }

  update(deltaTime) {
    const boostPower = this.boostTimer > 0 ? 1 + this.getBoostProgress() * 6 : 1;

    for (const particle of this.dustParticles) {
      particle.y += particle.speed * deltaTime * boostPower;

      if (particle.y > this.height + 20) {
        particle.y = -20;
        particle.x = Math.random() * this.width;
      }
    }

    if (this.boostTimer > 0) {
      this.boostTimer -= deltaTime;

      for (const streak of this.streaks) {
        streak.y += streak.speed * deltaTime;

        if (streak.y > this.height + streak.length) {
          streak.y = -streak.length;
          streak.x = Math.random() * this.width;
        }
      }
    }
  }

  getBoostProgress() {
    if (this.boostDuration <= 0) {
      return 0;
    }

    return Utils.clamp(this.boostTimer / this.boostDuration, 0, 1);
  }

  draw(ctx) {
    this.currentImageLoaded = Boolean(this.currentImage && this.currentImage.loaded);

    if (this.currentImageLoaded) {
      this.drawCoverImage(ctx, this.currentImage, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#020308";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this.drawDepthOverlay(ctx);
    this.drawSpaceDust(ctx);
    this.drawBoostStreaks(ctx);
  }

  drawCoverImage(ctx, image, x, y, width, height) {
    const imageRatio = image.width / image.height;
    const canvasRatio = width / height;

    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (imageRatio > canvasRatio) {
      drawHeight = height;
      drawWidth = height * imageRatio;
      offsetX = (width - drawWidth) / 2;
    } else {
      drawWidth = width;
      drawHeight = width / imageRatio;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.drawImage(image, x + offsetX, y + offsetY, drawWidth, drawHeight);
  }

  drawSpaceDust(ctx) {
    for (const particle of this.dustParticles) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(210, 230, 255, ${particle.alpha})`;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawBoostStreaks(ctx) {
    if (this.boostTimer <= 0) {
      return;
    }

    const progress = this.getBoostProgress();

    ctx.save();
    ctx.globalAlpha = progress;

    for (const streak of this.streaks) {
      const gradient = ctx.createLinearGradient(streak.x, streak.y - streak.length, streak.x, streak.y);
      gradient.addColorStop(0, "rgba(102, 217, 255, 0)");
      gradient.addColorStop(0.5, `rgba(102, 217, 255, ${streak.alpha})`);
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(streak.x, streak.y - streak.length);
      ctx.lineTo(streak.x, streak.y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawDepthOverlay(ctx) {
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.1,
      this.width / 2,
      this.height / 2,
      this.width * 0.8
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0.03)");
    gradient.addColorStop(0.65, "rgba(0, 0, 0, 0.2)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.72)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "rgba(2, 4, 9, 0.15)";
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
