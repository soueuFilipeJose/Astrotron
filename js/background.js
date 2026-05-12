class StarField {
  constructor() {
    this.width = 0;
    this.height = 0;

    this.image = new Image();
    this.image.src = IMAGE_ASSETS?.backgroundPhaseOne || "assets/img/fase1-background.png";
    this.imageLoaded = false;

    this.image.addEventListener("load", () => {
      this.imageLoaded = true;
    });

    this.parallaxOffset = 0;
    this.dustParticles = [];
  }

  resize(width, height) {
    this.width = width;
    this.height = height;
    this.dustParticles = [];

    for (let i = 0; i < 55; i++) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Utils.randomRange(1, 3),
        speed: Utils.randomRange(5, 14),
        alpha: Utils.randomRange(0.12, 0.45)
      });
    }
  }

  update(deltaTime) {
    this.parallaxOffset += deltaTime * 4;

    for (const particle of this.dustParticles) {
      particle.y += particle.speed * deltaTime;

      if (particle.y > this.height + 20) {
        particle.y = -20;
        particle.x = Math.random() * this.width;
      }
    }
  }

  draw(ctx) {
    if (this.imageLoaded) {
      this.drawCoverImage(ctx, this.image, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = "#020308";
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this.drawDepthOverlay(ctx);
    this.drawSpaceDust(ctx);
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

  drawDepthOverlay(ctx) {
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.1,
      this.width / 2,
      this.height / 2,
      this.width * 0.8
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0.05)");
    gradient.addColorStop(0.65, "rgba(0, 0, 0, 0.18)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.72)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "rgba(2, 4, 9, 0.22)";
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
