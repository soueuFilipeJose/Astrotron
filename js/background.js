class StarField {
  constructor() {
    this.width = 0;
    this.height = 0;
    this.layers = [];
    this.nebulaTime = 0;
  }

  resize(width, height) {
    this.width = width;
    this.height = height;

    this.layers = [
      this.createLayer(70, 0.28, 0.9),
      this.createLayer(45, 0.55, 1.5),
      this.createLayer(25, 0.9, 2.2)
    ];
  }

  createLayer(amount, speed, size) {
    const stars = [];

    for (let i = 0; i < amount; i++) {
      stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed,
        size: Utils.randomRange(size * 0.6, size * 1.4),
        alpha: Utils.randomRange(0.35, 0.95)
      });
    }

    return stars;
  }

  update(deltaTime) {
    this.nebulaTime += deltaTime;

    for (const layer of this.layers) {
      for (const star of layer) {
        star.y += star.speed * 22 * deltaTime;

        if (star.y > this.height + 10) {
          star.y = -10;
          star.x = Math.random() * this.width;
        }
      }
    }
  }

  draw(ctx) {
    const glowX = this.width * (0.5 + Math.sin(this.nebulaTime * 0.25) * 0.18);
    const glowY = this.height * (0.5 + Math.cos(this.nebulaTime * 0.2) * 0.14);

    const gradient = ctx.createRadialGradient(
      glowX,
      glowY,
      40,
      glowX,
      glowY,
      Math.max(this.width, this.height) * 0.65
    );

    gradient.addColorStop(0, "rgba(87, 232, 255, 0.12)");
    gradient.addColorStop(0.45, "rgba(157, 107, 255, 0.05)");
    gradient.addColorStop(1, "rgba(3, 5, 13, 1)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const layer of this.layers) {
      for (const star of layer) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
